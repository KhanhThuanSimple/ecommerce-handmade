package com.handmade.handmade_api.modules.voucher.repository;

import com.handmade.handmade_api.modules.voucher.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, String> {

    @Modifying
    @Query(value = "UPDATE vouchers SET used_count = used_count + 1 WHERE code = :code AND used_count < usage_limit", nativeQuery = true)
    int incrementUsedCount(@Param("code") String code);
}