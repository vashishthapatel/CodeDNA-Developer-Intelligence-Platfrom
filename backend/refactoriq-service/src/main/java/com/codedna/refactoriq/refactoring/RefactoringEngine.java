package com.codedna.refactoriq.refactoring;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RefactoringEngine {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefactorResult {
        private String originalCode;
        private String refactoredCode;
        private String diff;
        private String summary;
        private boolean automated;
    }

    public RefactorResult applyGuardClauseTransformation(String sourceCode) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return RefactorResult.builder().originalCode("").refactoredCode("").diff("").summary("No source provided.").automated(false).build();
        }

        String transformed = sourceCode;
        boolean changed = false;

        // Generic triple-nested guard: if (x != null) { if (x.isValid()) { if (cond) { body } } }
        try {
            java.util.regex.Pattern triple = java.util.regex.Pattern.compile(
                    "if\\s*\\(\\s*(\\w+)\\s*!=\\s*null\\s*\\)\\s*\\{\\s*if\\s*\\(\\s*\\1\\.isValid\\(\\)\\s*\\)\\s*\\{\\s*if\\s*\\(\\s*([^)]+)\\s*\\)\\s*\\{\\s*([^}]+?)\\s*\\}\\s*\\}\\s*\\}",
                    java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = triple.matcher(transformed);
            if (m.find()) {
                String var = m.group(1);
                String cond = m.group(2).trim();
                String body = m.group(3).trim();
                String invertedCond = invertCondition(cond);
                String cap = capitalize(var);
                String replacement = "if (" + var + " == null) {\n"
                        + "            throw new IllegalArgumentException(\"" + cap + " must not be null\");\n"
                        + "        }\n"
                        + "        if (!" + var + ".isValid()) {\n"
                        + "            throw new IllegalStateException(\"Invalid " + var + "\");\n"
                        + "        }\n"
                        + "        if (" + invertedCond + ") {\n"
                        + "            throw new IllegalArgumentException(\"Invalid condition: " + cond.replace("\"", "\\\"") + "\");\n"
                        + "        }\n"
                        + "        " + body;
                transformed = m.replaceFirst(java.util.regex.Matcher.quoteReplacement(replacement));
                changed = true;
            }
        } catch (Exception e) {
            log.debug("Generic triple guard transform skipped: {}", e.getMessage());
        }

        // Generic double-nested: if (x != null) { if (x.isValid()) { body } }
        if (!changed) {
            try {
                java.util.regex.Pattern dbl = java.util.regex.Pattern.compile(
                        "if\\s*\\(\\s*(\\w+)\\s*!=\\s*null\\s*\\)\\s*\\{\\s*if\\s*\\(\\s*\\1\\.isValid\\(\\)\\s*\\)\\s*\\{\\s*([^}]+?)\\s*\\}\\s*\\}",
                        java.util.regex.Pattern.DOTALL);
                java.util.regex.Matcher m2 = dbl.matcher(transformed);
                if (m2.find()) {
                    String var = m2.group(1);
                    String body = m2.group(2).trim();
                    String cap = capitalize(var);
                    String replacement = "if (" + var + " == null) {\n"
                            + "            throw new IllegalArgumentException(\"" + cap + " must not be null\");\n"
                            + "        }\n"
                            + "        if (!" + var + ".isValid()) {\n"
                            + "            throw new IllegalStateException(\"Invalid " + var + "\");\n"
                            + "        }\n"
                            + "        " + body;
                    transformed = m2.replaceFirst(java.util.regex.Matcher.quoteReplacement(replacement));
                    changed = true;
                }
            } catch (Exception e) {
                log.debug("Generic double guard transform skipped: {}", e.getMessage());
            }
        }

        String diff = generateUnifiedDiff(sourceCode, transformed, "Original.java", "Refactored.java");
        String summary = changed
                ? "Applied Guard Clause refactoring: Inverted nested null/validity checks into early-return validations, reducing nesting depth and cyclomatic branching."
                : "No guard-clause pattern matched — source returned unchanged. Try EXTRACT_CLASS for validation extraction or ensure the code contains nested null/validity checks.";

        return RefactorResult.builder()
                .originalCode(sourceCode)
                .refactoredCode(transformed)
                .diff(diff)
                .summary(summary)
                .automated(changed)
                .build();
    }

    private static String invertCondition(String cond) {
        cond = cond.trim();
        if (cond.contains(">=")) return cond.replace(">=", "<");
        if (cond.contains("<=")) return cond.replace("<=", ">");
        if (cond.contains(" > ")) return cond.replace(" > ", " <= ");
        if (cond.contains(" < ")) return cond.replace(" < ", " >= ");
        if (cond.contains("==")) return cond.replace("==", "!=");
        if (cond.contains("!=")) return cond.replace("!=", "==");
        return "!(" + cond + ")";
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    public RefactorResult generateExtractedClassScaffold(String className, String sourceCode) {
        String baseName = className.replace(".java", "").replace("Service", "");

        StringBuilder validator = new StringBuilder();
        validator.append("package com.codedna.domain;\n\n");
        validator.append("import org.springframework.stereotype.Component;\n\n");
        validator.append("@Component\n");
        validator.append("public class ").append(baseName).append("Validator {\n\n");
        validator.append("    public void validate(").append(baseName).append("Request request) {\n");
        validator.append("        if (request == null) {\n");
        validator.append("            throw new IllegalArgumentException(\"Request must not be null\");\n");
        validator.append("        }\n");
        validator.append("        if (!request.isValid()) {\n");
        validator.append("            throw new IllegalStateException(\"Request validation failed\");\n");
        validator.append("        }\n");
        validator.append("    }\n");
        validator.append("}\n");

        return RefactorResult.builder()
                .originalCode(sourceCode)
                .refactoredCode(validator.toString())
                .diff("--- /dev/null\n+++ b/" + baseName + "Validator.java\n" + validator)
                .summary("Generated single-responsibility " + baseName + "Validator delegate class scaffold.")
                .automated(true)
                .build();
    }

    public String generateUnifiedDiff(String before, String after, String oldName, String newName) {
        if (before == null) before = "";
        if (after == null) after = "";

        String[] oldLines = before.split("\r\n|\r|\n");
        String[] newLines = after.split("\r\n|\r|\n");

        StringBuilder diff = new StringBuilder();
        diff.append("--- a/").append(oldName).append("\n");
        diff.append("+++ b/").append(newName).append("\n");
        diff.append("@@ -1,").append(oldLines.length).append(" +1,").append(newLines.length).append(" @@\n");

        int max = Math.max(oldLines.length, newLines.length);
        for (int i = 0; i < max; i++) {
            String oldLine = i < oldLines.length ? oldLines[i] : null;
            String newLine = i < newLines.length ? newLines[i] : null;

            if (oldLine != null && newLine != null && oldLine.equals(newLine)) {
                diff.append(" ").append(oldLine).append("\n");
            } else {
                if (oldLine != null) {
                    diff.append("-").append(oldLine).append("\n");
                }
                if (newLine != null) {
                    diff.append("+").append(newLine).append("\n");
                }
            }
        }

        return diff.toString();
    }
}
