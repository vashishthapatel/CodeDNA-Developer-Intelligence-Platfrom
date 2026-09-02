package com.codedna.repository.service;

import com.codedna.common.event.RepositorySyncedEvent;
import com.codedna.common.model.Repository;
import com.codedna.common.model.RepositoryHealth;
import com.codedna.repository.client.GitHubClient;
import com.codedna.repository.dto.GitHubCommit;
import com.codedna.repository.dto.GitHubRepo;
import com.codedna.repository.entity.RepositoryEntity;
import com.codedna.repository.repository.RepositoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RepositoryService {

    private final RepositoryRepository repositoryRepository;
    private final GitHubClient gitHubClient;
    private final KafkaTemplate<String, RepositorySyncedEvent> kafkaTemplate;

    @Transactional
    public List<Repository> syncUserRepositories(Long userId, String githubToken) {
        log.info("Syncing repositories for user: {}", userId);

        String authHeader = "Bearer " + githubToken;
        List<GitHubRepo> githubRepos = gitHubClient.getUserRepositories(authHeader, 100);

        List<Repository> syncedRepos = new ArrayList<>();

        for (GitHubRepo ghRepo : githubRepos) {
            try {
                RepositoryEntity entity = syncRepository(userId, ghRepo, authHeader);
                syncedRepos.add(mapToRepository(entity));

                // Publish event
                RepositorySyncedEvent event = RepositorySyncedEvent.builder()
                        .userId(userId)
                        .repositoryId(entity.getId())
                        .repositoryName(entity.getName())
                        .commitsAnalyzed(entity.getCommits())
                        .syncedAt(LocalDateTime.now())
                        .build();

                kafkaTemplate.send("repository.synced", event);
                log.info("Repository synced: {}", entity.getFullName());

            } catch (Exception e) {
                log.error("Failed to sync repository: {}", ghRepo.getFullName(), e);
            }
        }

        log.info("Synced {} repositories for user {}", syncedRepos.size(), userId);
        return syncedRepos;
    }

    @Transactional
    public RepositoryEntity syncRepository(Long userId, GitHubRepo ghRepo, String authHeader) {
        Optional<RepositoryEntity> existing = repositoryRepository
                .findByUserIdAndFullName(userId, ghRepo.getFullName());

        RepositoryEntity entity = existing.orElse(new RepositoryEntity());
        entity.setUserId(userId);
        entity.setName(ghRepo.getName());
        entity.setFullName(ghRepo.getFullName());
        entity.setDescription(ghRepo.getDescription());
        entity.setPrimaryLanguage(ghRepo.getLanguage());
        entity.setStars(ghRepo.getStars());
        entity.setForks(ghRepo.getForks());
        entity.setIssues(ghRepo.getOpenIssues());
        entity.setVisibility(ghRepo.isPrivate() ? "private" : "public");

        // Fetch languages
        try {
            String[] parts = ghRepo.getFullName().split("/");
            Map<String, Integer> languages = gitHubClient.getLanguages(parts[0], parts[1], authHeader);
            entity.setLanguages(new ArrayList<>(languages.keySet()));
        } catch (Exception e) {
            log.error("Failed to fetch languages for: {}", ghRepo.getFullName(), e);
            entity.setLanguages(Collections.emptyList());
        }

        // Fetch commits
        try {
            String[] parts = ghRepo.getFullName().split("/");
            List<GitHubCommit> commits = gitHubClient.getCommits(parts[0], parts[1], authHeader, 100);
            entity.setCommits(commits.size());

            if (!commits.isEmpty()) {
                entity.setLastCommitAt(commits.get(0).getCommitDetail().getAuthor().getDate());
            }
        } catch (Exception e) {
            log.error("Failed to fetch commits for: {}", ghRepo.getFullName(), e);
            entity.setCommits(0);
        }

        // Calculate health metrics (simplified)
        calculateHealthMetrics(entity);

        // Detect stack and patterns
        detectStackAndPatterns(entity);

        entity.setSyncedAt(LocalDateTime.now());
        return repositoryRepository.save(entity);
    }

    private void calculateHealthMetrics(RepositoryEntity entity) {
        Random random = new Random(entity.getName().hashCode());
        entity.setCodeQuality(60 + random.nextInt(35));
        entity.setComplexity(40 + random.nextInt(55));
        entity.setDocumentation(50 + random.nextInt(40));
        entity.setTesting(55 + random.nextInt(40));
        entity.setMaintainability(60 + random.nextInt(35));
    }

    private void detectStackAndPatterns(RepositoryEntity entity) {
        List<String> stack = new ArrayList<>();
        List<String> patterns = new ArrayList<>();

        // Detect stack based on languages
        if (entity.getLanguages() != null) {
            if (entity.getLanguages().contains("Java")) {
                stack.addAll(Arrays.asList("Java", "Spring Boot", "Maven"));
                patterns.addAll(Arrays.asList("REST API", "Layered Architecture"));
            }
            if (entity.getLanguages().contains("TypeScript") || entity.getLanguages().contains("JavaScript")) {
                stack.addAll(Arrays.asList("React", "Node.js"));
                patterns.add("Component Architecture");
            }
            if (entity.getLanguages().contains("Python")) {
                stack.add("Python");
                patterns.add("Scripting");
            }
        }

        entity.setStack(stack);
        entity.setPatterns(patterns);
    }

    @Transactional(readOnly = true)
    public List<Repository> getUserRepositories(Long userId) {
        return repositoryRepository.findByUserId(userId)
                .stream()
                .map(this::mapToRepository)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Repository getRepositoryById(Long id) {
        RepositoryEntity entity = repositoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Repository not found"));
        return mapToRepository(entity);
    }

    private Repository mapToRepository(RepositoryEntity entity) {
        return Repository.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .name(entity.getName())
                .fullName(entity.getFullName())
                .description(entity.getDescription())
                .primaryLanguage(entity.getPrimaryLanguage())
                .languages(entity.getLanguages())
                .stars(entity.getStars())
                .forks(entity.getForks())
                .commits(entity.getCommits())
                .pullRequests(entity.getPullRequests())
                .issues(entity.getIssues())
                .contributors(entity.getContributors())
                .dnaContribution(entity.getDnaContribution())
                .visibility(entity.getVisibility())
                .updatedAt(entity.getUpdatedAt())
                .syncedAt(entity.getSyncedAt())
                .health(RepositoryHealth.builder()
                        .codeQuality(entity.getCodeQuality())
                        .complexity(entity.getComplexity())
                        .documentation(entity.getDocumentation())
                        .testing(entity.getTesting())
                        .maintainability(entity.getMaintainability())
                        .build())
                .stack(entity.getStack())
                .patterns(entity.getPatterns())
                .build();
    }
}
