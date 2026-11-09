package com.velora.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.velora.backend.dto.CategoryDto;
import com.velora.backend.dto.HomeDto;
import com.velora.backend.dto.ProductDetailDto;
import com.velora.backend.dto.ProductDto;
import com.velora.backend.service.ProductService;

/**
 * The "waiter" for the shop. Public addresses:
 *   GET /api/categories                 -> all categories
 *   GET /api/products                   -> all products
 *   GET /api/products?category=hijabs   -> products in one category
 *   GET /api/products/{slug}            -> one product
 */
@RestController
@RequestMapping("/api")
public class CatalogController {

    private final ProductService productService;

    public CatalogController(ProductService productService) {
        this.productService = productService;
    }

    /** GET /api/home -> everything the home page shows */
    @GetMapping("/home")
    public HomeDto home() {
        return productService.getHome();
    }

    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return productService.getCategories();
    }

    @GetMapping("/products")
    public List<ProductDto> products(@RequestParam(required = false) String category) {
        return productService.getProducts(category);
    }

    @GetMapping("/products/{slug}")
    public ProductDetailDto product(@PathVariable String slug) {
        return productService.getProduct(slug);
    }
}
