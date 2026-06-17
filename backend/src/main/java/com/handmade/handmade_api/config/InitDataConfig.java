package com.handmade.handmade_api.config;

import com.handmade.handmade_api.modules.auth.entity.Role;
import com.handmade.handmade_api.modules.auth.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Đảm bảo các Role cốt lõi (ROLE_ADMIN, ROLE_USER) luôn tồn tại trong DB
 * khi ứng dụng khởi động ở BẤT KỲ profile nào (dev, prod, test...).
 *
 * Không seed user admin ở đây — DataSeeder đã làm với profile=dev.
 * Trên production, tạo user admin thủ công qua API hoặc SQL migration.
 */
@Component
public class InitDataConfig implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InitDataConfig.class);

    private final RoleRepository roleRepository;

    public InitDataConfig(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedRole("ROLE_ADMIN", "Quản trị viên", "#7c3aed");
        seedRole("ROLE_USER",  "Khách hàng",     "#1d4ed8");
    }

    private void seedRole(String name, String displayName, String color) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role role = new Role();
            role.setName(name);
            role.setDisplayName(displayName);
            role.setColor(color);
            roleRepository.save(role);
            log.info("✅ Đã khởi tạo role cốt lõi: {}", name);
        }
    }
}
