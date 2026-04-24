package com.careerlens.backend.repository;

import com.careerlens.backend.entity.DiagnosisResult;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiagnosisResultRepository extends JpaRepository<DiagnosisResult, Long> {

    @EntityGraph(attributePaths = "jobPosting")
    List<DiagnosisResult> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByUserId(Long userId);
}
