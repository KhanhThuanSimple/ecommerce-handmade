package com.handmade.handmade_api.modules.products.service;

import com.handmade.handmade_api.modules.products.dto.ProductCreateRequest;
import com.handmade.handmade_api.modules.products.dto.ProductProjection;
import com.handmade.handmade_api.modules.products.dto.ProductResponse;
import com.handmade.handmade_api.modules.products.entity.Product;
import com.handmade.handmade_api.modules.products.entity.ProductVariant;
import com.handmade.handmade_api.modules.products.repository.ProductRepository;
import com.handmade.handmade_api.modules.products.repository.ProductVariantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
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
    // LUỒNG 1: LẤY DANH SÁCH SẢN PHẨM (ĐÃ SỬA TÊN HÀM)
    public List<ProductResponse> getAllProducts() {
        // Gọi đúng tên phương thức mới đã được lọc status = 'active'
        List<ProductProjection> projections = productRepository.findAllActiveProducts();
        return projections.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    // LUỒNG 2: LẤY CHI TIẾT 1 SẢN PHẨM (An toàn tuyệt đối, không lo ClassCastException)
    public ProductResponse getProductById(Long id) {
        ProductProjection projection = productRepository.findProductDetailRawById(id);
        if (projection == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy sản phẩm với ID: " + id);
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
    public Long getDefaultVariantId(Long productId) {
        return productVariantRepository.findFirstByProductIdOrderByIdAsc(productId)
                .map(ProductVariant::getId)
                .orElse(null);
    }

    public void assertSufficientInventory(Long productId, Integer quantity) {
        int available = getProductById(productId).getInventory();
        if (quantity == null || quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng đặt hàng không hợp lệ");
        }
        if (available < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sản phẩm ID " + productId + " chỉ còn " + available + " trong kho");
        }
    }

    @Transactional
    public void decreaseInventory(Long productId, Integer quantity) {
        ProductVariant variant = productVariantRepository.findFirstByProductIdOrderByIdAsc(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy biến thể kho cho sản phẩm ID: " + productId));

        int currentInventory = variant.getInventory() == null ? 0 : variant.getInventory();
        if (currentInventory < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số lượng tồn kho của sản phẩm ID " + productId + " không đủ!");
        }

        variant.setInventory(currentInventory - quantity);
        productVariantRepository.save(variant);

        productRepository.findById(productId).ifPresent(product -> {
            int sold = product.getSoldCount() == null ? 0 : product.getSoldCount();
            product.setSoldCount(sold + quantity);
            productRepository.save(product);
        });
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