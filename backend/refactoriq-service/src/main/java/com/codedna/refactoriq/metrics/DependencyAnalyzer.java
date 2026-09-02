package com.codedna.refactoriq.metrics;

import com.codedna.refactoriq.common.enums.Severity;
import com.codedna.refactoriq.parser.ClassModel;
import com.codedna.refactoriq.parser.SourceFileModel;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DependencyAnalyzer {

    public Severity evaluateCouplingSeverity(int importCount) {
        if (importCount > 20) {
            return Severity.HIGH;
        } else if (importCount >= 11) {
            return Severity.MEDIUM;
        }
        return Severity.LOW;
    }

    public List<String> detectArchitecturalViolations(SourceFileModel fileModel) {
        List<String> violations = new ArrayList<>();
        String path = fileModel.getPath() != null ? fileModel.getPath().toLowerCase() : "";

        boolean isController = path.contains("controller") || fileModel.getClasses().stream()
                .anyMatch(c -> c.getName().endsWith("Controller") || c.getAnnotations().stream().anyMatch(a -> a.contains("Controller") || a.contains("RestController")));

        if (isController) {
            // Check if controller imports or references repository directly
            boolean referencesRepository = fileModel.getImports().stream()
                    .anyMatch(imp -> imp.toLowerCase().contains("repository") && !imp.toLowerCase().contains("controller"))
                    || fileModel.getClasses().stream()
                    .flatMap(c -> c.getFields().stream())
                    .anyMatch(f -> f.toLowerCase().contains("repository"));

            if (referencesRepository) {
                violations.add("Controller directly references Repository without intermediate Service layer (Controller -> Repository instead of Controller -> Service -> Repository)");
            }
        }

        boolean isRepository = path.contains("repository") || fileModel.getClasses().stream()
                .anyMatch(c -> c.getName().endsWith("Repository"));

        if (isRepository) {
            boolean referencesServiceOrController = fileModel.getImports().stream()
                    .anyMatch(imp -> imp.toLowerCase().contains("service") || imp.toLowerCase().contains("controller"));
            if (referencesServiceOrController) {
                violations.add("Repository references upper architectural layers (Service or Controller)");
            }
        }

        return violations;
    }
}
