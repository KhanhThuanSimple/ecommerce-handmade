package com.handmade.handmade_api.modules.adminPayment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsReportService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Async("securityAwareExecutor")
    @PreAuthorize("hasRole('ADMIN')") // Dù chạy ngầm vẫn check quyền bình thường
    public void generateMasterReportAsync() {
        // Lấy thông tin user từ SecurityContext (được DelegatingSecurityContextExecutor mang sang)
        String currentUser = "Unknown";
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        }

        System.out.println("===============================");
        System.out.println("[LUỒNG NGẦM] Tên Thread: " + Thread.currentThread().getName());
        System.out.println("[LUỒNG NGẦM] User đang yêu cầu: " + currentUser);
        System.out.println("[LUỒNG NGẦM] Bắt đầu tổng hợp hàng ngàn records KPI...");
        System.out.println("===============================");

        try {
            // Giả lập thời gian truy vấn SQL nặng 3 giây
            Thread.sleep(3000); 

            // 1. Tạo file Excel bằng Apache POI
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("KPI Report");
            
            // Header
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mục");
            header.createCell(1).setCellValue("Giá trị");

            // Data giả định
            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("Tổng doanh thu");
            row1.createCell(1).setCellValue("1,500,000,000 VND");

            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("Tổng đơn hàng");
            row2.createCell(1).setCellValue("3,200");

            // 2. Lưu file ra ổ cứng
            String fileName = "MasterReport_" + System.currentTimeMillis() + ".xlsx";
            Path dirPath = Paths.get("reports");
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }
            File file = new File(dirPath.toFile(), fileName);
            try (FileOutputStream fos = new FileOutputStream(file)) {
                workbook.write(fos);
            }
            workbook.close();

            System.out.println("[LUỒNG NGẦM] Đã xong! File lưu tại: " + file.getAbsolutePath());

            // 3. Chuẩn bị payload để bắn qua WebSocket kèm link tải
            Map<String, String> payload = new HashMap<>();
            payload.put("status", "success");
            payload.put("message", "✅ Đã tổng hợp xong báo cáo Master KPI.");
            payload.put("user", currentUser);
            payload.put("fileName", fileName); // Gửi tên file về Frontend
            payload.put("timestamp", String.valueOf(System.currentTimeMillis()));

            // Bắn thông báo qua WebSocket
            messagingTemplate.convertAndSend("/topic/admin-notifications", payload);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
