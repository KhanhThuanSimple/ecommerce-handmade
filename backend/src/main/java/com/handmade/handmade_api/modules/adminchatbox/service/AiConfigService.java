package com.handmade.handmade_api.modules.adminchatbox.service;

import com.handmade.handmade_api.modules.adminchatbox.entity.AiConfiguration;
import com.handmade.handmade_api.modules.adminchatbox.repository.AiConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AiConfigService {
    @Autowired
    private AiConfigurationRepository configRepo;

    public String getConfig(String key, String defaultValue) {
        return configRepo.findByConfigKey(key)
                .map(AiConfiguration::getConfigValue)
                .orElse(defaultValue);
    }

    public void updateConfig(String key, String value) {
        AiConfiguration config = configRepo.findByConfigKey(key)
                .orElse(new AiConfiguration());
        config.setConfigKey(key);
        config.setConfigValue(value);
        configRepo.save(config);
    }
}