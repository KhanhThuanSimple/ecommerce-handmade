package com.handmade.handmade_api.modules.luckywheel.repository;

import com.handmade.handmade_api.modules.luckywheel.entity.Prize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrizeRepository extends JpaRepository<Prize, Long> {
    // Kế thừa JpaRepository tự động có sẵn hàm findAll() cấu hình cho Controller
}