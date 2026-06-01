package com.handmade.handmade_api.modules.users.repository;

import com.handmade.handmade_api.modules.users.entity.UserWishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserWishlistRepository extends JpaRepository<UserWishlistItem, UserWishlistItem.Pk> {

    @Query("select w.productId from UserWishlistItem w where w.userId = :userId")
    List<Long> findProductIdsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from UserWishlistItem w where w.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}

