package com.handmade.handmade_api.modules.products.service;

import com.handmade.handmade_api.modules.products.dto.ProductCreateRequest;
import com.handmade.handmade_api.modules.products.dto.ProductProjection;
import com.handmade.handmade_api.modules.products.dto.ProductResponse;
import com.handmade.handmade_api.modules.products.dto.ProductUpdateRequest;
import com.handmade.handmade_api.modules.products.entity.Product;
import com.handmade.handmade_api.modules.products.entity.ProductVariant;
import com.handmade.handmade_api.modules.products.repository.ProductRepository;
import com.handmade.handmade_api.modules.products.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    public ProductService(ProductRepository productRepository, ProductVariantRepository productVariantRepository) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
    }

    // LUỒNG 1: LẤY DANH SÁCH SẢN PHẨM
    public List<ProductResponse> getAllProducts() {
        List<ProductProjection> projections = productRepository.findAllProductsRaw();
        return projections.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    // LUỒNG 2: LẤY CHI TIẾT 1 SẢN PHẨM (An toàn tuyệt đối, không lo ClassCastException)
    public ProductResponse getProductById(Long id) {
        ProductProjection projection = productRepository.findProductDetailRawById(id);
        if (projection == null) {
            throw new RuntimeException("Không tìm thấy sản phẩm với ID: " + id);
        }
        return convertToResponse(projection);
    }

    // LUỒNG 3: TẠO MỚI SẢN PHẨM
    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setCategoryId(request.getCategoryId());
        product.setSlug(request.getName().toLowerCase().trim().replaceAll("\\s+", "-"));
        product.setDescription(request.getDescription());
        product.setStatus(request.getStatus() != null ? request.getStatus() : "active");
        product.setSoldCount(0);

        Product saved = productRepository.save(product);

        ProductVariant defaultVariant = new ProductVariant();
        defaultVariant.setProductId(saved.getId());
        defaultVariant.setInventory(request.getInventory() != null ? request.getInventory() : 0);
        productVariantRepository.save(defaultVariant);

        return ProductResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .price(saved.getPrice())
                .categoryId(saved.getCategoryId())
                .category(request.getCategory())
                .status(saved.getStatus())
                .inventory(request.getInventory() != null ? request.getInventory() : 0)
                .rating(5.0)
                .commentCount(0)
                .viewCount(0)
                .soldCount(saved.getSoldCount())
                .build();
    }

    @Transactional
    public ProductResponse updateInventory(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));

        if (request.getInventory() != null) {
            int inventoryValue = Math.max(0, request.getInventory());
            List<ProductVariant> variants = productVariantRepository.findByProductId(id);
            if (variants.isEmpty()) {
                ProductVariant defaultVariant = new ProductVariant();
                defaultVariant.setProductId(id);
                defaultVariant.setInventory(inventoryValue);
                productVariantRepository.save(defaultVariant);
            } else {
                ProductVariant defaultVariant = variants.stream()
                        .filter(v -> "Default".equalsIgnoreCase(v.getVariantName()))
                        .findFirst()
                        .orElse(variants.get(0));
                defaultVariant.setInventory(inventoryValue);
                productVariantRepository.save(defaultVariant);
            }
        }

        return getProductById(id);
    }

    @Transactional
    public ProductResponse decreaseInventory(Long id, int reduceBy) {
        if (reduceBy <= 0) {
            return getProductById(id);
        }

        ProductResponse product = getProductById(id);
        if (reduceBy > product.getInventory()) {
            throw new RuntimeException("Số lượng đặt hàng vượt quá tồn kho cho sản phẩm: " + product.getName());
        }

        int newInventory = Math.max(0, product.getInventory() - reduceBy);
        ProductUpdateRequest updateRequest = new ProductUpdateRequest();
        updateRequest.setInventory(newInventory);
        return updateInventory(id, updateRequest);
    }

    /**
     * HÀM CHUYỂN ĐỔI ĐỒNG BỘ TẬP TRUNG
     * Đọc dữ liệu qua các hàm Get có tên tường minh, chống lỗi ép kiểu ngầm của JDBC hoàn toàn
     */
    private ProductResponse convertToResponse(ProductProjection p) {
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .price(p.getPrice())
                .category(p.getCategoryName()) // c.name AS categoryName
                .categoryId(p.getCategoryId())
                .imageUrl(p.getImageUrl())
                .description(p.getDescription())
                .inventory(p.getTotalInventory()) // Khớp tổng SUM(inventory) biến thể
                .rating(p.getRating())
                .commentCount(p.getCommentCount())
                .viewCount(p.getViewCount())
                .status(p.getStatus())
                .soldCount(p.getSoldCount())
                .build();
    }
}