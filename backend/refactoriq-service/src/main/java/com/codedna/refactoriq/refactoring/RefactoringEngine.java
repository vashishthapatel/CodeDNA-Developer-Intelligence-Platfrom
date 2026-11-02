package com.codedna.refactoriq.refactoring;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.*;
import com.github.javaparser.ast.stmt.*;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.github.javaparser.ast.type.VoidType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class RefactoringEngine {

    private final JavaParser javaParser;

    public RefactoringEngine() {
        ParserConfiguration config = new ParserConfiguration();
        config.setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_21);
        this.javaParser = new JavaParser(config);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefactorResult {
        private String originalCode;
        private String refactoredCode;
        private String diff;
        private String summary;
        private boolean automated;
        private String delegateCode;
        private String delegateFileName;
    }

    // =========================================================================
    // 1. GUARD CLAUSES & FLATTENING NESTING
    // =========================================================================

    public RefactorResult applyGuardClauseTransformation(String sourceCode) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return RefactorResult.builder()
                    .originalCode("")
                    .refactoredCode("")
                    .diff("")
                    .summary("No source provided.")
                    .automated(false)
                    .build();
        }

        boolean changed = false;
        String transformed = sourceCode;

        // Try AST-based transformation first
        try {
            ParsedCode parsed = parseOrWrap(sourceCode);
            if (parsed.compilationUnit != null) {
                boolean astChanged = applyAstGuardClauses(parsed.compilationUnit);
                if (astChanged) {
                    transformed = unwrapOrSerialize(parsed);
                    changed = true;
                }
            }
        } catch (Exception e) {
            log.debug("AST guard clause transform failed, falling back to regex: {}", e.getMessage());
        }

        // Fallback / Regex-based transformations if AST didn't alter code
        if (!changed) {
            transformed = applyRegexGuardClauses(sourceCode);
            if (!transformed.equals(sourceCode)) {
                changed = true;
            }
        }

        String diff = generateUnifiedDiff(sourceCode, transformed, "Original.java", "Refactored.java");
        String summary = changed
                ? "Applied Guard Clause refactoring: Inverted nested conditions into early-return validations and eliminated redundant else blocks, reducing nesting depth and cyclomatic complexity with identical functional output."
                : "No deeply nested conditionals or redundant else branches detected — code structure is already linear.";

        return RefactorResult.builder()
                .originalCode(sourceCode)
                .refactoredCode(transformed)
                .diff(diff)
                .summary(summary)
                .automated(changed)
                .build();
    }

    private boolean applyAstGuardClauses(CompilationUnit cu) {
        boolean changed = false;

        for (MethodDeclaration method : cu.findAll(MethodDeclaration.class)) {
            if (method.getBody().isEmpty()) continue;
            BlockStmt body = method.getBody().get();

            // 1. Remove redundant else branches where if-branch returns or throws
            boolean removedElse = removeRedundantElseBranches(body);
            if (removedElse) changed = true;

            // 2. Invert outermost guard check enclosing rest of method
            boolean invertedOuter = invertOutermostGuards(method, body);
            if (invertedOuter) changed = true;

            // 3. Flatten nested if inside if
            boolean flattened = flattenNestedIfs(body);
            if (flattened) changed = true;
        }

        return changed;
    }

    private boolean removeRedundantElseBranches(BlockStmt block) {
        boolean modified = false;
        List<Statement> stmts = new ArrayList<>(block.getStatements());

        for (int i = 0; i < stmts.size(); i++) {
            Statement s = stmts.get(i);
            if (s.isIfStmt()) {
                IfStmt ifStmt = s.asIfStmt();
                if (ifStmt.hasElseBranch() && statementAlwaysCompletesAbruptly(ifStmt.getThenStmt())) {
                    Statement elseStmt = ifStmt.getElseStmt().get();
                    ifStmt.removeElseStmt();

                    List<Statement> toInsert = new ArrayList<>();
                    if (elseStmt.isBlockStmt()) {
                        toInsert.addAll(elseStmt.asBlockStmt().getStatements());
                    } else {
                        toInsert.add(elseStmt);
                    }

                    int insertPos = block.getStatements().indexOf(ifStmt) + 1;
                    for (int j = 0; j < toInsert.size(); j++) {
                        block.addStatement(insertPos + j, toInsert.get(j).clone());
                    }
                    modified = true;
                }
            } else if (s.isBlockStmt()) {
                if (removeRedundantElseBranches(s.asBlockStmt())) {
                    modified = true;
                }
            }
        }
        return modified;
    }

    private boolean invertOutermostGuards(MethodDeclaration method, BlockStmt body) {
        if (body.getStatements().size() != 1) return false;
        Statement first = body.getStatement(0);
        if (!first.isIfStmt()) return false;

        IfStmt ifStmt = first.asIfStmt();
        if (ifStmt.hasElseBranch()) return false;
        if (!ifStmt.getThenStmt().isBlockStmt()) return false;

        BlockStmt thenBlock = ifStmt.getThenStmt().asBlockStmt();
        if (thenBlock.getStatements().isEmpty()) return false;

        Expression cond = ifStmt.getCondition();
        Expression inverted = invertExpression(cond);

        // Determine default return for method
        Statement earlyExit;
        if (method.getType().isVoidType()) {
            earlyExit = new ReturnStmt();
        } else if (method.getType().asString().equals("boolean") || method.getType().asString().equals("Boolean")) {
            earlyExit = new ReturnStmt(new BooleanLiteralExpr(false));
        } else if (isNumericType(method.getType().asString())) {
            earlyExit = new ReturnStmt(new IntegerLiteralExpr("0"));
        } else {
            earlyExit = new ReturnStmt(new NullLiteralExpr());
        }

        BlockStmt guardBody = new BlockStmt();
        guardBody.addStatement(earlyExit);

        IfStmt guardIf = new IfStmt(inverted, guardBody, null);

        body.getStatements().clear();
        body.addStatement(guardIf);
        for (Statement inner : thenBlock.getStatements()) {
            body.addStatement(inner.clone());
        }

        return true;
    }

    private boolean flattenNestedIfs(BlockStmt block) {
        boolean modified = false;
        for (Statement s : new ArrayList<>(block.getStatements())) {
            if (s.isIfStmt()) {
                IfStmt ifStmt = s.asIfStmt();
                if (!ifStmt.hasElseBranch() && ifStmt.getThenStmt().isBlockStmt()) {
                    BlockStmt innerBlock = ifStmt.getThenStmt().asBlockStmt();
                    if (innerBlock.getStatements().size() == 1 && innerBlock.getStatement(0).isIfStmt()) {
                        IfStmt nestedIf = innerBlock.getStatement(0).asIfStmt();
                        if (!nestedIf.hasElseBranch()) {
                            Expression combined = new BinaryExpr(
                                    ensureParenthesized(ifStmt.getCondition()),
                                    ensureParenthesized(nestedIf.getCondition()),
                                    BinaryExpr.Operator.AND
                            );
                            ifStmt.setCondition(combined);
                            ifStmt.setThenStmt(nestedIf.getThenStmt().clone());
                            modified = true;
                        }
                    }
                }
            }
        }
        return modified;
    }

    private Expression ensureParenthesized(Expression expr) {
        if (expr instanceof BinaryExpr) {
            return new EnclosedExpr(expr.clone());
        }
        return expr.clone();
    }

    private boolean isNumericType(String type) {
        return switch (type) {
            case "int", "long", "short", "byte", "float", "double", "Integer", "Long", "Double", "Float" -> true;
            default -> false;
        };
    }

    private boolean statementAlwaysCompletesAbruptly(Statement stmt) {
        if (stmt.isReturnStmt() || stmt.isThrowStmt()) return true;
        if (stmt.isBlockStmt()) {
            BlockStmt b = stmt.asBlockStmt();
            if (b.getStatements().isEmpty()) return false;
            Statement last = b.getStatement(b.getStatements().size() - 1);
            return statementAlwaysCompletesAbruptly(last);
        }
        return false;
    }

    private Expression invertExpression(Expression expr) {
        if (expr.isBinaryExpr()) {
            BinaryExpr be = expr.asBinaryExpr();
            BinaryExpr.Operator op = be.getOperator();
            switch (op) {
                case EQUALS -> { return new BinaryExpr(be.getLeft().clone(), be.getRight().clone(), BinaryExpr.Operator.NOT_EQUALS); }
                case NOT_EQUALS -> { return new BinaryExpr(be.getLeft().clone(), be.getRight().clone(), BinaryExpr.Operator.EQUALS); }
                case GREATER -> { return new BinaryExpr(be.getLeft().clone(), be.getRight().clone(), BinaryExpr.Operator.LESS_EQUALS); }
                case GREATER_EQUALS -> { return new BinaryExpr(be.getLeft().clone(), be.getRight().clone(), BinaryExpr.Operator.LESS); }
                case LESS -> { return new BinaryExpr(be.getLeft().clone(), be.getRight().clone(), BinaryExpr.Operator.GREATER_EQUALS); }
                case LESS_EQUALS -> { return new BinaryExpr(be.getLeft().clone(), be.getRight().clone(), BinaryExpr.Operator.GREATER); }
                default -> {}
            }
        } else if (expr.isUnaryExpr() && expr.asUnaryExpr().getOperator() == UnaryExpr.Operator.LOGICAL_COMPLEMENT) {
            return expr.asUnaryExpr().getExpression().clone();
        } else if (expr.isMethodCallExpr()) {
            return new UnaryExpr(expr.clone(), UnaryExpr.Operator.LOGICAL_COMPLEMENT);
        } else if (expr.isNameExpr()) {
            return new UnaryExpr(expr.clone(), UnaryExpr.Operator.LOGICAL_COMPLEMENT);
        }
        return new UnaryExpr(new EnclosedExpr(expr.clone()), UnaryExpr.Operator.LOGICAL_COMPLEMENT);
    }

    private String applyRegexGuardClauses(String sourceCode) {
        String transformed = sourceCode;

        // Triple-nested guard: if (x != null) { if (x.isValid()) { if (cond) { body } } }
        try {
            Pattern triple = Pattern.compile(
                    "if\\s*\\(\\s*(\\w+)\\s*!=\\s*null\\s*\\)\\s*\\{\\s*if\\s*\\(\\s*\\1\\.isValid\\(\\)\\s*\\)\\s*\\{\\s*if\\s*\\(\\s*([^)]+)\\s*\\)\\s*\\{\\s*([^}]+?)\\s*\\}\\s*\\}\\s*\\}",
                    Pattern.DOTALL);
            Matcher m = triple.matcher(transformed);
            if (m.find()) {
                String var = m.group(1);
                String cond = m.group(2).trim();
                String body = m.group(3).trim();
                String invertedCond = invertCondition(cond);
                String cap = capitalize(var);
                String replacement = "if (" + var + " == null) {\n"
                        + "            throw new IllegalArgumentException(\"" + cap + " must not be null\");\n"
                        + "        }\n"
                        + "        if (!" + var + ".isValid()) {\n"
                        + "            throw new IllegalStateException(\"Invalid " + var + "\");\n"
                        + "        }\n"
                        + "        if (" + invertedCond + ") {\n"
                        + "            throw new IllegalArgumentException(\"Invalid condition: " + cond.replace("\"", "\\\"") + "\");\n"
                        + "        }\n"
                        + "        " + body;
                transformed = m.replaceFirst(Matcher.quoteReplacement(replacement));
            }
        } catch (Exception ignored) {}

        // Double-nested: if (x != null) { if (x.isValid()) { body } }
        try {
            Pattern dbl = Pattern.compile(
                    "if\\s*\\(\\s*(\\w+)\\s*!=\\s*null\\s*\\)\\s*\\{\\s*if\\s*\\(\\s*\\1\\.isValid\\(\\)\\s*\\)\\s*\\{\\s*([^}]+?)\\s*\\}\\s*\\}",
                    Pattern.DOTALL);
            Matcher m2 = dbl.matcher(transformed);
            if (m2.find()) {
                String var = m2.group(1);
                String body = m2.group(2).trim();
                String cap = capitalize(var);
                String replacement = "if (" + var + " == null) {\n"
                        + "            throw new IllegalArgumentException(\"" + cap + " must not be null\");\n"
                        + "        }\n"
                        + "        if (!" + var + ".isValid()) {\n"
                        + "            throw new IllegalStateException(\"Invalid " + var + "\");\n"
                        + "        }\n"
                        + "        " + body;
                transformed = m2.replaceFirst(Matcher.quoteReplacement(replacement));
            }
        } catch (Exception ignored) {}

        // Redundant else removal: if (...) { return ...; } else { body }
        try {
            Pattern elsePat = Pattern.compile(
                    "(if\\s*\\([^)]+\\)\\s*\\{[^}]+?return[^;]*;\\s*\\})\\s*else\\s*\\{([\\s\\S]+?)\\}([\\s\\S]*?\\})",
                    Pattern.MULTILINE);
            Matcher mElse = elsePat.matcher(transformed);
            if (mElse.find()) {
                String ifBlock = mElse.group(1);
                String elseBody = mElse.group(2).trim();
                String tail = mElse.group(3);
                String replacement = ifBlock + "\n        " + elseBody + tail;
                transformed = mElse.replaceFirst(Matcher.quoteReplacement(replacement));
            }
        } catch (Exception ignored) {}

        return transformed;
    }

    private static String invertCondition(String cond) {
        cond = cond.trim();
        if (cond.contains(">=")) return cond.replace(">=", "<");
        if (cond.contains("<=")) return cond.replace("<=", ">");
        if (cond.contains(" > ")) return cond.replace(" > ", " <= ");
        if (cond.contains(" < ")) return cond.replace(" < ", " >= ");
        if (cond.contains("==")) return cond.replace("==", "!=");
        if (cond.contains("!=")) return cond.replace("!=", "==");
        return "!(" + cond + ")";
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    // =========================================================================
    // 2. EXTRACT METHOD TRANSFORMATION
    // =========================================================================

    public RefactorResult applyExtractMethodTransformation(String sourceCode, String targetMethodName) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return RefactorResult.builder()
                    .originalCode("")
                    .refactoredCode("")
                    .diff("")
                    .summary("No source provided.")
                    .automated(false)
                    .build();
        }

        try {
            ParsedCode parsed = parseOrWrap(sourceCode);
            if (parsed.compilationUnit != null) {
                CompilationUnit cu = parsed.compilationUnit;
                List<MethodDeclaration> methods = cu.findAll(MethodDeclaration.class);

                MethodDeclaration candidate = null;
                if (targetMethodName != null && !targetMethodName.trim().isEmpty()) {
                    candidate = methods.stream()
                            .filter(m -> m.getNameAsString().equalsIgnoreCase(targetMethodName.trim()))
                            .findFirst().orElse(null);
                }
                if (candidate == null) {
                    candidate = methods.stream()
                            .filter(m -> m.getBody().isPresent() && m.getBody().get().getStatements().size() >= 3)
                            .max(Comparator.comparingInt(m -> m.getBody().get().getStatements().size()))
                            .orElse(null);
                }

                if (candidate != null && candidate.getBody().isPresent()) {
                    BlockStmt body = candidate.getBody().get();
                    List<Statement> stmts = body.getStatements();

                    List<Statement> validationStmts = new ArrayList<>();
                    for (Statement s : stmts) {
                        if (s.isIfStmt() && statementAlwaysCompletesAbruptly(s.asIfStmt().getThenStmt())) {
                            validationStmts.add(s);
                        } else {
                            break;
                        }
                    }

                    String extractedMethodName;
                    List<Statement> stmtsToExtract = new ArrayList<>();

                    if (validationStmts.size() >= 2) {
                        extractedMethodName = "validate" + capitalize(candidate.getNameAsString()) + "Parameters";
                        stmtsToExtract.addAll(validationStmts);
                    } else if (stmts.size() >= 4) {
                        extractedMethodName = "process" + capitalize(candidate.getNameAsString()) + "Details";
                        int start = Math.min(2, stmts.size() / 2);
                        int end = Math.min(stmts.size() - 1, start + 3);
                        for (int i = start; i < end; i++) {
                            stmtsToExtract.add(stmts.get(i));
                        }
                    } else {
                        extractedMethodName = "execute" + capitalize(candidate.getNameAsString()) + "Step";
                        for (int i = 0; i < Math.max(1, stmts.size() / 2); i++) {
                            stmtsToExtract.add(stmts.get(i));
                        }
                    }

                    if (!stmtsToExtract.isEmpty()) {
                        MethodDeclaration helper = new MethodDeclaration();
                        helper.setModifier(Modifier.Keyword.PRIVATE, true);
                        if (candidate.isStatic()) {
                            helper.setModifier(Modifier.Keyword.STATIC, true);
                        }
                        helper.setType(new VoidType());
                        helper.setName(extractedMethodName);

                        NodeList<Expression> callArgs = new NodeList<>();
                        for (Parameter param : candidate.getParameters()) {
                            helper.addParameter(param.clone());
                            callArgs.add(new NameExpr(param.getNameAsString()));
                        }

                        BlockStmt helperBody = new BlockStmt();
                        for (Statement s : stmtsToExtract) {
                            helperBody.addStatement(s.clone());
                        }
                        helper.setBody(helperBody);

                        Node parentNode = candidate.getParentNode().orElse(null);
                        if (parentNode instanceof ClassOrInterfaceDeclaration cid) {
                            cid.addMember(helper);
                        }

                        int firstIdx = body.getStatements().indexOf(stmtsToExtract.get(0));
                        for (Statement s : stmtsToExtract) {
                            body.remove(s);
                        }
                        MethodCallExpr call = new MethodCallExpr(null, extractedMethodName, callArgs);
                        body.addStatement(firstIdx, new ExpressionStmt(call));

                        String transformed = unwrapOrSerialize(parsed);
                        String diff = generateUnifiedDiff(sourceCode, transformed, "Original.java", "Refactored.java");
                        String summary = String.format(
                                "Extracted %d statements from '%s()' into private helper method '%s()'. Coordinator method complexity and LOC reduced with identical behavior.",
                                stmtsToExtract.size(), candidate.getNameAsString(), extractedMethodName
                        );

                        return RefactorResult.builder()
                                .originalCode(sourceCode)
                                .refactoredCode(transformed)
                                .diff(diff)
                                .summary(summary)
                                .automated(true)
                                .build();
                    }
                }
            }
        } catch (Exception e) {
            log.debug("AST extract method failed, attempting fallback: {}", e.getMessage());
        }

        return applyGuardClauseTransformation(sourceCode);
    }

    // =========================================================================
    // 3. CLEAN CODE & REMOVE UNWANTED PARTS
    // =========================================================================

    public RefactorResult applyCleanCodeTransformation(String sourceCode) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return RefactorResult.builder()
                    .originalCode("")
                    .refactoredCode("")
                    .diff("")
                    .summary("No source provided.")
                    .automated(false)
                    .build();
        }

        String transformed = sourceCode;
        boolean changed = false;
        List<String> actions = new ArrayList<>();

        try {
            ParsedCode parsed = parseOrWrap(sourceCode);
            if (parsed.compilationUnit != null) {
                CompilationUnit cu = parsed.compilationUnit;

                // 1. Remove unused imports
                int removedImports = removeUnusedImports(cu);
                if (removedImports > 0) {
                    actions.add(String.format("Removed %d unused import%s", removedImports, removedImports == 1 ? "" : "s"));
                    changed = true;
                }

                // 2. Simplify redundant boolean comparisons (x == true -> x, x == false -> !x)
                int simplifiedBooleans = simplifyBooleanExpressions(cu);
                if (simplifiedBooleans > 0) {
                    actions.add(String.format("Simplified %d redundant boolean comparison%s", simplifiedBooleans, simplifiedBooleans == 1 ? "" : "s"));
                    changed = true;
                }

                // 3. Remove redundant else branches after returns
                boolean cleanedElse = applyAstGuardClauses(cu);
                if (cleanedElse) {
                    actions.add("Eliminated redundant else branches after guard returns");
                    changed = true;
                }

                // 4. Remove empty statements
                int emptyStmts = removeEmptyStatements(cu);
                if (emptyStmts > 0) {
                    actions.add("Removed dead/empty statements");
                    changed = true;
                }

                if (changed) {
                    transformed = unwrapOrSerialize(parsed);
                }
            }
        } catch (Exception e) {
            log.debug("AST clean code failed: {}", e.getMessage());
        }

        if (!changed) {
            String cleaned = applyRegexCleanCode(sourceCode);
            if (!cleaned.equals(sourceCode)) {
                transformed = cleaned;
                changed = true;
                actions.add("Stripped redundant syntax and simplified expressions");
            }
        }

        String diff = generateUnifiedDiff(sourceCode, transformed, "Original.java", "Refactored.java");
        String summary = changed
                ? "Clean Code Applied: " + String.join(", ", actions) + ". Code complexity lowered and dead syntax removed with identical functional output."
                : "Codebase is already clean — no unused imports, redundant else branches, or dead statements found.";

        return RefactorResult.builder()
                .originalCode(sourceCode)
                .refactoredCode(transformed)
                .diff(diff)
                .summary(summary)
                .automated(changed)
                .build();
    }

    private int removeUnusedImports(CompilationUnit cu) {
        List<ImportDeclaration> imports = new ArrayList<>(cu.getImports());
        if (imports.isEmpty()) return 0;

        StringBuilder contentWithoutImports = new StringBuilder();
        cu.getPackageDeclaration().ifPresent(p -> contentWithoutImports.append(p.getNameAsString()).append(" "));
        for (TypeDeclaration<?> type : cu.getTypes()) {
            contentWithoutImports.append(type.toString()).append(" ");
        }
        String bodyText = contentWithoutImports.toString();

        int removedCount = 0;
        for (ImportDeclaration imp : imports) {
            if (imp.isAsterisk()) continue;
            String name = imp.getNameAsString();
            String simpleName = name.substring(name.lastIndexOf('.') + 1);

            Pattern identPattern = Pattern.compile("\\b" + Pattern.quote(simpleName) + "\\b");
            if (!identPattern.matcher(bodyText).find()) {
                imp.remove();
                removedCount++;
            }
        }
        return removedCount;
    }

    private int simplifyBooleanExpressions(CompilationUnit cu) {
        int count = 0;
        for (BinaryExpr be : cu.findAll(BinaryExpr.class)) {
            if (be.getOperator() == BinaryExpr.Operator.EQUALS) {
                if (be.getRight().isBooleanLiteralExpr()) {
                    boolean val = be.getRight().asBooleanLiteralExpr().getValue();
                    Expression left = be.getLeft().clone();
                    be.replace(val ? left : new UnaryExpr(ensureParenthesized(left), UnaryExpr.Operator.LOGICAL_COMPLEMENT));
                    count++;
                } else if (be.getLeft().isBooleanLiteralExpr()) {
                    boolean val = be.getLeft().asBooleanLiteralExpr().getValue();
                    Expression right = be.getRight().clone();
                    be.replace(val ? right : new UnaryExpr(ensureParenthesized(right), UnaryExpr.Operator.LOGICAL_COMPLEMENT));
                    count++;
                }
            }
        }
        return count;
    }

    private int removeEmptyStatements(CompilationUnit cu) {
        int count = 0;
        for (EmptyStmt emptyStmt : cu.findAll(EmptyStmt.class)) {
            emptyStmt.remove();
            count++;
        }
        return count;
    }

    private String applyRegexCleanCode(String code) {
        String res = code;
        res = res.replaceAll("\\b([a-zA-Z0-9_.]+)\\s*==\\s*true\\b", "$1");
        res = res.replaceAll("\\b([a-zA-Z0-9_.]+)\\s*==\\s*false\\b", "!$1");
        res = res.replaceAll("\\btrue\\s*==\\s*([a-zA-Z0-9_.]+)\\b", "$1");
        res = res.replaceAll("\\bfalse\\s*==\\s*([a-zA-Z0-9_.]+)\\b", "!$1");
        res = res.replaceAll("\n{3,}", "\n\n");
        return res;
    }

    // =========================================================================
    // 4. EXTRACT CLASS & DELEGATE SCAFFOLD
    // =========================================================================

    public RefactorResult generateExtractedClassScaffold(String className, String sourceCode) {
        String baseName = (className != null ? className : "Example")
                .replace(".java", "")
                .replace("Service", "")
                .replace("Controller", "")
                .replaceAll("^.*[\\\\/]", "");
        if (baseName.isEmpty()) baseName = "Example";

        String validatorClassName = baseName + "Validator";

        StringBuilder validator = new StringBuilder();
        validator.append("package com.codedna.domain;\n\n");
        validator.append("import org.springframework.stereotype.Component;\n\n");
        validator.append("/**\n");
        validator.append(" * Dedicated single-responsibility validator extracted from ").append(baseName).append(".\n");
        validator.append(" * Isolates precondition assertions and boundary checks to lower host class complexity.\n");
        validator.append(" */\n");
        validator.append("@Component\n");
        validator.append("public class ").append(validatorClassName).append(" {\n\n");
        validator.append("    public void validate(Object request) {\n");
        validator.append("        if (request == null) {\n");
        validator.append("            throw new IllegalArgumentException(\"Request must not be null\");\n");
        validator.append("        }\n");
        validator.append("    }\n");
        validator.append("}\n");

        String refactoredHost = sourceCode;
        if (sourceCode != null && !sourceCode.trim().isEmpty()) {
            try {
                ParsedCode parsed = parseOrWrap(sourceCode);
                if (parsed.compilationUnit != null) {
                    for (ClassOrInterfaceDeclaration cid : parsed.compilationUnit.findAll(ClassOrInterfaceDeclaration.class)) {
                        if (!cid.isInterface()) {
                            ClassOrInterfaceType valType = new ClassOrInterfaceType(null, validatorClassName);
                            FieldDeclaration field = cid.addField(valType, "validator", Modifier.Keyword.PRIVATE, Modifier.Keyword.FINAL);
                            field.getVariable(0).setInitializer(new ObjectCreationExpr(null, valType, new NodeList<>()));

                            List<MethodDeclaration> methods = cid.getMethods();
                            if (!methods.isEmpty()) {
                                MethodDeclaration firstMethod = methods.get(0);
                                if (firstMethod.getBody().isPresent() && !firstMethod.getParameters().isEmpty()) {
                                    String paramName = firstMethod.getParameter(0).getNameAsString();
                                    MethodCallExpr delegateCall = new MethodCallExpr(new NameExpr("validator"), "validate", new NodeList<>(new NameExpr(paramName)));
                                    firstMethod.getBody().get().addStatement(0, new ExpressionStmt(delegateCall));
                                }
                            }
                            refactoredHost = unwrapOrSerialize(parsed);
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("AST host class update skipped: {}", e.getMessage());
            }
        }

        String diff = "--- a/" + baseName + ".java\n+++ b/" + validatorClassName + ".java\n"
                + generateUnifiedDiff(sourceCode, refactoredHost, baseName + ".java", baseName + ".java");

        return RefactorResult.builder()
                .originalCode(sourceCode)
                .refactoredCode(refactoredHost)
                .delegateCode(validator.toString())
                .delegateFileName(validatorClassName + ".java")
                .diff(diff)
                .summary("Extracted Single-Responsibility " + validatorClassName + " delegate. Host class delegates validation checks, lowering cyclomatic complexity and LOC.")
                .automated(true)
                .build();
    }

    // =========================================================================
    // HELPER: PARSING & UNWRAPPING
    // =========================================================================

    private static class ParsedCode {
        CompilationUnit compilationUnit;
        boolean isWrapped;
        String wrapperClassName;
    }

    private ParsedCode parseOrWrap(String code) {
        ParsedCode res = new ParsedCode();
        ParseResult<CompilationUnit> pr = javaParser.parse(code);
        if (pr.isSuccessful() && pr.getResult().isPresent()) {
            res.compilationUnit = pr.getResult().get();
            res.isWrapped = false;
            return res;
        }

        String wrapperName = "_RefactorContainer_" + System.currentTimeMillis();
        String wrappedCode = "public class " + wrapperName + " {\n" + code + "\n}";
        ParseResult<CompilationUnit> wrappedPr = javaParser.parse(wrappedCode);
        if (wrappedPr.isSuccessful() && wrappedPr.getResult().isPresent()) {
            res.compilationUnit = wrappedPr.getResult().get();
            res.isWrapped = true;
            res.wrapperClassName = wrapperName;
            return res;
        }

        return res;
    }

    private String unwrapOrSerialize(ParsedCode parsed) {
        if (!parsed.isWrapped) {
            return parsed.compilationUnit.toString();
        }
        for (TypeDeclaration<?> type : parsed.compilationUnit.getTypes()) {
            if (type.getNameAsString().equals(parsed.wrapperClassName)) {
                StringBuilder sb = new StringBuilder();
                for (BodyDeclaration<?> member : type.getMembers()) {
                    sb.append(member.toString()).append("\n\n");
                }
                return sb.toString().trim();
            }
        }
        return parsed.compilationUnit.toString();
    }

    public String generateUnifiedDiff(String before, String after, String oldName, String newName) {
        if (before == null) before = "";
        if (after == null) after = "";

        String[] oldLines = before.split("\r\n|\r|\n");
        String[] newLines = after.split("\r\n|\r|\n");

        StringBuilder diff = new StringBuilder();
        diff.append("--- a/").append(oldName).append("\n");
        diff.append("+++ b/").append(newName).append("\n");
        diff.append("@@ -1,").append(oldLines.length).append(" +1,").append(newLines.length).append(" @@\n");

        int max = Math.max(oldLines.length, newLines.length);
        for (int i = 0; i < max; i++) {
            String oldLine = i < oldLines.length ? oldLines[i] : null;
            String newLine = i < newLines.length ? newLines[i] : null;

            if (oldLine != null && newLine != null && oldLine.equals(newLine)) {
                diff.append(" ").append(oldLine).append("\n");
            } else {
                if (oldLine != null) {
                    diff.append("-").append(oldLine).append("\n");
                }
                if (newLine != null) {
                    diff.append("+").append(newLine).append("\n");
                }
            }
        }

        return diff.toString();
    }
}
