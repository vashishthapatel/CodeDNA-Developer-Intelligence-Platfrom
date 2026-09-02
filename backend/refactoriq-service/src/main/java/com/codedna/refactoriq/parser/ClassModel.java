package com.codedna.refactoriq.parser;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassModel {
    private String name;
    private boolean isInterface;
    private boolean isEnum;
    private boolean isRecord;
    private int startLine;
    private int endLine;
    private int linesOfCode;
    @Builder.Default
    private List<String> fields = new ArrayList<>();
    @Builder.Default
    private List<MethodModel> methods = new ArrayList<>();
    @Builder.Default
    private Set<String> referencedTypes = new HashSet<>();
    @Builder.Default
    private List<String> annotations = new ArrayList<>();
}
