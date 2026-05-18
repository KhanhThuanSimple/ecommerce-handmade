package com.handmade.handmade_api.modules.products.service;

import com.handmade.handmade_api.modules.products.dto.ProductCreateRequest;
import com.handmade.handmade_api.modules.products.dto.ProductResponse;
import com.handmade.handmade_api.modules.products.entity.Product;
import com.handmade.handmade_api.modules.products.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> getAllProducts() {
        // 1. Lấy danh sách mảng dữ liệu thô từ câu lệnh Native SQL
        List<Object[]> rawResults = productRepository.findAllProductsRaw();

        // 2. Map thủ công từng cột dựa theo thứ tự SELECT trong SQL sang đúng thuộc tính của DTO
        return rawResults.stream().map(row -> ProductResponse.builder()
                .id(((Number) row[0]).longValue())             // p.id
                .name((String) row[1])                          // p.name
                .price(((Number) row[2]).doubleValue())         // p.base_price (price của FE)
                .category((String) row[3])                      // c.name (category của FE)
                .categoryId(((Number) row[4]).longValue())      // p.category_id
                .imageUrl((String) row[5])                      // pi.image_url
                .description((String) row[6])                   // p.description
                .inventory(((Number) row[7]).intValue())        // SUM(pv.inventory)
                .rating(((Number) row[8]).doubleValue())        // rating (5.0)
                .commentCount(((Number) row[9]).intValue())     // comment_count (0)
                .viewCount(((Number) row[10]).intValue())       // view_count (0)
                .status((String) row[11])                       // p.status
                .soldCount(((Number) row[12]).intValue())       // p.sold_count
                .build()
        ).collect(Collectors.toList());
    }

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

        return ProductResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .price(saved.getPrice())
                .categoryId(saved.getCategoryId())
                .category(request.getCategory())
                .status(saved.getStatus())
                .inventory(request.getInventory() != null ? request.getInventory() : 0)
                .soldCount(saved.getSoldCount())
                .build();
    }
}