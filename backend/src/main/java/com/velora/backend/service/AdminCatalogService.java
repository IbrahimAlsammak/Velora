package com.velora.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.velora.backend.dto.AdminDtos.AdminCategory;
import com.velora.backend.dto.AdminDtos.AdminProduct;
import com.velora.backend.dto.AdminDtos.CategoryForm;
import com.velora.backend.dto.AdminDtos.ProductForm;
import com.velora.backend.entity.Category;
import com.velora.backend.entity.Product;
import com.velora.backend.entity.ProductColor;
import com.velora.backend.repository.CategoryRepository;
import com.velora.backend.repository.OrderRepository;
import com.velora.backend.repository.ProductRepository;
import com.velora.backend.util.Slugs;

/** Admin: add / edit / hide / delete products and categories. */
@Service
@Transactional(readOnly = true)
public class AdminCatalogService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;

    public AdminCatalogService(ProductRepository productRepository, CategoryRepository categoryRepository,
                               OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
    }

    // ===================== Products =====================

    public List<AdminProduct> listProducts() {
        return productRepository.findAllByOrderByCreatedAtDesc().stream().map(AdminProduct::from).toList();
    }

    public AdminProduct getProduct(Long id) {
        return AdminProduct.from(findProduct(id));
    }

    @Transactional
    public AdminProduct createProduct(ProductForm form) {
        Product p = new Product();
        // The web address is made from the name once, and then stays the same (so shared links keep working)
        p.setSlug(Slugs.unique(form.name(), productRepository::existsBySlug));
        apply(p, form);
        return AdminProduct.from(productRepository.save(p));
    }

    @Transactional
    public AdminProduct updateProduct(Long id, ProductForm form) {
        Product p = findProduct(id);
        apply(p, form);
        return AdminProduct.from(p);
    }

    /** Products that were already ordered can't be deleted (old orders point to them) - hide them instead. */
    @Transactional
    public void deleteProduct(Long id) {
        Product p = findProduct(id);
        if (orderRepository.existsByItemsProductId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This product is in past orders, so it can't be deleted. Untick \"Visible in shop\" to hide it instead.");
        }
        productRepository.delete(p);
    }

    private void apply(Product p, ProductForm form) {
        p.setName(form.name().trim());
        p.setDescription(blankToNull(form.description()));
        p.setPrice(form.price());
        p.setStock(form.stock());
        p.setCategory(findCategory(form.categoryId()));
        p.setActive(form.active());
        p.setFeatured(form.featured());
        // Photos: keep the order you chose; the first one is the main photo
        p.getImages().clear();
        if (form.images() != null) {
            form.images().stream().filter(url -> url != null && !url.isBlank()).map(String::trim)
                    .distinct().forEach(p.getImages()::add);
        }
        p.setImageUrl(p.getImages().isEmpty() ? null : p.getImages().get(0));

        p.getColors().clear();
        if (form.colors() != null) {
            form.colors().forEach(c -> p.getColors().add(new ProductColor(c.name().trim(), c.hex().toUpperCase())));
        }
        p.getSizes().clear();
        if (form.sizes() != null) {
            form.sizes().stream().map(String::trim).distinct().forEach(p.getSizes()::add);
        }
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    // ===================== Categories =====================

    public List<AdminCategory> listCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(c -> AdminCategory.from(c, productRepository.countByCategoryId(c.getId())))
                .toList();
    }

    @Transactional
    public AdminCategory createCategory(CategoryForm form) {
        String name = form.name().trim();
        if (categoryRepository.findAll().stream().anyMatch(c -> c.getName().equalsIgnoreCase(name))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A category called \"" + name + "\" already exists.");
        }
        Category c = new Category(name, Slugs.unique(name, s -> categoryRepository.findBySlug(s).isPresent()),
                blankToNull(form.description()));
        return AdminCategory.from(categoryRepository.save(c), 0);
    }

    @Transactional
    public AdminCategory updateCategory(Long id, CategoryForm form) {
        Category c = findCategory(id);
        String name = form.name().trim();
        if (categoryRepository.findAll().stream().anyMatch(o -> !o.getId().equals(id) && o.getName().equalsIgnoreCase(name))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A category called \"" + name + "\" already exists.");
        }
        c.setName(name);
        c.setDescription(blankToNull(form.description()));
        return AdminCategory.from(c, productRepository.countByCategoryId(id));
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category c = findCategory(id);
        if (productRepository.countByCategoryId(id) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This category still has products. Move or delete them first.");
        }
        categoryRepository.delete(c);
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
