package com.codedna.repository.repository;

import com.codedna.repository.entity.RepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepositoryRepository extends JpaRepository<RepositoryEntity, Long> {
    List<RepositoryEntity> findByUserId(Long userId);
    Optional<RepositoryEntity> findByUserIdAndFullName(Long userId, String fullName);

    @Query("SELECT r FROM RepositoryEntity r WHERE r.userId = :userId ORDER BY r.dnaContribution DESC")
    List<RepositoryEntity> findTopRepositoriesByDnaContribution(Long userId);
}
