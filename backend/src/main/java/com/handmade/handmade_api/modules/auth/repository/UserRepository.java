package com.handmade.handmade_api.modules.auth.repository;

import com.handmade.handmade_api.modules.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // Đếm thống kê nhanh cho admin dashboard
    long countByEnabled(boolean enabled);
    long countByAccountNonLocked(boolean accountNonLocked);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r.name = 'ROLE_ADMIN'")
    long countAdminUsers();

    // BỘ LỌC CHUYÊN NGHIỆP: Phân trang + Tìm kiếm theo từ khóa + Lọc theo Tên quyền + Lọc trạng thái hoạt động
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN u.roles r WHERE " +
            "(:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR u.phone LIKE CONCAT('%', :search, '%')) AND " +
            "(:roleName IS NULL OR r.name = :roleName) AND " +
            "(:enabled IS NULL OR u.enabled = :enabled)")
    Page<User> findUsersByFilters(@Param("search") String search,
                                  @Param("roleName") String roleName,
                                  @Param("enabled") Boolean enabled,
                                  Pageable pageable);
}