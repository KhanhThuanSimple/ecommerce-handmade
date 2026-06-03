package com.handmade.handmade_api.modules.orders.specification;

import com.handmade.handmade_api.modules.adminorder.DTO.AdminOrderFilterRequest;
import com.handmade.handmade_api.modules.orders.entity.Order;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Component
public class OrderSpecification {

    public static Specification<Order> buildFilterSpecification(AdminOrderFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(filter.getOrderId())) {
                predicates.add(criteriaBuilder.like(root.get("id"), "%" + filter.getOrderId() + "%"));
            }

            if (filter.getUserId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("userId"), filter.getUserId()));
            }

            if (StringUtils.hasText(filter.getPhone())) {
                predicates.add(criteriaBuilder.like(root.get("phone"), "%" + filter.getPhone() + "%"));
            }

            if (StringUtils.hasText(filter.getOrderStatus())) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getOrderStatus()));
            }

            if (StringUtils.hasText(filter.getPaymentMethod())) {
                predicates.add(criteriaBuilder.equal(root.get("paymentMethod"), filter.getPaymentMethod()));
            }

            if (filter.getFromDate() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate()));
            }

            if (filter.getToDate() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate()));
            }

            if (filter.getMinAmount() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("payableAmount"), filter.getMinAmount()));
            }

            if (filter.getMaxAmount() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("payableAmount"), filter.getMaxAmount()));
            }

            // Apply sorting
            if (StringUtils.hasText(filter.getSortBy())) {
                if ("DESC".equalsIgnoreCase(filter.getSortDirection())) {
                    query.orderBy(criteriaBuilder.desc(root.get(filter.getSortBy())));
                } else {
                    query.orderBy(criteriaBuilder.asc(root.get(filter.getSortBy())));
                }
            } else {
                query.orderBy(criteriaBuilder.desc(root.get("createdAt")));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}