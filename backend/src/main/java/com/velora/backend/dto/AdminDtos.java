package com.velora.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.velora.backend.entity.Category;
import com.velora.backend.entity.Order;
import com.velora.backend.entity.OrderStatus;
import com.velora.backend.entity.Product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Data shapes used only by the admin panel. Admins see MORE than customers (stock numbers, phone, address...). */
public final class AdminDtos {

    private AdminDtos() {}

    // ================= Dashboard =================

    public record Dashboard(
            long totalOrders,
            long pendingOrders,
            BigDecimal totalSales,
            long activeProducts,
            long piecesInStock,
            List<AdminProduct> lowStock,
            List<OrderSummary> recentOrders) {}

    // ================= Orders =================

    /** For the new-order alert: how many orders wait (pending) + the 5 newest orders. */
    public record OrderAlerts(long pendingOrders, List<OrderSummary> newestOrders) {}

    public record OrderSummary(String orderNumber, String status, String paymentMethod, Instant createdAt, String customerName,
                               String city, String region, String country, int itemCount, BigDecimal total) {
        public static OrderSummary from(Order o) {
            int count = o.getItems().stream().mapToInt(i -> i.getQuantity()).sum();
            return new OrderSummary(o.getOrderNumber(), o.getStatus().name(), o.getPaymentMethod().name(), o.getCreatedAt(), o.getCustomerName(),
                    o.getCity(), o.getRegion() == null ? null : o.getRegion().name(), o.getCountry(), count, o.getTotal());
        }
    }

    public record OrderDetail(String orderNumber, String status, String paymentMethod, Instant createdAt,
                              String customerName, String email, String phone,
                              String region, String city, String addressLine, String building, String floor,
                              String landmark, String postalCode, String country, String notes,
                              List<OrderDto.Line> items, BigDecimal subtotal, BigDecimal shippingCost, BigDecimal total) {
        public static OrderDetail from(Order o) {
            return new OrderDetail(o.getOrderNumber(), o.getStatus().name(), o.getPaymentMethod().name(), o.getCreatedAt(),
                    o.getCustomerName(), o.getEmail(), o.getPhone(),
                    o.getRegion() == null ? null : o.getRegion().name(), o.getCity(), o.getAddressLine(),
                    o.getBuilding(), o.getFloor(), o.getLandmark(), o.getPostalCode(), o.getCountry(), o.getNotes(),
                    o.getItems().stream().map(i -> new OrderDto.Line(i.getProductName(), i.getColor(), i.getSize(),
                            i.getQuantity(), i.getUnitPrice(), i.getLineTotal())).toList(),
                    o.getSubtotal(), o.getShippingCost(), o.getTotal());
        }
    }

    public record StatusChange(@NotNull(message = "Choose a status") OrderStatus status) {}

    // ================= Products =================

    public record AdminProduct(Long id, String name, String slug, String description, BigDecimal price,
                               int stock, boolean active, boolean featured, String imageUrl, List<String> images,
                               Long categoryId, String categoryName,
                               List<ProductDetailDto.ColorDto> colors, List<String> sizes,
                               List<ProductDetailDto.VariantDto> variants) {
        public static AdminProduct from(Product p) {
            return new AdminProduct(p.getId(), p.getName(), p.getSlug(), p.getDescription(), p.getPrice(),
                    p.getStock(), p.isActive(), p.isFeatured(), p.getImageUrl(), p.getAllImages(),
                    p.getCategory().getId(), p.getCategory().getName(),
                    p.getColors().stream().map(c -> new ProductDetailDto.ColorDto(c.getName(), c.getHex())).toList(),
                    List.copyOf(p.getSizes()),
                    ProductDetailDto.variantsOf(p));
        }
    }

    /** The product form (add / edit). */
    public record ProductForm(
            @NotBlank(message = "Please enter a name") @Size(max = 150) String name,
            @Size(max = 2000) String description,
            @NotNull(message = "Please enter a price") @DecimalMin(value = "0.01", message = "Price must be more than 0")
            @Digits(integer = 8, fraction = 2, message = "Use a price like 49.99") BigDecimal price,
            @Min(value = 0, message = "Stock can't be negative") @Max(100000) int stock,
            @NotNull(message = "Choose a category") Long categoryId,
            boolean active,
            boolean featured,
            @Size(max = 10, message = "Up to 10 photos per product") List<@Size(max = 255) String> images, // first = main photo
            @Size(max = 20) List<@Valid ColorForm> colors,
            @Size(max = 20) List<@NotBlank @Size(max = 20) String> sizes,
            // stock per colour + size (only used when the product has colours or sizes)
            @Size(max = 400) List<@Valid VariantForm> variants) {}

    /** Stock of one colour + size, typed in the admin product form. */
    public record VariantForm(
            @Size(max = 40) String color,
            @Size(max = 20) String size,
            @Min(value = 0, message = "Stock can't be negative") @Max(100000) int stock) {}

    public record ColorForm(
            @NotBlank(message = "Colour name is required") @Size(max = 40) String name,
            @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Colour code must look like #A1B2C3") String hex) {}

    // ================= Customers =================

    public record CustomerSummary(Long id, String fullName, String phone, String email, Instant createdAt, long orderCount) {}

    // ================= Categories =================

    public record AdminCategory(Long id, String name, String slug, String description, long productCount) {
        public static AdminCategory from(Category c, long productCount) {
            return new AdminCategory(c.getId(), c.getName(), c.getSlug(), c.getDescription(), productCount);
        }
    }

    public record CategoryForm(
            @NotBlank(message = "Please enter a name") @Size(max = 80) String name,
            @Size(max = 500) String description) {}
}
