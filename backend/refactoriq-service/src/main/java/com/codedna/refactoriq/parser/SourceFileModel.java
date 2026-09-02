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
public class SourceFileModel {
    private String path;
    private String packageName;
    @Builder.Default
    private List<String> imports = new ArrayList<>();
    @Builder.Default
    private List<ClassModel> classes = new ArrayList<>();
    private int linesOfCode;
    private boolean testFile;
    private String rawContent;
}
