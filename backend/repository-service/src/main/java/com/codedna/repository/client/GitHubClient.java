package com.codedna.repository.client;

import com.codedna.repository.dto.GitHubRepo;
import com.codedna.repository.dto.GitHubCommit;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "github-api", url = "${github.api.base-url}")
public interface GitHubClient {

    @GetMapping("/user/repos")
    List<GitHubRepo> getUserRepositories(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "100") int per_page
    );

    @GetMapping("/repos/{owner}/{repo}/commits")
    List<GitHubCommit> getCommits(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "100") int per_page
    );

    @GetMapping("/repos/{owner}/{repo}/languages")
    java.util.Map<String, Integer> getLanguages(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestHeader("Authorization") String token
    );
}
