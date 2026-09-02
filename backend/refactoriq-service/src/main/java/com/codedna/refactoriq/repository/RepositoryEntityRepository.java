package com.codedna.refactoriq.repository;

import com.codedna.refactoriq.entity.RepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RepositoryEntityRepository extends JpaRepository<RepositoryEntity, Long> {
    Optional<RepositoryEntity> findByFullName(String fullName);
}
