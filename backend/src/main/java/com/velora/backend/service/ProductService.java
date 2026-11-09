package com.velora.backend.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.CategoryDto;
import com.velora.backend.dto.HomeDto;
import com.velora.backend.dto.ProductDetailDto;
import com.velora.backend.dto.ProductDto;
import com.velora.backend.entity.Product;
import com.velora.backend.repository.CategoryRepository;
import com.velora.backend.repository.ProductRepository;

/**
 * The "chef": the business logic sits here.
 * Controller (waiter) -> Service (chef) -> Repository (storage room).
 */
@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryDto> getCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(CategoryDto::from)
                .toList();
    }

    /**
     * All products, or only one category's products if a category slug is given.
     * Newest first - but SOLD-OUT products go to the end of the list.
     */
    public List<ProductDto> getProducts(String categorySlug) {
        var products = (categorySlug == null || categorySlug.isBlank())
                ? productRepository.findByActiveTrueOrderByCreatedAtDesc()
                : productRepository.findByActiveTrueAndCategorySlugOrderByCreatedAtDesc(categorySlug);
        return products.stream()
                .sorted(Comparator.comparing((Product p) -> p.getStock() == 0)) // in stock first, keeps "newest" order
                .map(ProductDto::from)
                .toList();
    }

    public ProductDetailDto getProduct(String slug) {
        return productRepository.findBySlugAndActiveTrue(slug)
                .map(ProductDetailDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    /** The home page: ★ featured products, newest arrivals, and category tiles. */
    public HomeDto getHome() {
        var featured = productRepository.findTop8ByActiveTrueAndFeaturedTrueOrderByCreatedAtDesc().stream()
                .map(ProductDto::from).toList();
        var newArrivals = productRepository.findTop4ByActiveTrueAndStockGreaterThanOrderByCreatedAtDesc(0).stream()
                .map(ProductDto::from).toList();
        var categories = categoryRepository.findAllByOrderByNameAsc().stream()
                .map(c -> new HomeDto.HomeCategory(
                        c.getId(), c.getName(), c.getSlug(), c.getDescription(),
                        productRepository.countByActiveTrueAndCategoryId(c.getId()),
                        productRepository
                                .findFirstByActiveTrueAndCategoryIdAndImageUrlIsNotNullOrderByFeaturedDescCreatedAtDesc(c.getId())
                                .map(Product::getImageUrl).orElse(null)))
                .filter(c -> c.productCount() > 0) // don't show empty categories on the home page
                .toList();
        return new HomeDto(featured, newArrivals, categories);
    }
}
