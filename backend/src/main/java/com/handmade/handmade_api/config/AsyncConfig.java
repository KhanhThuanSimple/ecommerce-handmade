package com.handmade.handmade_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.concurrent.DelegatingSecurityContextExecutor;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.scheduling.annotation.AsyncConfigurer;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;


@Configuration
@EnableAsync                 // kích hoạt @Async
@EnableScheduling            // kích hoạt @Scheduled (ChatCleanupScheduler)
public class AsyncConfig implements AsyncConfigurer {
//AsyncConfig là lớp cấu hình cho cơ chế xử lý bất đồng bộ của Spring Boot.
    @Bean(name = "aiExecutor")
    public Executor aiExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);      
        executor.setMaxPoolSize(5);       
        executor.setQueueCapacity(20);       
        executor.setThreadNamePrefix("ai-async-"); 
        executor.setKeepAliveSeconds(60);
        executor.initialize();
        return executor;
    }

    /**
     * Thread pool mặc định cho các tác vụ @Async không chỉ định executor.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("async-task-");
        executor.initialize();
        return executor;
    }

    /**
     * Thread pool được bảo mật bằng Security Context, dùng cho các tác vụ cần thông tin người dùng.
     */
    @Bean(name = "securityAwareExecutor")
    public Executor securityAwareExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("AsyncWorker-");
        
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        executor.initialize();
        
        return new DelegatingSecurityContextExecutor(executor); // sao chép SecurityContext từ thread gọi sang thread pool
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return new AsyncUncaughtExceptionHandler() {
            @Override
            public void handleUncaughtException(Throwable ex, Method method, Object... params) {
                System.err.println(" LỖI TRONG LUỒNG NGẦM (ASYNC EXCEPTION) ");
                System.err.println("Tên hàm xảy ra lỗi: " + method.getName());
                System.err.println("Chi tiết lỗi: " + ex.getMessage());
            }
        };
    }
}
