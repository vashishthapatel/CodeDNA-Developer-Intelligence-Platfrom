package com.codedna.refactoriq.metrics;

import com.codedna.refactoriq.parser.SourceFileModel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TestAnalyzer {

    public double calculateTestToCodeRatio(int testLoc, int prodLoc) {
        if (prodLoc <= 0) {
            return testLoc > 0 ? 100.0 : 0.0;
        }
        double ratio = ((double) testLoc / (double) prodLoc) * 100.0;
        return Math.min(100.0, Math.round(ratio * 10.0) / 10.0);
    }

    public boolean hasMatchingTestClass(SourceFileModel prodFile, List<SourceFileModel> allFiles) {
        if (prodFile.isTestFile() || prodFile.getClasses().isEmpty()) {
            return true;
        }
        String className = prodFile.getClasses().get(0).getName();
        String expectedTest1 = className + "Test";
        String expectedTest2 = className + "Tests";
        String expectedTest3 = "Test" + className;

        return allFiles.stream()
                .filter(SourceFileModel::isTestFile)
                .anyMatch(tf -> tf.getClasses().stream().anyMatch(tc ->
                        tc.getName().equalsIgnoreCase(expectedTest1)
                                || tc.getName().equalsIgnoreCase(expectedTest2)
                                || tc.getName().equalsIgnoreCase(expectedTest3)
                                || (tf.getRawContent() != null && tf.getRawContent().contains(className))
                ));
    }
}
