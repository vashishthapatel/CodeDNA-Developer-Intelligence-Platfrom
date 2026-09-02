package com.codedna.refactoriq.parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.BinaryExpr;
import com.github.javaparser.ast.expr.ConditionalExpr;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.stmt.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JavaSourceParser {

    private final JavaParser javaParser;

    public JavaSourceParser() {
        ParserConfiguration config = new ParserConfiguration();
        config.setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_21);
        this.javaParser = new JavaParser(config);
    }

    public Optional<SourceFileModel> parseSource(String filePath, String sourceCode) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return Optional.empty();
        }

        try {
            ParseResult<CompilationUnit> parseResult = javaParser.parse(sourceCode);
            if (!parseResult.isSuccessful() || parseResult.getResult().isEmpty()) {
                log.warn("JavaParser could not parse {}: {}", filePath, parseResult.getProblems());
                // Fallback basic model if strict AST fails
                return Optional.of(createFallbackModel(filePath, sourceCode));
            }

            CompilationUnit cu = parseResult.getResult().get();
            SourceFileModel model = new SourceFileModel();
            model.setPath(filePath);
            model.setRawContent(sourceCode);
            model.setTestFile(isTestFilePath(filePath, sourceCode));
            model.setLinesOfCode(calculateLoc(sourceCode));

            // Package
            cu.getPackageDeclaration().ifPresent(pkg -> model.setPackageName(pkg.getNameAsString()));

            // Imports
            List<String> imports = cu.getImports().stream()
                    .map(imp -> imp.getNameAsString())
                    .collect(Collectors.toList());
            model.setImports(imports);

            // Classes / Interfaces / Enums / Records
            List<ClassModel> classes = new ArrayList<>();
            for (TypeDeclaration<?> typeDecl : cu.getTypes()) {
                ClassModel classModel = parseTypeDeclaration(typeDecl);
                classes.add(classModel);
            }
            model.setClasses(classes);

            return Optional.of(model);
        } catch (Exception e) {
            log.error("Exception parsing Java file: {}", filePath, e);
            return Optional.of(createFallbackModel(filePath, sourceCode));
        }
    }

    private ClassModel parseTypeDeclaration(TypeDeclaration<?> typeDecl) {
        ClassModel cm = new ClassModel();
        cm.setName(typeDecl.getNameAsString());
        cm.setInterface(typeDecl.isClassOrInterfaceDeclaration() && typeDecl.asClassOrInterfaceDeclaration().isInterface());
        cm.setEnum(typeDecl.isEnumDeclaration());
        cm.setRecord(typeDecl.isRecordDeclaration());

        typeDecl.getRange().ifPresent(range -> {
            cm.setStartLine(range.begin.line);
            cm.setEndLine(range.end.line);
            cm.setLinesOfCode(Math.max(1, range.end.line - range.begin.line + 1));
        });

        // Fields
        List<String> fields = new ArrayList<>();
        for (FieldDeclaration fd : typeDecl.getFields()) {
            for (VariableDeclarator vd : fd.getVariables()) {
                fields.add(vd.getNameAsString() + ": " + vd.getTypeAsString());
            }
        }
        cm.setFields(fields);

        // Annotations
        List<String> annotations = typeDecl.getAnnotations().stream()
                .map(a -> a.getNameAsString())
                .collect(Collectors.toList());
        cm.setAnnotations(annotations);

        // Methods
        List<MethodModel> methods = new ArrayList<>();
        Set<String> referencedTypes = new HashSet<>();

        for (MethodDeclaration md : typeDecl.getMethods()) {
            MethodModel mm = parseMethodDeclaration(md);
            methods.add(mm);
            referencedTypes.addAll(extractReferencedTypes(md));
        }
        for (ConstructorDeclaration cd : typeDecl.getConstructors()) {
            MethodModel mm = parseConstructorDeclaration(cd);
            methods.add(mm);
        }

        cm.setMethods(methods);
        cm.setReferencedTypes(referencedTypes);
        return cm;
    }

    private MethodModel parseMethodDeclaration(MethodDeclaration md) {
        MethodModel mm = new MethodModel();
        mm.setName(md.getNameAsString());
        mm.setReturnType(md.getTypeAsString());
        mm.setParameterCount(md.getParameters().size());
        mm.setParameters(md.getParameters().stream()
                .map(p -> p.getTypeAsString() + " " + p.getNameAsString())
                .collect(Collectors.toList()));

        md.getRange().ifPresent(range -> {
            mm.setStartLine(range.begin.line);
            mm.setEndLine(range.end.line);
            mm.setLinesOfCode(Math.max(1, range.end.line - range.begin.line + 1));
        });

        mm.setAnnotations(md.getAnnotations().stream()
                .map(a -> a.getNameAsString())
                .collect(Collectors.toList()));

        // Complexity & Nesting
        int complexity = calculateCyclomaticComplexity(md);
        int nesting = calculateMaxNestingDepth(md);
        mm.setCyclomaticComplexity(complexity);
        mm.setNestingDepth(nesting);

        // Called methods
        List<String> calledMethods = md.findAll(MethodCallExpr.class).stream()
                .map(MethodCallExpr::getNameAsString)
                .distinct()
                .collect(Collectors.toList());
        mm.setCalledMethods(calledMethods);

        // Try-catch
        mm.setHasTryCatch(!md.findAll(TryStmt.class).isEmpty());
        mm.setBody(md.getBody().map(Node::toString).orElse(""));

        return mm;
    }

    private MethodModel parseConstructorDeclaration(ConstructorDeclaration cd) {
        MethodModel mm = new MethodModel();
        mm.setName(cd.getNameAsString());
        mm.setReturnType("void");
        mm.setParameterCount(cd.getParameters().size());
        mm.setParameters(cd.getParameters().stream()
                .map(p -> p.getTypeAsString() + " " + p.getNameAsString())
                .collect(Collectors.toList()));

        cd.getRange().ifPresent(range -> {
            mm.setStartLine(range.begin.line);
            mm.setEndLine(range.end.line);
            mm.setLinesOfCode(Math.max(1, range.end.line - range.begin.line + 1));
        });

        int complexity = calculateCyclomaticComplexity(cd);
        int nesting = calculateMaxNestingDepth(cd);
        mm.setCyclomaticComplexity(complexity);
        mm.setNestingDepth(nesting);
        mm.setCalledMethods(cd.findAll(MethodCallExpr.class).stream().map(MethodCallExpr::getNameAsString).distinct().collect(Collectors.toList()));
        mm.setHasTryCatch(!cd.findAll(TryStmt.class).isEmpty());
        mm.setBody(cd.getBody().toString());

        return mm;
    }

    public int calculateCyclomaticComplexity(Node node) {
        // Base complexity is 1
        int complexity = 1;

        // If, For, While, DoWhile
        complexity += node.findAll(IfStmt.class).size();
        complexity += node.findAll(ForStmt.class).size();
        complexity += node.findAll(ForEachStmt.class).size();
        complexity += node.findAll(WhileStmt.class).size();
        complexity += node.findAll(DoStmt.class).size();

        // Switch entries with labels (case label)
        complexity += node.findAll(SwitchEntry.class).stream()
                .filter(se -> !se.getLabels().isEmpty())
                .count();

        // Catch clauses
        complexity += node.findAll(CatchClause.class).size();

        // Ternary operator ?:
        complexity += node.findAll(ConditionalExpr.class).size();

        // Logical operators && and ||
        complexity += node.findAll(BinaryExpr.class).stream()
                .filter(be -> be.getOperator() == BinaryExpr.Operator.AND || be.getOperator() == BinaryExpr.Operator.OR)
                .count();

        return complexity;
    }

    public int calculateMaxNestingDepth(Node node) {
        return findDepth(node, 0);
    }

    private int findDepth(Node node, int currentDepth) {
        int max = currentDepth;
        for (Node child : node.getChildNodes()) {
            int nextDepth = currentDepth;
            if (isNestingConstruct(child)) {
                nextDepth = currentDepth + 1;
            }
            int childMax = findDepth(child, nextDepth);
            if (childMax > max) {
                max = childMax;
            }
        }
        return max;
    }

    private boolean isNestingConstruct(Node node) {
        return node instanceof IfStmt
                || node instanceof ForStmt
                || node instanceof ForEachStmt
                || node instanceof WhileStmt
                || node instanceof DoStmt
                || node instanceof SwitchStmt
                || node instanceof TryStmt
                || node instanceof CatchClause;
    }

    private Set<String> extractReferencedTypes(MethodDeclaration md) {
        Set<String> types = new HashSet<>();
        md.findAll(com.github.javaparser.ast.type.Type.class).forEach(t -> types.add(t.asString()));
        return types;
    }

    public static int calculateLoc(String code) {
        if (code == null) return 0;
        String[] lines = code.split("\r\n|\r|\n");
        int loc = 0;
        boolean inBlockComment = false;

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) {
                continue;
            }

            if (inBlockComment) {
                if (line.contains("*/")) {
                    inBlockComment = false;
                    int idx = line.indexOf("*/") + 2;
                    String rest = line.substring(idx).trim();
                    if (!rest.isEmpty() && !rest.startsWith("//")) {
                        loc++;
                    }
                }
                continue;
            }

            if (line.startsWith("/*")) {
                if (!line.contains("*/")) {
                    inBlockComment = true;
                } else {
                    int idx = line.indexOf("*/") + 2;
                    String rest = line.substring(idx).trim();
                    if (!rest.isEmpty() && !rest.startsWith("//")) {
                        loc++;
                    }
                }
                continue;
            }

            if (line.startsWith("//")) {
                continue;
            }

            loc++;
        }
        return Math.max(1, loc);
    }

    private boolean isTestFilePath(String filePath, String sourceCode) {
        if (filePath != null && (filePath.contains("/test/") || filePath.contains("\\test\\") || filePath.endsWith("Test.java") || filePath.endsWith("Tests.java") || filePath.endsWith("TestCase.java"))) {
            return true;
        }
        return sourceCode != null && (sourceCode.contains("@Test") || sourceCode.contains("org.junit.") || sourceCode.contains("org.testng."));
    }

    private SourceFileModel createFallbackModel(String filePath, String sourceCode) {
        int loc = calculateLoc(sourceCode);
        ClassModel cm = ClassModel.builder()
                .name(extractSimpleClassName(filePath))
                .linesOfCode(loc)
                .startLine(1)
                .endLine(sourceCode.split("\n").length)
                .build();

        return SourceFileModel.builder()
                .path(filePath)
                .rawContent(sourceCode)
                .linesOfCode(loc)
                .testFile(isTestFilePath(filePath, sourceCode))
                .classes(List.of(cm))
                .build();
    }

    private String extractSimpleClassName(String path) {
        if (path == null) return "UnknownClass";
        String normalized = path.replace("\\", "/");
        int lastSlash = normalized.lastIndexOf('/');
        String filename = lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
        if (filename.endsWith(".java")) {
            return filename.substring(0, filename.length() - 5);
        }
        return filename;
    }
}
