package com.codedna.refactoriq.repository;

import com.codedna.refactoriq.entity.RecommendationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendationEntityRepository extends JpaRepository<RecommendationEntity, Long> {
    Optional<RecommendationEntity> findByIssueId(Long issueId);
    List<RecommendationEntity> findByIssueIdIn(List<Long> issueIds);
}
