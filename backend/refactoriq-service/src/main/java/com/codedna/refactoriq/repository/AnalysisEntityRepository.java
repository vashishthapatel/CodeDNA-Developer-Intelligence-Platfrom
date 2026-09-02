package com.codedna.refactoriq.repository;

import com.codedna.refactoriq.entity.AnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisEntityRepository extends JpaRepository<AnalysisEntity, Long> {
    List<AnalysisEntity> findByRepositoryIdOrderByCreatedAtDesc(Long repositoryId);
}
