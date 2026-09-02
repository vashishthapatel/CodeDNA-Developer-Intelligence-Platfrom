package com.codedna.repository.controller;

import com.codedna.common.model.Repository;
import com.codedna.repository.service.RepositoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/repositories")
@RequiredArgsConstructor
@Tag(name = "Repositories", description = "Repository Management API")
public class RepositoryController {

    private final RepositoryService repositoryService;

    @PostMapping("/sync")
    @Operation(summary = "Sync user repositories from GitHub")
    public ResponseEntity<List<Repository>> syncRepositories(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-GitHub-Token") String githubToken
    ) {
        List<Repository> repositories = repositoryService.syncUserRepositories(userId, githubToken);
        return ResponseEntity.ok(repositories);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all repositories for a user")
    public ResponseEntity<List<Repository>> getUserRepositories(@PathVariable Long userId) {
        return ResponseEntity.ok(repositoryService.getUserRepositories(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get repository by ID")
    public ResponseEntity<Repository> getRepository(@PathVariable Long id) {
        return ResponseEntity.ok(repositoryService.getRepositoryById(id));
    }
}
