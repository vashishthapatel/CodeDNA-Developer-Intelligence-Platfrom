package com.codedna.refactoriq.repository;

import com.codedna.refactoriq.entity.IssueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueEntityRepository extends JpaRepository<IssueEntity, Long> {
    List<IssueEntity> findByAnalysisId(Long analysisId);
    List<IssueEntity> findByAnalysisIdAndFilePath(Long analysisId, String filePath);
}
