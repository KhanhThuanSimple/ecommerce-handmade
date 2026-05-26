package com.handmade.handmade_api.modules.voucher.repository;

import com.handmade.handmade_api.modules.voucher.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, String> {
    Optional<Voucher> findByCode(String code);
}
