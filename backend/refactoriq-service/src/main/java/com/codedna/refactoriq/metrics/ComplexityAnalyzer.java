package com.codedna.refactoriq.metrics;

import com.codedna.refactoriq.common.enums.Severity;
import org.springframework.stereotype.Component;

@Component
public class ComplexityAnalyzer {

    public Severity evaluateComplexitySeverity(int cyclomaticComplexity) {
        if (cyclomaticComplexity > 20) {
            return Severity.CRITICAL;
        } else if (cyclomaticComplexity >= 11) {
            return Severity.HIGH;
        } else if (cyclomaticComplexity >= 6) {
            return Severity.MEDIUM;
        }
        return Severity.LOW;
    }
}
