package com.velora.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.AdminDtos.Dashboard;
import com.velora.backend.dto.AdminDtos.OrderDetail;
import com.velora.backend.dto.AdminDtos.OrderAlerts;
import com.velora.backend.dto.AdminDtos.OrderSummary;
import com.velora.backend.dto.AdminDtos.AdminProduct;
import com.velora.backend.entity.Order;
import com.velora.backend.entity.OrderItem;
import com.velora.backend.entity.OrderSource;
import com.velora.backend.entity.OrderStatus;
import com.velora.backend.repository.OrderRepository;
import com.velora.backend.repository.ProductRepository;

/** Admin: dashboard numbers and order management. */
@Service
@Transactional(readOnly = true)
public class AdminOrderService {

    /** Products with this many pieces or fewer show up as "low stock". */
    private static final int LOW_STOCK_LIMIT = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public AdminOrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    public Dashboard dashboard() {
        return new Dashboard(
                orderRepository.count(),
                orderRepository.countByStatus(OrderStatus.PENDING),
                orderRepository.totalSales(),
                productRepository.countByActiveTrue(),
                productRepository.totalStockOfActiveProducts(),
                productRepository.findByActiveTrueAndStockLessThanEqualOrderByStockAsc(LOW_STOCK_LIMIT)
                        .stream().map(AdminProduct::from).toList(),
                orderRepository.findTop5ByOrderByCreatedAtDesc().stream().map(OrderSummary::from).toList());
    }

    /** Asked every 30 seconds by the admin panel, to spot new orders. Small and quick. */
    public OrderAlerts alerts() {
        return new OrderAlerts(
                orderRepository.countByStatus(OrderStatus.PENDING),
                orderRepository.findTop5ByOrderByCreatedAtDesc().stream().map(OrderSummary::from).toList());
    }

    public List<OrderSummary> list(OrderStatus status) {
        List<Order> orders = status == null
                ? orderRepository.findAllByOrderByCreatedAtDesc()
                : orderRepository.findByStatusOrderByCreatedAtDesc(status);
        return orders.stream().map(OrderSummary::from).toList();
    }

    public OrderDetail get(String orderNumber) {
        return OrderDetail.from(find(orderNumber));
    }

    /**
     * Move an order to a new status.
     * Cancelling puts the pieces BACK into stock. A cancelled order can't be reopened.
     */
    @Transactional
    public OrderDetail changeStatus(String orderNumber, OrderStatus newStatus) {
        Order order = find(orderNumber);
        if (order.getStatus() == newStatus) {
            return OrderDetail.from(order);
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This order is cancelled and can't be changed. Ask the customer to order again.");
        }
        if (newStatus == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() == null) {
                    continue; // product was deleted - no stock to put back
                }
                productRepository.findByIdForUpdate(item.getProduct().getId()).ifPresent(p -> {
                    // back to the same colour + size it was taken from
                    p.findVariant(item.getColor(), item.getSize()).ifPresentOrElse(
                            v -> {
                                v.setStock(v.getStock() + item.getQuantity());
                                p.recountStock();
                            },
                            () -> {
                                if (!p.hasOptions()) p.setStock(p.getStock() + item.getQuantity());
                                // (colour/size was removed from the product since - nowhere to put it back)
                            });
                });
            }
        }
        order.setStatus(newStatus);
        return OrderDetail.from(order);
    }

    /**
     * Change the delivery fee of one order. Example: a customer orders twice and you deliver both
     * together -> set the second order's delivery to 0. The total changes; the products don't.
     */
    @Transactional
    public OrderDetail changeDeliveryFee(String orderNumber, BigDecimal fee) {
        Order order = find(orderNumber);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order is cancelled - its delivery can't be changed.");
        }
        order.setShippingCost(fee);
        order.setTotal(order.getSubtotal().add(fee));
        return OrderDetail.from(order);
    }

    /**
     * Delete an order for good. Allowed when:
     *  - it's cancelled (stock was already returned then), or
     *  - it's a manual sale (WhatsApp / Instagram) that is delivered: only the record is removed -
     *    the stock stays exactly as it is (the pieces stay sold) and it leaves the sales report.
     * Website orders must be cancelled first, so they can't be deleted by accident.
     */
    @Transactional
    public void delete(String orderNumber) {
        Order order = find(orderNumber);
        boolean manualSale = order.getSource() != OrderSource.WEBSITE && order.getStatus() == OrderStatus.DELIVERED;
        if (order.getStatus() != OrderStatus.CANCELLED && !manualSale) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only cancelled orders can be deleted. Cancel it first.");
        }
        orderRepository.delete(order); // its order lines are deleted with it (cascade)
    }

    private Order find(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }
}
