package com.handmade.handmade_api.modules.admin.adminProduct.controller;

import com.handmade.handmade_api.modules.admin.adminProduct.dto.AdminProductUpdateRequest;
import com.handmade.handmade_api.modules.admin.adminProduct.dto.AdminVariantInventoryUpdateRequest;
import com.handmade.handmade_api.modules.admin.adminProduct.service.AdminProductService;
import com.handmade.handmade_api.modules.products.dto.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final AdminProductService adminProductService;

    public AdminProductController(AdminProductService adminProductService) {
        this.adminProductService = adminProductService;
    }

    // [GET] /api/admin/products -> Lấy danh sách kèm bộ lọc đa năng bao gồm cả LỌC KHO HÀNG
    // Thay đổi duy nhất hàm @GetMapping này trong file AdminProductController.java của bạn:
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAdminProducts(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String inventoryStatus, // Đổi tên biến đồng bộ để dễ quản lý
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        // Gọi xuống hàm Service với tham số String inventoryStatus mới cập nhật
        return ResponseEntity.ok(adminProductService.getAdminProducts(id, keyword, categoryId, status, inventoryStatus, pageable));
    }

    // --- Các API khác bênâ dưới giữ nguyên y hệt code cũ của bạn ---
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(adminProductService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        ProductResponse created = adminProductService.createProduct(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody AdminProductUpdateRequest request
    ) {
        return ResponseEntity.ok(adminProductService.updateProduct(id, request));
    }

    @PatchMapping("/{id}/inventory")
    public ResponseEntity<String> updateInventory(
            @PathVariable Long id,
            @RequestBody AdminVariantInventoryUpdateRequest request
    ) {
        adminProductService.updateInventory(id, request);
        return ResponseEntity.ok("Cập nhật số lượng kho hàng thành công!");
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<String> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        adminProductService.updateStatus(id, status);
        return ResponseEntity.ok("Cập nhật trạng thái sản phẩm thành công!");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
        adminProductService.deleteProduct(id);
        return ResponseEntity.ok("Xóa sản phẩm thành công dữ liệu!");
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> importProducts(@RequestParam("file") MultipartFile file) {
        try {
            String resultReport = adminProductService.importProductsFromExcel(file);
            return ResponseEntity.ok(resultReport);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi hệ thống trong quá trình xử lý file: " + e.getMessage());
        }
    }
}