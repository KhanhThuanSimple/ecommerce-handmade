package com.handmade.handmade_api.modules.adminchatbox.repository;


import com.handmade.handmade_api.modules.adminchatbox.entity.AiConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiConfigurationRepository extends JpaRepository<AiConfiguration, Long> {

    // Tìm kiếm cấu hình dựa trên key (ví dụ: 'SYSTEM_PROMPT')
    Optional<AiConfiguration> findByConfigKey(String configKey);

    // Kiểm tra xem một key đã tồn tại chưa (hữu ích khi Admin thêm mới)
    boolean existsByConfigKey(String configKey);
}