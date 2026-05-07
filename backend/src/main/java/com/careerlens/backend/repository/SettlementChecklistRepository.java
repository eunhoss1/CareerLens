package com.careerlens.backend.repository;

import com.careerlens.backend.entity.SettlementChecklist;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementChecklistRepository extends JpaRepository<SettlementChecklist, Long> {

    List<SettlementChecklist> findByUserIdOrderByCountryAscSortOrderAsc(Long userId);

    boolean existsByUserId(Long userId);
}
