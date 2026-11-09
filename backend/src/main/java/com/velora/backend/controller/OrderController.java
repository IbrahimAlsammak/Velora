package com.velora.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.CreateOrderRequest;
import com.velora.backend.dto.OrderDto;
import com.velora.backend.service.OrderService;

import jakarta.validation.Valid;

/**
 *   POST /api/orders                 -> place an order (from the checkout form)
 *   GET  /api/orders/{orderNumber}   -> see an order (confirmation page)
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED) // 201 = "created"
    public OrderDto place(@Valid @RequestBody CreateOrderRequest request, // @Valid = check the rules
                          @AuthenticationPrincipal Jwt jwt) {               // null for guests
        return orderService.placeOrder(request, jwt == null ? null : jwt.getSubject());
    }

    @GetMapping("/{orderNumber}")
    public OrderDto get(@PathVariable String orderNumber) {
        return orderService.getOrder(orderNumber);
    }
}
