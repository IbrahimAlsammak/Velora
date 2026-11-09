package com.velora.backend.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.CreateOrderRequest;
import com.velora.backend.dto.DeliveryDtos.Quote;
import com.velora.backend.dto.OrderDto;
import com.velora.backend.entity.Order;
import com.velora.backend.entity.OrderItem;
import com.velora.backend.entity.Product;
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

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
                        AuthService authService, DeliveryService deliveryService) {
        this.orderRepository = orderRepository;
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

            String color = checkColor(product, line.color());
            String size = checkSize(product, line.size());

            if (product.getStock() < line.quantity()) {
                String msg = product.getStock() == 0
                        ? product.getName() + " is sold out."
                        : "Only " + product.getStock() + " left of " + product.getName() + ".";
                throw new ResponseStatusException(HttpStatus.CONFLICT, msg);
            }
            product.setStock(product.getStock() - line.quantity()); // saved automatically

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(line.quantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setColor(color);
            item.setSize(size);
            item.setQuantity(line.quantity());
            item.setUnitPrice(product.getPrice());   // price from OUR database, not the browser
            item.setLineTotal(lineTotal);
            order.addItem(item);
        }

        order.setSubtotal(subtotal);
        // Delivery price: the city's own price, or the area's default; free above the store's limit
        Quote delivery = deliveryService.quote(request.region(), request.cityId(), subtotal);
        if (delivery.cityName() != null) {
            order.setCity(delivery.cityName()); // the exact name from the store's list
        }
        order.setShippingCost(delivery.fee());
        order.setTotal(subtotal.add(delivery.fee()));

        return OrderDto.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public OrderDto getOrder(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .map(OrderDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    // ---------- helpers ----------

    /** The colour must be one this product really has (or none, if it has no colours). */
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
