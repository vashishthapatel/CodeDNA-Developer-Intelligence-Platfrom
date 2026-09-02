package com.codedna.refactoriq.parser;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MethodModel {
    private String name;
    private String returnType;
    private int startLine;
    private int endLine;
    private int linesOfCode;
    private int parameterCount;
    @Builder.Default
    private List<String> parameters = new ArrayList<>();
    private int cyclomaticComplexity;
    private int nestingDepth;
    @Builder.Default
    private List<String> calledMethods = new ArrayList<>();
    @Builder.Default
    private List<String> annotations = new ArrayList<>();
    private boolean hasTryCatch;
    private String body;
}
