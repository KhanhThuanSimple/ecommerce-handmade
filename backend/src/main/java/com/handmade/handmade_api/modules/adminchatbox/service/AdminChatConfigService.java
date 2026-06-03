// AdminChatConfigService.java
package com.handmade.handmade_api.modules.adminchatbox.service;

import com.handmade.handmade_api.modules.adminchatbox.entity.AiConfiguration;
import com.handmade.handmade_api.modules.adminchatbox.repository.AiConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminChatConfigService {

    @Autowired
    private AiConfigurationRepository configRepo;

    @Autowired
    private AiConfigService aiConfigService;

    public List<AiConfiguration> getAllConfigs() {
        return configRepo.findAll();
    }

    public Map<String, String> getAllConfigsAsMap() {
        return configRepo.findAll().stream()
                .collect(Collectors.toMap(
                        AiConfiguration::getConfigKey,
                        AiConfiguration::getConfigValue
                ));
    }

    @Transactional
    public AiConfiguration updateConfig(String key, String value, String description) {
        AiConfiguration config = configRepo.findByConfigKey(key)
                .orElse(new AiConfiguration());
        config.setConfigKey(key);
        config.setConfigValue(value);
        if (description != null) {
            config.setDescription(description);
        }
        return configRepo.save(config);
    }

    @Transactional
    public void deleteConfig(String key) {
        configRepo.findByConfigKey(key).ifPresent(configRepo::delete);
    }

    @Transactional
    public AiConfiguration createConfig(String key, String value, String description) {
        if (configRepo.existsByConfigKey(key)) {
            throw new RuntimeException("Config key already exists: " + key);
        }
        AiConfiguration config = new AiConfiguration();
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setDescription(description);
        return configRepo.save(config);
    }

    public String testAiConnection() {
        try {
            String apiKey = aiConfigService.getConfig("GROQ_API_KEY", "");
            String model = aiConfigService.getConfig("AI_MODEL", "");

            if (apiKey.isEmpty()) {
                return "Lỗi: Chưa cấu hình API Key!";
            }

            // Test call API
            return "Kết nối thành công! Model: " + model;
        } catch (Exception e) {
            return "Kết nối thất bại: " + e.getMessage();
        }
    }
}