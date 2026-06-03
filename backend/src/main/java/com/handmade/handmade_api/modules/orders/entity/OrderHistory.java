package com.handmade.handmade_api.modules.orders.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_history",
        indexes = {
                @Index(name = "idx_order_id", columnList = "order_id"),
                @Index(name = "idx_performed_at", columnList = "performed_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;

    @Column(name = "action", nullable = false, length = 50)
    private String action; // CREATED, UPDATED, STATUS_CHANGED, PAYMENT_UPDATED, CANCELLED, COMPLETED

    @Column(name = "old_status", length = 100)
    private String oldStatus;

    @Column(name = "new_status", length = 100)
    private String newStatus;

    @Column(name = "old_payment_status", length = 50)
    private String oldPaymentStatus;

    @Column(name = "new_payment_status", length = 50)
    private String newPaymentStatus;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy; // userId, adminId, or "system"

    @Column(name = "performed_by_role", length = 50)
    private String performedByRole; // ADMIN, USER, SYSTEM

    @Column(name = "changes", columnDefinition = "TEXT")
    private String changes; // JSON string storing detailed field changes

    @CreationTimestamp
    @Column(name = "performed_at", updatable = false)
    private LocalDateTime performedAt;
}