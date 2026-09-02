package com.codedna.refactoriq.metrics;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Component
public class DuplicationAnalyzer {

    private static final int CHUNK_SIZE = 6;

    public Map<String, Integer> extractChunkHashes(String sourceCode) {
        Map<String, Integer> chunkCounts = new HashMap<>();
        if (sourceCode == null) return chunkCounts;

        List<String> normalizedLines = getNormalizedLines(sourceCode);
        if (normalizedLines.size() < CHUNK_SIZE) {
            return chunkCounts;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            for (int i = 0; i <= normalizedLines.size() - CHUNK_SIZE; i++) {
                StringBuilder chunkBuilder = new StringBuilder();
                for (int j = 0; j < CHUNK_SIZE; j++) {
                    chunkBuilder.append(normalizedLines.get(i + j)).append("\n");
                }
                byte[] hashBytes = digest.digest(chunkBuilder.toString().getBytes(StandardCharsets.UTF_8));
                String hexHash = bytesToHex(hashBytes);
                chunkCounts.put(hexHash, chunkCounts.getOrDefault(hexHash, 0) + 1);
            }
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }

        return chunkCounts;
    }

    public double calculateDuplicationPercentage(List<String> allSourceCodes) {
        if (allSourceCodes == null || allSourceCodes.isEmpty()) return 0.0;

        Map<String, Integer> globalChunks = new HashMap<>();
        int totalChunks = 0;

        for (String code : allSourceCodes) {
            Map<String, Integer> fileChunks = extractChunkHashes(code);
            for (Map.Entry<String, Integer> entry : fileChunks.entrySet()) {
                globalChunks.put(entry.getKey(), globalChunks.getOrDefault(entry.getKey(), 0) + entry.getValue());
                totalChunks += entry.getValue();
            }
        }

        if (totalChunks == 0) return 0.0;

        int duplicateChunks = 0;
        for (int count : globalChunks.values()) {
            if (count > 1) {
                duplicateChunks += count;
            }
        }

        double ratio = (double) duplicateChunks / (double) totalChunks;
        return Math.min(100.0, Math.round(ratio * 1000.0) / 10.0);
    }

    private List<String> getNormalizedLines(String source) {
        List<String> lines = new ArrayList<>();
        for (String raw : source.split("\r\n|\r|\n")) {
            String trimmed = raw.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                continue;
            }
            // Normalize variable names/spaces slightly
            String normalized = trimmed.replaceAll("\\s+", " ");
            lines.add(normalized);
        }
        return lines;
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
