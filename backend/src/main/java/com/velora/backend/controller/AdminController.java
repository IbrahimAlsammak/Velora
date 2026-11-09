package com.velora.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.AdminDtos.AdminCategory;
import com.velora.backend.dto.AdminDtos.AdminProduct;
import com.velora.backend.dto.AdminDtos.CategoryForm;
import com.velora.backend.dto.AdminDtos.Dashboard;
import com.velora.backend.dto.AdminDtos.OrderDetail;
import com.velora.backend.dto.AdminDtos.OrderSummary;
import com.velora.backend.dto.AdminDtos.ProductForm;
import com.velora.backend.dto.AdminDtos.StatusChange;
import com.velora.backend.dto.ReportDtos.Period;
import com.velora.backend.dto.ReportDtos.SalesReport;
import com.velora.backend.entity.OrderStatus;
import com.velora.backend.service.AdminCatalogService;
import com.velora.backend.service.AdminOrderService;
import com.velora.backend.service.ReportService;

import jakarta.validation.Valid;

/**
 * Everything in the admin panel. ALL of /api/admin/** needs an ADMIN token (see SecurityConfig).
 *
 *   GET    /api/admin/dashboard
 *   GET    /api/admin/orders?status=PENDING      GET /api/admin/orders/{number}
 *   PATCH  /api/admin/orders/{number}/status
 *   GET    /api/admin/products                   GET /api/admin/products/{id}
 *   POST   /api/admin/products                   PUT /api/admin/products/{id}     DELETE /api/admin/products/{id}
 *   GET    /api/admin/categories                 POST / PUT {id} / DELETE {id}
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminOrderService orders;
    private final AdminCatalogService catalog;
    private final ReportService reports;

    public AdminController(AdminOrderService orders, AdminCatalogService catalog, ReportService reports) {
        this.orders = orders;
        this.catalog = catalog;
        this.reports = reports;
    }

    // ---------- Dashboard ----------
    @GetMapping("/dashboard")
    public Dashboard dashboard() {
        return orders.dashboard();
    }

    // ---------- Sales report ----------
    /** GET /api/admin/reports/sales?period=DAY|WEEK|MONTH */
    @GetMapping("/reports/sales")
    public SalesReport salesReport(@RequestParam(defaultValue = "DAY") Period period) {
        return reports.sales(period);
    }

    // ---------- Orders ----------
    @GetMapping("/orders")
    public List<OrderSummary> orders(@RequestParam(required = false) OrderStatus status) {
        return orders.list(status);
    }

    @GetMapping("/orders/{orderNumber}")
    public OrderDetail order(@PathVariable String orderNumber) {
        return orders.get(orderNumber);
    }

    @PatchMapping("/orders/{orderNumber}/status")
    public OrderDetail changeStatus(@PathVariable String orderNumber, @Valid @RequestBody StatusChange body) {
        return orders.changeStatus(orderNumber, body.status());
    }

    @DeleteMapping("/orders/{orderNumber}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrder(@PathVariable String orderNumber) {
        orders.delete(orderNumber);
    }

    // ---------- Products ----------
    @GetMapping("/products")
    public List<AdminProduct> products() {
        return catalog.listProducts();
    }

    @GetMapping("/products/{id}")
    public AdminProduct product(@PathVariable Long id) {
        return catalog.getProduct(id);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminProduct createProduct(@Valid @RequestBody ProductForm form) {
        return catalog.createProduct(form);
    }

    @PutMapping("/products/{id}")
    public AdminProduct updateProduct(@PathVariable Long id, @Valid @RequestBody ProductForm form) {
        return catalog.updateProduct(id, form);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        catalog.deleteProduct(id);
    }

    // ---------- Categories ----------
    @GetMapping("/categories")
    public List<AdminCategory> categories() {
        return catalog.listCategories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminCategory createCategory(@Valid @RequestBody CategoryForm form) {
        return catalog.createCategory(form);
    }

    @PutMapping("/categories/{id}")
    public AdminCategory updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryForm form) {
        return catalog.updateCategory(id, form);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        catalog.deleteCategory(id);
    }
}
