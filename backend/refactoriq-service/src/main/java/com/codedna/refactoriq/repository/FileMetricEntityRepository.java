package com.codedna.refactoriq.repository;

import com.codedna.refactoriq.entity.FileMetricEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileMetricEntityRepository extends JpaRepository<FileMetricEntity, Long> {
    List<FileMetricEntity> findByAnalysisIdOrderByHotspotScoreDesc(Long analysisId);
    List<FileMetricEntity> findByAnalysisId(Long analysisId);
}
