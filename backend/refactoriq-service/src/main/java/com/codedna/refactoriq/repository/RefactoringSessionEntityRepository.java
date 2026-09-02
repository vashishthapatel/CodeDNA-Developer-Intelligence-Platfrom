package com.codedna.refactoriq.repository;

import com.codedna.refactoriq.entity.RefactoringSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefactoringSessionEntityRepository extends JpaRepository<RefactoringSessionEntity, Long> {
    List<RefactoringSessionEntity> findByRepositoryIdOrderByCreatedAtDesc(Long repositoryId);
}
