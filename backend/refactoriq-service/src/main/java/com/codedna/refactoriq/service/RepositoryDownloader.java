package com.codedna.refactoriq.service;

import com.codedna.refactoriq.parser.JavaSourceParser;
import com.codedna.refactoriq.parser.SourceFileModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Component
@RequiredArgsConstructor
public class RepositoryDownloader {

    private final JavaSourceParser sourceParser;

    private static final Set<String> IGNORED_DIRS = Set.of(
            ".git", "target", "build", "node_modules", ".idea", ".vscode", "dist", "bin", "out"
    );

    public List<SourceFileModel> scanLocalDirectory(Path rootPath) {
        List<SourceFileModel> parsedFiles = new ArrayList<>();
        if (!Files.exists(rootPath) || !Files.isDirectory(rootPath)) {
            return parsedFiles;
        }

        try (Stream<Path> stream = Files.walk(rootPath)) {
            List<Path> javaPaths = stream
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".java"))
                    .filter(this::isNotIgnored)
                    .collect(Collectors.toList());

            for (Path path : javaPaths) {
                try {
                    String content = Files.readString(path);
                    String relPath = rootPath.relativize(path).toString().replace("\\", "/");
                    sourceParser.parseSource(relPath, content).ifPresent(parsedFiles::add);
                } catch (IOException e) {
                    log.warn("Failed to read file: {}", path, e);
                }
            }
        } catch (IOException e) {
            log.error("Failed to walk directory: {}", rootPath, e);
        }

        return parsedFiles;
    }

    public List<SourceFileModel> parseExplicitFiles(Map<String, String> fileMap) {
        List<SourceFileModel> parsedFiles = new ArrayList<>();
        for (Map.Entry<String, String> entry : fileMap.entrySet()) {
            sourceParser.parseSource(entry.getKey(), entry.getValue()).ifPresent(parsedFiles::add);
        }
        return parsedFiles;
    }

    private boolean isNotIgnored(Path path) {
        for (Path part : path) {
            if (IGNORED_DIRS.contains(part.toString())) {
                return false;
            }
        }
        return true;
    }
}
