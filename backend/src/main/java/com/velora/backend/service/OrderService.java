package com.velora.backend.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.AdminDtos.ManualItem;
import com.velora.backend.dto.AdminDtos.ManualOrderForm;
import com.velora.backend.dto.CreateOrderRequest;
import com.velora.backend.dto.OrderDto;
import com.velora.backend.entity.Order;
import com.velora.backend.entity.OrderItem;
import com.velora.backend.entity.OrderSource;
import com.velora.backend.entity.OrderStatus;
import com.velora.backend.entity.PaymentMethod;
import com.velora.backend.entity.Product;
import com.velora.backend.entity.VariantStock;
import com.velora.backend.notify.NewOrderEvent;
import com.velora.backend.repository.OrderRepository;
import com.velora.backend.repository.ProductRepository;
import com.velora.backend.util.Phones;

/** Places orders: checks everything, calculates the money, reduces stock, saves. */
@Service
public class OrderService {

    /** All orders are delivered in Lebanon, so customers don't need to type a country. */
    private static final String DELIVERY_COUNTRY = "Lebanon";

    // No 0/O/1/I so customers can't mix them up when reading the number out
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final AuthService authService;
    private final DeliveryService deliveryService;
    private final StoreService storeService;
    private final ApplicationEventPublisher events;
    private final String frontendUrl;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
                        AuthService authService, DeliveryService deliveryService, StoreService storeService,
                        ApplicationEventPublisher events, @Value("${velora.frontend-url}") String frontendUrl) {
        this.orderRepository = orderRepository;
        this.events = events;
        this.frontendUrl = frontendUrl;
        this.storeService = storeService;
        this.productRepository = productRepository;
        this.authService = authService;
        this.deliveryService = deliveryService;
    }

    /**
     * @Transactional = all-or-nothing. If anything fails (e.g. one item is out of stock),
     * NOTHING is saved and no stock is reduced.
     */
    @Transactional
    public OrderDto placeOrder(CreateOrderRequest request, String tokenSubject) {
        storeService.checkOpenForOrders(); // no new orders while the shop is under maintenance
        Order order = new Order();
        order.setOrderNumber(newOrderNumber());
        // Logged in? Save the order to their account. Guest? user stays empty.
        if (tokenSubject != null) {
            authService.findUserIfExists(tokenSubject).ifPresent(order::setUser);
        }
        order.setCustomerName(request.customerName().trim());
        order.setPhone(Phones.normalizeLebanese(request.phone()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Please enter a valid Lebanese phone number, e.g. 03 123 456.")));
        order.setRegion(request.region());
        order.setCity(request.city().trim());
        order.setAddressLine(request.addressLine().trim());
        order.setBuilding(blankToNull(request.building()));
        order.setFloor(blankToNull(request.floor()));
        order.setLandmark(blankToNull(request.landmark()));
        order.setCountry(DELIVERY_COUNTRY); // we only deliver inside Lebanon
        order.setNotes(blankToNull(request.notes()));
        order.setPaymentMethod(request.paymentMethod());

        Map<Long, Product> locked = new HashMap<>();   // each product locked once
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CreateOrderRequest.Item line : request.items()) {
            Product product = locked.computeIfAbsent(line.productId(), id ->
                    productRepository.findByIdForUpdate(id).filter(Product::isActive).orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.BAD_REQUEST, "A product in your bag no longer exists.")));
            // price from OUR database, not the browser
            subtotal = subtotal.add(takeFromStock(order, product, line.color(), line.size(), line.quantity(), product.getPrice()));
        }

        order.setSubtotal(subtotal);
        // Delivery price: the store's one delivery fee (free above the store's limit, if set)
        BigDecimal delivery = deliveryService.quote(subtotal);
        order.setShippingCost(delivery);
        order.setTotal(subtotal.add(delivery));

        Order saved = orderRepository.save(order);
        // Tell the owner's phone (Telegram) - sent only once the order is really saved
        events.publishEvent(new NewOrderEvent(newOrderMessage(saved)));
        return OrderDto.from(saved);
    }

    /**
     * A sale you made yourself on WhatsApp / Instagram (admin only).
     * Saved straight away as DELIVERED: the pieces leave the stock and it counts in the sales report.
     * No Telegram message - you entered it yourself. Works even while the shop is under maintenance.
     */
    @Transactional
    public Order placeManualOrder(ManualOrderForm form) {
        if (form.source() == OrderSource.WEBSITE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose WhatsApp, Instagram or Other.");
        }
        Order order = new Order();
        order.setOrderNumber(newOrderNumber());
        order.setSource(form.source());
        order.setStatus(OrderStatus.DELIVERED);
        order.setCustomerName(form.customerName().trim());
        String phone = blankToNull(form.phone());
        if (phone != null) {
            order.setPhone(Phones.normalizeLebanese(phone).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "The phone number doesn't look right, e.g. 03 123 456 (or leave it empty).")));
        }
        order.setCity(blankToNull(form.city()));
        order.setCountry(DELIVERY_COUNTRY);
        order.setNotes(blankToNull(form.notes()));
        order.setPaymentMethod(form.paymentMethod());

        Map<Long, Product> locked = new HashMap<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (ManualItem line : form.items()) {
            // hidden products (not "Visible in shop") can be sold too
            Product product = locked.computeIfAbsent(line.productId(), id ->
                    productRepository.findByIdForUpdate(id).orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.BAD_REQUEST, "One of the products no longer exists.")));
            BigDecimal price = line.price() != null ? line.price() : product.getPrice(); // the price agreed in the chat
            subtotal = subtotal.add(takeFromStock(order, product, line.color(), line.size(), line.quantity(), price));
        }

        BigDecimal delivery = form.deliveryFee() != null ? form.deliveryFee() : BigDecimal.ZERO;
        order.setSubtotal(subtotal);
        order.setShippingCost(delivery);
        order.setTotal(subtotal.add(delivery));
        return orderRepository.save(order);
    }

    /**
     * Takes the pieces out of stock (of exactly this colour + size) and adds the line to the order.
     * Not enough pieces -> error, and (thanks to @Transactional) nothing at all is saved.
     * @return the line total (price x quantity)
     */
    private BigDecimal takeFromStock(Order order, Product product, String colorChoice, String sizeChoice,
                                     int quantity, BigDecimal unitPrice) {
        String color = checkColor(product, colorChoice);
        String size = checkSize(product, sizeChoice);

        // Products with colours/sizes: check the stock of THIS colour + size only
        VariantStock variant = product.hasOptions()
                ? product.findVariant(color, size).orElse(new VariantStock(color, size, 0))
                : null;
        int available = variant != null ? variant.getStock() : product.getStock();
        if (available < quantity) {
            String what = product.getName() + optionsText(color, size);
            String msg = available == 0 ? what + " is sold out." : "Only " + available + " left of " + what + ".";
            throw new ResponseStatusException(HttpStatus.CONFLICT, msg);
        }
        if (variant != null) {
            variant.setStock(variant.getStock() - quantity);
            product.recountStock();
        } else {
            product.setStock(product.getStock() - quantity);
        } // saved automatically

        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setProductName(product.getName());
        item.setColor(color);
        item.setSize(size);
        item.setQuantity(quantity);
        item.setUnitPrice(unitPrice);
        item.setLineTotal(lineTotal);
        order.addItem(item);
        return lineTotal;
    }

    /** The text of the "new order" phone message. */
    private String newOrderMessage(Order o) {
        StringBuilder text = new StringBuilder();
        text.append("🛍️ New order ").append(o.getOrderNumber()).append("\n\n");
        text.append("👤 ").append(o.getCustomerName()).append(" · ").append(o.getPhone()).append('\n');
        text.append("📍 ").append(o.getCity()).append(" - ").append(o.getAddressLine()).append("\n\n");
        for (OrderItem item : o.getItems()) {
            text.append("• ").append(item.getProductName());
            String options = Stream.of(item.getColor(), item.getSize())
                    .filter(x -> x != null && !x.isBlank())
                    .collect(Collectors.joining(", "));
            if (!options.isEmpty()) {
                text.append(" (").append(options).append(')');
            }
            text.append(" × ").append(item.getQuantity()).append(" - $").append(item.getLineTotal()).append('\n');
        }
        text.append("\nDelivery: $").append(o.getShippingCost());
        text.append("\n💰 Total: $").append(o.getTotal());
        text.append("\n💳 ").append(o.getPaymentMethod() == PaymentMethod.WHISH_TRANSFER ? "Whish transfer" : "Cash on delivery");
        if (o.getNotes() != null) {
            text.append("\n📝 ").append(o.getNotes());
        }
        text.append("\n\nOpen: ").append(frontendUrl).append("/admin/orders/").append(o.getOrderNumber());
        return text.toString();
    }

    @Transactional(readOnly = true)
    public OrderDto getOrder(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .map(OrderDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    // ---------- helpers ----------

    /** The colour must be one this product really has (or none, if it has no colours). */
    /** " (Black, M)" - or nothing for a product without colour/size. */
    private static String optionsText(String color, String size) {
        String options = Stream.of(color, size).filter(x -> x != null).collect(Collectors.joining(", "));
        return options.isEmpty() ? "" : " (" + options + ")";
    }

    private String checkColor(Product product, String color) {
        if (product.getColors().isEmpty()) return null;
        return product.getColors().stream()
                .map(c -> c.getName())
                .filter(name -> name.equals(color))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Please choose a valid colour for " + product.getName() + "."));
    }

    private String checkSize(Product product, String size) {
        if (product.getSizes().isEmpty()) return null;
        if (!product.getSizes().contains(size)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please choose a valid size for " + product.getName() + ".");
        }
        return size;
    }

    private String newOrderNumber() {
        String number;
        do {
            StringBuilder sb = new StringBuilder("VEL-");
            for (int i = 0; i < 8; i++) sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            number = sb.toString();
        } while (orderRepository.existsByOrderNumber(number));
        return number;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
