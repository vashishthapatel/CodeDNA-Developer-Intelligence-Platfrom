package com.codedna.refactoriq.metrics;

import com.codedna.refactoriq.common.enums.Severity;
import org.springframework.stereotype.Component;

@Component
public class LocAnalyzer {

    public Severity evaluateLocSeverity(int loc) {
        if (loc > 600) {
            return Severity.CRITICAL;
        } else if (loc >= 400) {
            return Severity.HIGH;
        } else if (loc >= 200) {
            return Severity.MEDIUM;
        }
        return Severity.LOW;
    }
}
