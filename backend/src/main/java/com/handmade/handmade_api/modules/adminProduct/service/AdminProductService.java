package com.handmade.handmade_api.modules.adminProduct.service;


import com.handmade.handmade_api.modules.adminProduct.dto.AdminProductUpdateRequest;
import com.handmade.handmade_api.modules.adminProduct.dto.AdminVariantInventoryUpdateRequest;
import com.handmade.handmade_api.modules.adminProduct.repository.AdminProductRepository;
import com.handmade.handmade_api.modules.adminProduct.repository.AdminProductVariantRepository;
import com.handmade.handmade_api.modules.products.dto.*;
import com.handmade.handmade_api.modules.products.entity.Product;
import com.handmade.handmade_api.modules.products.entity.ProductVariant;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminProductService {

    private final AdminProductRepository productRepository;
    private final AdminProductVariantRepository productVariantRepository;

    public AdminProductService(AdminProductRepository productRepository, AdminProductVariantRepository productVariantRepository) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
    }

    // 1. TÌM KIẾM, LỌC & PHÂN TRANG DANH SÁCH CHO ĐỒNaaaaG BỘ UI ADMIN
    // Thay đổi duy nhất hàm này trong file AdminProductService.java của bạn:
    public Page<ProductResponse> getAdminProducts(
            Long id,
            String keyword,
            Long categoryId,
            String status,
            String inventoryStatus, // Đổi kiểu dữ liệu từ Integer sang String tại đây
            Pageable pageable
    ) {
        // Truyền đầy đủ các biến String đồng bộ xuống Repository
        Page<ProductProjection> projections = productRepository.searchProductsAdmin(
                id, keyword, categoryId, status, inventoryStatus, pageable
        );
        return projections.map(this::convertToResponse);
    }

    // 2. XEM CHI TIẾT SẢN PHẨM (DÙNG ID CHUẨN XÁC)
    public ProductResponse getProductById(Long id) {
        ProductProjection projection = productRepository.findProductDetailRawById(id);
        if (projection == null) {
            throw new RuntimeException("Không tìm thấy sản phẩm quản trị với ID: " + id);
        }
        return convertToResponse(projection);
    }

    // 3. THÊM MỚI SẢN PHẨM & TỰ ĐỘNG KHỞI TẠO BIẾN THỂ MẶC ĐỊNH
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

        return convertToResponse(productRepository.findProductDetailRawById(saved.getId()));
    }

    // 4. CẬP NHẬT TOÀN DIỆN THÔNG TIN SẢN PHẨM
    @Transactional
    public ProductResponse updateProduct(Long id, AdminProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại với ID: " + id));

        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setCategoryId(request.getCategoryId());
        product.setSlug(request.getName().toLowerCase().trim().replaceAll("\\s+", "-"));
        product.setDescription(request.getDescription());
        product.setStatus(request.getStatus());

        productRepository.save(product);
        return convertToResponse(productRepository.findProductDetailRawById(id));
    }

    // 5. CẬP NHẬT NHANH KHO HÀNG (INVENTORY)
    @Transactional
    public void updateInventory(Long productId, AdminVariantInventoryUpdateRequest request) {
        if (request.getInventory() < 0) {
            throw new IllegalArgumentException("Số lượng tồn kho không được nhỏ hơn 0");
        }

        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        if (variants.isEmpty()) {
            throw new RuntimeException("Không tìm thấy dữ liệu biến thể của sản phẩm này!");
        }

        ProductVariant variantToUpdate;
        if (request.getVariantId() != null) {
            variantToUpdate = variants.stream()
                    .filter(v -> v.getId().equals(request.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể chỉ định!"));
        } else {
            variantToUpdate = variants.get(0); // Cập nhật biến thể đầu tiên (Mặc định)
        }

        variantToUpdate.setInventory(request.getInventory());
        productVariantRepository.save(variantToUpdate);
    }

    // 6. THAY ĐỔI TRẠNG THÁI NHANH (BẬT/TẮT KINH DOANH)
    @Transactional
    public void updateStatus(Long id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại!"));
        product.setStatus(status);
        productRepository.save(product);
    }

    // 7. XÓA SẢN PHẨM (KIỂM TRA RÀNG BUỘC ĐƠN HÀNG TRƯỚC KHI XÓA)
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại!"));
        try {
            productRepository.delete(product);
        } catch (Exception e) {
            throw new RuntimeException("Không thể xóa cứng! Sản phẩm này đã phát sinh giao dịch hoặc nằm trong giỏ hàng. Hãy chuyển sang trạng thái 'inactive'.");
        }
    }

    // Hàm ánh xạ đồng bộ từ Projection sang DTO Response
    private ProductResponse convertToResponse(ProductProjection p) {
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .price(p.getPrice())
                .category(p.getCategoryName())
                .categoryId(p.getCategoryId())
                .imageUrl(p.getImageUrl())
                .description(p.getDescription())
                .inventory(p.getTotalInventory())
                .rating(p.getRating())
                .commentCount(p.getCommentCount())
                .viewCount(p.getViewCount())
                .status(p.getStatus())
                .soldCount(p.getSoldCount())
                .build();
    }
    @Transactional
    public String importProductsFromExcel(MultipartFile file) {
        // TRƯỜNG HỢP LỖI 1: File trống rỗng
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File tải lên trống rỗng! Vui lòng chọn lại file.");
        }

        // TRƯỜNG HỢP LỖI 2: Sai định dạng file (Chỉ chấp nhận .xlsx)
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.endsWith(".xlsx")) {
            throw new IllegalArgumentException("Sai định dạng file! Hệ thống chỉ chấp nhận file Excel đuôi .xlsx");
        }

        int successCount = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            // TRƯỜNG HỢP LỖI 3: File Excel không có sheet nào
            if (workbook.getNumberOfSheets() == 0) {
                throw new IllegalArgumentException("File Excel không có dữ liệu (Sheet trống)!");
            }

            Sheet sheet = workbook.getSheetAt(0);

            // TRƯỜNG HỢP LỖI 4: File chỉ có dòng tiêu đề hoặc không có dòng dữ liệu nào
            if (sheet.getLastRowNum() < 1) {
                throw new IllegalArgumentException("File Excel chỉ có tiêu đề, không tìm thấy dữ liệu sản phẩm để nhập kho!");
            }

            // --- KIỂM TRA ĐỊNH DẠNG CẤU TRÚC CỘT (VALIDATE HEADER) ---
            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getLastCellNum() < 6) {
                throw new IllegalArgumentException("Cấu trúc file mẫu sai! File hợp lệ phải có đủ 6 cột: Tên SP, Giá, Mã danh mục, Mô tả, Tồn kho, Trạng thái.");
            }

            // Duyệt từng dòng dữ liệu (Bắt đầu từ dòng thứ 2)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;

                try {
                    // TRƯỜNG HỢP LỖI 5: Sai kiểu dữ liệu trong các ô (Cell Type Error)
                    String name = getCellStringValue(row.getCell(0));
                    Double price = getCellNumericValue(row.getCell(1));
                    Long categoryId = getCellLongValue(row.getCell(2));
                    String description = getCellStringValue(row.getCell(3));
                    Integer inventory = getCellIntValue(row.getCell(4));
                    String status = getCellStringValue(row.getCell(5));

                    // Validate chi tiết nghiệp vụ từng dòng
                    if (name == null || name.trim().isEmpty()) {
                        throw new Exception("Tên sản phẩm không được để trống.");
                    }
                    if (price == null || price < 0) {
                        throw new Exception("Giá sản phẩm phải là số dương.");
                    }
                    if (categoryId == null) {
                        throw new Exception("Mã danh mục phải là số nguyên.");
                    }
                    if (!productRepository.existsCategoryById(categoryId)) {
                        throw new Exception("Mã danh mục (ID: " + categoryId + ") không tồn tại trên hệ thống.");
                    }

                    // Nếu tất cả đều hợp lệ -> Tiến hành lưu
                    Product product = new Product();
                    product.setName(name.trim());
                    product.setPrice(price);
                    product.setCategoryId(categoryId);
                    product.setSlug(name.toLowerCase().trim().replaceAll("\\s+", "-"));
                    product.setDescription(description);
                    product.setStatus(status != null && !status.isEmpty() ? status.trim() : "active");
                    product.setSoldCount(0);

                    Product savedProduct = productRepository.save(product);

                    ProductVariant variant = new ProductVariant();
                    variant.setProductId(savedProduct.getId());
                    variant.setInventory(inventory);
                    productVariantRepository.save(variant);

                    successCount++;
                } catch (Exception e) {
                    // Gom lỗi lại theo từng dòng chứ không làm sập cả quá trình import
                    errors.add("Dòng " + (i + 1) + ": " + e.getMessage());
                }
            }
        } catch (IllegalArgumentException e) {
            // Ném lỗi định dạng file ra ngoài cho Controller hứng
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Đã xảy ra lỗi hệ thống khi đọc dữ liệu Excel: " + e.getMessage());
        }

        // --- TRẢ VỀ BÁO CÁO KẾT QUẢ MINH BẠCH ---
        if (!errors.isEmpty()) {
            return String.format("Nhập dữ liệu hoàn tất một phần!\n- Số lượng thành công: %d sản phẩm.\n- Số dòng lỗi bị bỏ qua: %d dòng.\n\n⚠️ CHI TIẾT CÁC DÒNG LỖI:\n%s",
                    successCount, errors.size(), String.join("\n", errors));
        }
        return String.format("Thành công tuyệt đối! Đã thêm mới toàn bộ %d sản phẩm vào kho hàng.", successCount);
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((long) cell.getNumericCellValue());
        }
        if (cell.getCellType() == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        }
        return cell.getStringCellValue();
    }

    private Double getCellNumericValue(Cell cell) {
        if (cell == null || cell.getCellType() == CellType.BLANK) return null;
        if (cell.getCellType() != CellType.NUMERIC) throw new IllegalArgumentException("Dữ liệu phải là số nguyên/số thập phân.");
        return cell.getNumericCellValue();
    }

    private Long getCellLongValue(Cell cell) {
        if (cell == null || cell.getCellType() == CellType.BLANK) return null;
        if (cell.getCellType() != CellType.NUMERIC) throw new IllegalArgumentException("Mã danh mục phải là số (ID).");
        return (long) cell.getNumericCellValue();
    }

    private Integer getCellIntValue(Cell cell) {
        if (cell == null || cell.getCellType() == CellType.BLANK) return 0;
        if (cell.getCellType() != CellType.NUMERIC) throw new IllegalArgumentException("Số lượng kho phải là số nguyên.");
        return (int) cell.getNumericCellValue();
    }
}