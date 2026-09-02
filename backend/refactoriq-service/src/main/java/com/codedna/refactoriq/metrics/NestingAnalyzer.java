package com.codedna.refactoriq.metrics;

import com.codedna.refactoriq.common.enums.Severity;
import org.springframework.stereotype.Component;

@Component
public class NestingAnalyzer {

    public Severity evaluateNestingSeverity(int nestingDepth) {
        if (nestingDepth > 4) {
            return Severity.CRITICAL;
        } else if (nestingDepth == 4) {
            return Severity.HIGH;
        } else if (nestingDepth == 3) {
            return Severity.MEDIUM;
        }
        return Severity.LOW;
    }
}
