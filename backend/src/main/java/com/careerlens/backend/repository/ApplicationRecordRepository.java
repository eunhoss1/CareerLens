package com.careerlens.backend.repository;

import com.careerlens.backend.entity.ApplicationRecord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRecordRepository extends JpaRepository<ApplicationRecord, Long> {

    @EntityGraph(attributePaths = {"user", "jobPosting", "plannerRoadmap"})
    List<ApplicationRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "jobPosting", "plannerRoadmap"})
    Optional<ApplicationRecord> findByPlannerRoadmapId(Long roadmapId);
}
