package com.handmade.handmade_api.modules.luckywheel.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.handmade.handmade_api.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_spin_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSpinProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User user;

    @Builder.Default
    private Integer points = 0;

    @Column(name = "last_spin_date")
    private LocalDateTime lastSpinDate;
}