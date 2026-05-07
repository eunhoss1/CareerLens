package com.careerlens.backend.repository;

import com.careerlens.backend.entity.VerificationBadge;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationBadgeRepository extends JpaRepository<VerificationBadge, Long> {

    List<VerificationBadge> findByUserIdOrderByIssuedAtDesc(Long userId);

    List<VerificationBadge> findByPlannerTaskIdOrderByIssuedAtDesc(Long plannerTaskId);

    Optional<VerificationBadge> findByVerificationRequestIdAndBadgeType(Long verificationRequestId, String badgeType);
}
