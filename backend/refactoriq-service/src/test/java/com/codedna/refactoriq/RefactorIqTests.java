package com.codedna.refactoriq;

import com.codedna.refactoriq.common.enums.Severity;
import com.codedna.refactoriq.comparison.ImpactScoreEngine;
import com.codedna.refactoriq.metrics.*;
import com.codedna.refactoriq.parser.JavaSourceParser;
import com.codedna.refactoriq.parser.SourceFileModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class RefactorIqTests {

    private JavaSourceParser parser;
    private LocAnalyzer locAnalyzer;
    private ComplexityAnalyzer complexityAnalyzer;
    private NestingAnalyzer nestingAnalyzer;
    private DependencyAnalyzer dependencyAnalyzer;
    private DuplicationAnalyzer duplicationAnalyzer;
    private ComplexityScoreEngine scoreEngine;
    private ImpactScoreEngine impactEngine;

    @BeforeEach
    void setUp() {
        parser = new JavaSourceParser();
        locAnalyzer = new LocAnalyzer();
        complexityAnalyzer = new ComplexityAnalyzer();
        nestingAnalyzer = new NestingAnalyzer();
        dependencyAnalyzer = new DependencyAnalyzer();
        duplicationAnalyzer = new DuplicationAnalyzer();
        scoreEngine = new ComplexityScoreEngine();
        impactEngine = new ImpactScoreEngine();
    }

    @Test
    void testAstParsingAndNestingDepth() {
        // As per PDF page 39:
        // if (a) { if (b) { if (c) { } } } -> Complexity = 4, Nesting = 3
        String fixture =
                "package com.example;\n" +
                "public class SampleService {\n" +
                "    public void compute(boolean a, boolean b, boolean c) {\n" +
                "        if (a) {\n" +
                "            if (b) {\n" +
                "                if (c) {\n" +
                "                    System.out.println(\"Nested!\");\n" +
                "                }\n" +
                "            }\n" +
                "        }\n" +
                "    }\n" +
                "}";

        Optional<SourceFileModel> modelOpt = parser.parseSource("SampleService.java", fixture);
        assertTrue(modelOpt.isPresent());

        SourceFileModel model = modelOpt.get();
        assertEquals("com.example", model.getPackageName());
        assertEquals(1, model.getClasses().size());

        var method = model.getClasses().get(0).getMethods().get(0);
        assertEquals("compute", method.getName());
        assertEquals(4, method.getCyclomaticComplexity()); // 1 base + 3 if statements
        assertEquals(3, method.getNestingDepth());
    }

    @Test
    void testLocCalculation() {
        String code =
                "// Header comment\n" +
                "package com.example;\n" +
                "\n" +
                "/* Multi-line comment\n" +
                "   Line 2 */\n" +
                "public class A {\n" +
                "    int x = 1;\n" +
                "}";

        int loc = JavaSourceParser.calculateLoc(code);
        assertEquals(4, loc); // package, class A, int x, closing brace
    }

    @Test
    void testComplexityThresholds() {
        assertEquals(Severity.LOW, complexityAnalyzer.evaluateComplexitySeverity(4));
        assertEquals(Severity.MEDIUM, complexityAnalyzer.evaluateComplexitySeverity(8));
        assertEquals(Severity.HIGH, complexityAnalyzer.evaluateComplexitySeverity(15));
        assertEquals(Severity.CRITICAL, complexityAnalyzer.evaluateComplexitySeverity(22));
    }

    @Test
    void testImpactScoreCalculation() {
        // Before (91 complexity) -> After (61 complexity)
        var assessment = impactEngine.calculateImpact(
                91.0, 61.0,
                428, 312,
                22, 11,
                5, 2,
                23, 14,
                18.0, 46.0,
                4, 1
        );

        assertTrue(assessment.getImpactScore() >= 80);
        assertEquals("Excellent Refactoring", assessment.getLabel());
        assertEquals(50.0, assessment.getComplexityImprovementPercent());
        assertEquals(60.0, assessment.getNestingImprovementPercent());
        assertEquals(0, assessment.getRegressionCount());
    }

    @Test
    void testRegressionDetection() {
        // Regressed coupling: 14 -> 35
        var assessment = impactEngine.calculateImpact(
                91.0, 70.0,
                428, 312,
                22, 18,
                5, 4,
                14, 35, // Coupling worsened
                18.0, 15.0, // Coverage worsened
                4, 3
        );

        assertTrue(assessment.getRegressionCount() >= 2);
    }
}
