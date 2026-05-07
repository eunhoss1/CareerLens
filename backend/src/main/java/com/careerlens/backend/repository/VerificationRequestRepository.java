package com.careerlens.backend.repository;

import com.careerlens.backend.entity.VerificationRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {

    List<VerificationRequest> findByPlannerTaskIdOrderByRequestedAtDesc(Long plannerTaskId);

    List<VerificationRequest> findByPlannerTaskIdIn(List<Long> plannerTaskIds);
}
