package com.handmade.handmade_api;

import com.handmade.handmade_api.config.AppProperties; // Import đúng đường dẫn file AppProperties của bạn
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class) // 💡 THÊM DÒNG NÀY: Ép Spring Boot phải nhận diện và nạp AppProperties làm Bean hệ thống
public class HandmadeApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(HandmadeApiApplication.class, args);
	}

}