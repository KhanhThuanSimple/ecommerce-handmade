package com.handmade.handmade_api.modules.luckywheel.repository;

import com.handmade.handmade_api.modules.luckywheel.entity.UserSpinProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSpinProfileRepository extends JpaRepository<UserSpinProfile, Long> {}