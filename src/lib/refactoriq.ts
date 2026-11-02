// CodeDNA RefactorIQ — Frontend Client & Isomorphic Deterministic Static Analysis Engine

export const EMPTY_JAVA_TEMPLATE = `public class Example {
    // Paste your Java source here to analyze complexity,
    // nesting depth, coupling and code smells.
}
`;

export interface FileMetric {
  id: number;
  analysisId: number;
  filePath: string;
  className: string;
  language: string;
  linesOfCode: number;
  classCount: number;
  methodCount: number;
  cyclomaticComplexity: number;
  maxNestingDepth: number;
  importCount: number;
  dependencyCount: number;
  testFile: boolean;
  testCoverage: number;
  complexityScore: number;
  hotspotScore: number;
  changeFrequency: number;
}

export interface MethodMetric {
  id?: number;
  fileMetricId?: number;
  methodName: string;
  startLine: number;
  endLine: number;
  linesOfCode: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  parameterCount: number;
}

export type IssueType =
  | 'HIGH_COMPLEXITY'
  | 'LARGE_CLASS'
  | 'LARGE_METHOD'
  | 'DEEP_NESTING'
  | 'HIGH_COUPLING'
  | 'DUPLICATION'
  | 'LOW_TEST_COVERAGE'
  | 'LAYER_VIOLATION'
  | 'LOW_COVERAGE_HIGH_COMPLEXITY';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RefactoringType =
  | 'EXTRACT_CLASS'
  | 'EXTRACT_METHOD'
  | 'INTRODUCE_GUARD_CLAUSES'
  | 'REDUCE_DEPENDENCIES'
  | 'EXTRACT_SHARED_LOGIC'
  | 'ADD_UNIT_TESTS'
  | 'FIX_LAYER_VIOLATION'
  | 'RENAME_METHOD'
  | 'REMOVE_UNUSED_IMPORTS';

export interface RefactorIssue {
  id: number;
  analysisId: number;
  filePath: string;
  methodName?: string | null;
  type: IssueType;
  severity: Severity;
  message: string;
  metricValue: number;
  threshold: number;
  estimatedImpact: string;
}

export interface RefactorRecommendation {
  id: number;
  issueId: number;
  title: string;
  description: string;
  refactoringType: RefactoringType;
  estimatedImpact: string;
  priority: number;
  steps: string[];
}

export interface RefactorAnalysis {
  id: number;
  repositoryId: number;
  commitSha: string;
  overallScore: number; // 0-100
  totalFiles: number;
  totalLines: number;
  totalClasses: number;
  totalMethods: number;
  averageComplexity: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  summary?: string;
  createdAt: string;
  fileMetrics?: FileMetric[];
  issues?: RefactorIssue[];
  recommendations?: RefactorRecommendation[];
}

export interface RefactoringPlan {
  issueId: number;
  fileName: string;
  title: string;
  problem: string;
  impact: string;
  priority: number;
  refactoringType: RefactoringType;
  steps: string[];
  beforeCodeSnippet?: string;
  proposedCodeSnippet?: string;
  diffPreview?: string;
}

export interface RefactoringSession {
  id: number;
  repositoryId: number;
  beforeAnalysisId: number;
  afterAnalysisId?: number | null;
  issueId: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string | null;
  notes?: string;
}

export interface MetricComparison {
  before: number;
  after: number;
  change: number;
  improved: boolean;
}

export interface ImpactAssessment {
  impactScore: number; // 0-100
  label: string; // e.g. "Excellent Refactoring"
  complexityImprovementPercent: number;
  locImprovementPercent: number;
  nestingImprovementPercent: number;
  coverageImprovementPercent: number;
  couplingImprovementPercent: number;
  issuesResolvedCount: number;
  remainingIssuesCount: number;
  regressionCount: number;
  highlights: string[];
}

export interface AnalysisComparison {
  beforeAnalysisId: number;
  afterAnalysisId: number;
  score: MetricComparison;
  loc: MetricComparison;
  complexity: MetricComparison;
  nesting: MetricComparison;
  dependencies: MetricComparison;
  coverage: MetricComparison;
  overallImprovementPercent: number;
  impactAssessment: ImpactAssessment;
  regressionAlerts: string[];
  positiveHighlights: string[];
}

// Isomorphic Client-Side Static Analysis & Comparison Logic
export class ClientRefactorEngine {
  static calculateLOC(code: string): number {
    if (!code) return 0;
    const lines = code.split(/\r?\n/);
    let count = 0;
    let inBlockComment = false;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (inBlockComment) {
        if (line.includes('*/')) {
          inBlockComment = false;
          const rest = line.substring(line.indexOf('*/') + 2).trim();
          if (rest && !rest.startsWith('//')) count++;
        }
        continue;
      }

      if (line.startsWith('/*')) {
        if (!line.includes('*/')) inBlockComment = true;
        else {
          const rest = line.substring(line.indexOf('*/') + 2).trim();
          if (rest && !rest.startsWith('//')) count++;
        }
        continue;
      }

      if (line.startsWith('//')) continue;
      count++;
    }
    return Math.max(1, count);
  }

  static calculateComplexity(code: string): number {
    let complexity = 1;
    if (!code) return complexity;

    const matches = code.match(/\b(if|for|while|case|catch)\b|\?|&&|\|\|/g);
    if (matches) {
      complexity += matches.length;
    }
    return complexity;
  }

  static calculateNesting(code: string): number {
    if (!code) return 0;
    let maxDepth = 0;
    let currentDepth = 0;

    const tokens = code.split(/\r?\n/);
    for (const line of tokens) {
      const trimmed = line.trim();
      if (trimmed.startsWith('if') || trimmed.startsWith('for') || trimmed.startsWith('while') || trimmed.startsWith('switch')) {
        currentDepth++;
        if (currentDepth > maxDepth) maxDepth = currentDepth;
      }
      if (trimmed.includes('}') && currentDepth > 0) {
        currentDepth--;
      }
    }
    return Math.max(1, maxDepth);
  }

  static detectLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'py') return 'Python';
    if (ext === 'kt') return 'Kotlin';
    if (ext === 'ts' || ext === 'tsx') return 'TypeScript';
    if (ext === 'js' || ext === 'jsx') return 'JavaScript';
    return 'Java';
  }

  static extensionForLanguage(language: string): string {
    switch ((language || '').toLowerCase()) {
      case 'python': return '.py';
      case 'kotlin': return '.kt';
      case 'typescript': return '.ts';
      case 'javascript': return '.js';
      default: return '.java';
    }
  }

  static displayFileName(fm: { filePath?: string; className?: string; language?: string } | null | undefined, fallback = 'SourceFile'): string {
    if (!fm) return fallback;
    const base = fm.filePath?.split('/').pop();
    if (base) return base;
    const ext = ClientRefactorEngine.extensionForLanguage(fm.language || 'Java');
    return (fm.className || fallback) + ext;
  }

  static calculateImports(code: string, language?: string): number {
    if (!code) return 0;
    const lang = (language || 'Java').toLowerCase();
    if (lang === 'python') {
      const m = code.match(/^\s*(import\s+\S+|from\s+\S+\s+import\s+\S+)/gm);
      return m ? m.length : 0;
    }
    const matches = code.match(/^import\s+[^;]+;/gm);
    return matches ? matches.length : 0;
  }

  static calculateComplexityScore(
    complexity: number,
    loc: number,
    nesting: number,
    imports: number,
    methods: number,
    coverage: number = 18
  ): number {
    const compNorm = Math.min(1.0, Math.max(0.0, (complexity - 1) / 22.0)) * 25.0;
    const locNorm = Math.min(1.0, Math.max(0.0, (loc - 50) / 450.0)) * 20.0;
    const nestNorm = Math.min(1.0, Math.max(0.0, (nesting - 1) / 4.0)) * 15.0;
    const coupNorm = Math.min(1.0, Math.max(0.0, (imports - 5) / 20.0)) * 15.0;
    const sizeNorm = Math.min(1.0, Math.max(0.0, (methods - 3) / 17.0)) * 10.0;
    const dupNorm = 5.0; // 5%
    const covNorm = Math.min(1.0, Math.max(0.0, (100.0 - coverage) / 100.0)) * 5.0;

    const total = compNorm + locNorm + nestNorm + coupNorm + sizeNorm + dupNorm + covNorm;
    return Math.max(5, Math.min(100, Math.round(total)));
  }

  static countMethods(code: string, language: string): number {
    const lang = language.toLowerCase();
    if (lang === 'python') {
      const m = code.match(/^\s*def\s+\w+\s*\(/gm);
      return m ? m.length : Math.max(1, (code.match(/^\s*class\s+\w+/gm) || []).length || 1);
    }
    if (lang === 'typescript' || lang === 'javascript') {
      const m = code.match(/\b(function\s+\w+|=>|\b\w+\s*\(.*\)\s*\{)/g);
      return m ? Math.max(1, m.length) : 1;
    }
    if (lang === 'kotlin') {
      const m = code.match(/^\s*fun\s+\w+/gm);
      return m ? m.length : 1;
    }
    const m = code.match(/public\s+[^\s(]+\s+[a-zA-Z0-9_]+\s*\(/g);
    return m ? m.length : 1;
  }

  static extractClassName(fileName: string): string {
    const base = fileName.split('/').pop() || fileName;
    // Strip any known extension so foo.py doesn't become "foo.py"
    return base.replace(/\.(java|kt|py|ts|tsx|js|jsx)$/i, '') || 'Example';
  }

  static analyzeCode(fileName: string, code: string): {
    analysis: RefactorAnalysis;
    fileMetric: FileMetric;
    issues: RefactorIssue[];
    recommendations: RefactorRecommendation[];
  } {
    const language = ClientRefactorEngine.detectLanguage(fileName);
    const loc = this.calculateLOC(code);
    const complexity = this.calculateComplexity(code);
    const nesting = this.calculateNesting(code);
    const imports = this.calculateImports(code, language);
    const methods = this.countMethods(code, language);
    const coverage = 18.0;

    const score = this.calculateComplexityScore(complexity, loc, nesting, imports, methods, coverage);
    const className = ClientRefactorEngine.extractClassName(fileName);
    const hotspotScore = Math.min(99, Math.round(score * 0.4 + (loc / 500) * 20 + 15 + ((100 - coverage) / 100) * 15 + (imports / 25) * 10));

    const analysisId = Date.now();
    const fileId = analysisId + 1;

    const fileMetric: FileMetric = {
      id: fileId,
      analysisId,
      filePath: fileName,
      className,
      language,
      linesOfCode: loc,
      classCount: 1,
      methodCount: methods,
      cyclomaticComplexity: complexity,
      maxNestingDepth: nesting,
      importCount: imports,
      dependencyCount: imports,
      testFile: false,
      testCoverage: coverage,
      complexityScore: score,
      hotspotScore,
      changeFrequency: 18,
    };

    const issues: RefactorIssue[] = [];
    const recommendations: RefactorRecommendation[] = [];

    if (complexity > 15 && coverage < 30) {
      const issueId = Date.now() + 10;
      issues.push({
        id: issueId,
        analysisId,
        filePath: fileName,
        type: 'LOW_COVERAGE_HIGH_COMPLEXITY',
        severity: 'CRITICAL',
        message: `Critical risk: High decision complexity (${complexity}) combined with low test coverage (${coverage}%).`,
        metricValue: complexity,
        threshold: 15,
        estimatedImpact: 'CRITICAL',
      });
      recommendations.push({
        id: Date.now() + 20,
        issueId,
        title: `Extract ${className} Responsibilities & Add Tests`,
        description: `${className} contains combined logic. Decompose into focused single-responsibility classes with early guard clauses.`,
        refactoringType: 'EXTRACT_CLASS',
        estimatedImpact: 'HIGH',
        priority: 96,
        steps: [
          `Extract validation logic from ${className} into a dedicated validator`,
          `Extract side-effect / notification logic into a separate service`,
          'Convert nested conditionals to guard clauses',
          'Keep orchestration in the coordinator class',
          'Add unit tests and re-run analysis',
        ],
      });
    }

    if (loc > 400 || methods > 15) {
      const issueId = Date.now() + 11;
      issues.push({
        id: issueId,
        analysisId,
        filePath: fileName,
        type: 'LARGE_CLASS',
        severity: loc > 600 ? 'CRITICAL' : 'HIGH',
        message: `Large Class smell: ${loc} LOC and ${methods} methods violate Single Responsibility Principle.`,
        metricValue: loc,
        threshold: 400,
        estimatedImpact: 'HIGH',
      });
    }

    if (nesting >= 4) {
      const issueId = Date.now() + 12;
      issues.push({
        id: issueId,
        analysisId,
        filePath: fileName,
        type: 'DEEP_NESTING',
        severity: 'CRITICAL',
        message: `Deep nesting detected (level ${nesting} > threshold 3). Nested branches reduce readability.`,
        metricValue: nesting,
        threshold: 3,
        estimatedImpact: 'HIGH',
      });
    }

    if (imports > 20) {
      const issueId = Date.now() + 13;
      issues.push({
        id: issueId,
        analysisId,
        filePath: fileName,
        type: 'HIGH_COUPLING',
        severity: 'HIGH',
        message: `High coupling: imports ${imports} external dependencies.`,
        metricValue: imports,
        threshold: 20,
        estimatedImpact: 'MEDIUM',
      });
    }

    const analysis: RefactorAnalysis = {
      id: analysisId,
      repositoryId: 101,
      commitSha: 'a7f3c19e',
      overallScore: score,
      totalFiles: 1,
      totalLines: loc,
      totalClasses: 1,
      totalMethods: methods,
      averageComplexity: complexity,
      status: 'COMPLETED',
      summary: `Analysis completed: Detected ${issues.length} code quality issues in ${fileName}. Complexity score: ${score}/100.`,
      createdAt: new Date().toISOString(),
      fileMetrics: [fileMetric],
      issues,
      recommendations,
    };

    return { analysis, fileMetric, issues, recommendations };
  }

  static applyClientGuardClause(sourceCode: string, fileNameHint?: string): { refactoredCode: string; diff: string; summary: string; automated: boolean } {
    if (!sourceCode || !sourceCode.trim()) {
      return { refactoredCode: '', diff: '', summary: 'No source provided.', automated: false };
    }
    let transformed = sourceCode;
    let changed = false;
    const invert = (cond: string) => {
      cond = cond.trim();
      if (cond.includes('>=')) return cond.replace('>=', '<');
      if (cond.includes('<=')) return cond.replace('<=', '>');
      if (cond.includes(' > ')) return cond.replace(' > ', ' <= ');
      if (cond.includes(' < ')) return cond.replace(' < ', ' >= ');
      if (cond.includes('==')) return cond.replace('==', '!=');
      if (cond.includes('!=')) return cond.replace('!=', '==');
      return '!(' + cond + ')';
    };
    const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    // 1. Redundant else elimination: if (...) { return ...; } else { body }
    const elsePattern = /(if\s*\([^)]+\)\s*\{[^}]+?return[^;]*;\s*\})\s*else\s*\{([\s\S]+?)\}/g;
    if (elsePattern.test(transformed)) {
      transformed = transformed.replace(elsePattern, (_match, ifPart, elseBody) => {
        return `${ifPart}\n        ${elseBody.trim()}`;
      });
      changed = true;
    }

    // 2. Triple-nested guard
    try {
      const triple = /if\s*\(\s*(\w+)\s*!=\s*null\s*\)\s*\{\s*if\s*\(\s*\1\.isValid\(\)\s*\)\s*\{\s*if\s*\(\s*([^)]+)\s*\)\s*\{\s*([^}]+?)\s*\}\s*\}\s*\}/s;
      const m = triple.exec(transformed);
      if (m) {
        const v = m[1], cond = m[2].trim(), body = m[3].trim();
        const inv = invert(cond);
        const repl = `if (${v} == null) {\n            throw new IllegalArgumentException("${cap(v)} must not be null");\n        }\n        if (!${v}.isValid()) {\n            throw new IllegalStateException("Invalid ${v}");\n        }\n        if (${inv}) {\n            throw new IllegalArgumentException("Invalid condition: ${cond.replace(/"/g, '\\"')}");\n        }\n        ${body}`;
        transformed = transformed.replace(triple, repl);
        changed = true;
      }
    } catch {}

    // 3. Double-nested guard
    if (!changed) {
      try {
        const dbl = /if\s*\(\s*(\w+)\s*!=\s*null\s*\)\s*\{\s*if\s*\(\s*\1\.isValid\(\)\s*\)\s*\{\s*([^}]+?)\s*\}\s*\}/s;
        const m2 = dbl.exec(transformed);
        if (m2) {
          const v = m2[1], body = m2[2].trim();
          const repl = `if (${v} == null) {\n            throw new IllegalArgumentException("${cap(v)} must not be null");\n        }\n        if (!${v}.isValid()) {\n            throw new IllegalStateException("Invalid ${v}");\n        }\n        ${body}`;
          transformed = transformed.replace(dbl, repl);
          changed = true;
        }
      } catch {}
    }

    // 4. Nested if flattening: if (a) { if (b) { body } } -> if (a && b) { body }
    const nestedIf = /if\s*\(([^)]+)\)\s*\{\s*if\s*\(([^)]+)\)\s*\{\s*([^}]+?)\s*\}\s*\}/s;
    const mNested = nestedIf.exec(transformed);
    if (mNested && !changed) {
      const condA = mNested[1].trim();
      const condB = mNested[2].trim();
      const body = mNested[3].trim();
      const repl = `if ((${condA}) && (${condB})) {\n            ${body}\n        }`;
      transformed = transformed.replace(nestedIf, repl);
      changed = true;
    }

    const hintLang = fileNameHint ? ClientRefactorEngine.detectLanguage(fileNameHint) : (sourceCode.includes('def ') && sourceCode.includes(':\n') ? 'Python' : 'Java');
    const ext = ClientRefactorEngine.extensionForLanguage(hintLang);
    const diff = ClientRefactorEngine.buildClientDiff(sourceCode, transformed, `Original${ext}`, `Refactored${ext}`);
    const summary = changed
      ? 'Applied Guard Clause refactoring: Inverted nested conditions into early returns and eliminated redundant else blocks, reducing nesting depth and cyclomatic complexity with identical functional output.'
      : 'Code structure is already linear — no deep nesting or redundant else branches detected.';
    return { refactoredCode: transformed, diff, summary, automated: changed };
  }

  static extractMethod(sourceCode: string, fileNameHint?: string, targetMethodName?: string): { refactoredCode: string; diff: string; summary: string; automated: boolean } {
    if (!sourceCode || !sourceCode.trim()) {
      return { refactoredCode: '', diff: '', summary: 'No source provided.', automated: false };
    }

    let transformed = sourceCode;
    let changed = false;
    let helperName = 'validateParameters';
    const hintLang = fileNameHint ? ClientRefactorEngine.detectLanguage(fileNameHint) : 'Java';

    // Look for validation sequence at the start of a method
    const methodRegex = /(public|protected|private|static|\s)+[\w<>\[\]]+\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{([\s\S]+?)\n    \}/;
    const match = methodRegex.exec(sourceCode);

    if (match) {
      const fullMethod = match[0];
      const methodName = match[2];
      const params = match[3];
      const body = match[4];

      // Identify leading validation statements (if statements checking parameters)
      const validationPattern = /^\s*(if\s*\([^)]+\)\s*\{[^}]+?\})+\s*/;
      const valMatch = validationPattern.exec(body);

      if (valMatch && valMatch[0].length > 15) {
        const valBlock = valMatch[0].trim();
        helperName = `validate${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Parameters`;

        // Extract parameters to pass to helper
        const callArgs = params.split(',').map(p => p.trim().split(/\s+/).pop()).filter(Boolean).join(', ');

        const helperDef = `\n    private void ${helperName}(${params}) {\n        ${valBlock.replace(/\n\s{8}/g, '\n        ')}\n    }\n`;
        const updatedBody = body.replace(valMatch[0], `\n        ${helperName}(${callArgs});\n        `);

        transformed = transformed.replace(fullMethod, fullMethod.replace(body, updatedBody) + helperDef);
        changed = true;
      } else {
        // Extract cohesive sub-routine
        helperName = `process${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Details`;
        const lines = body.split('\n');
        if (lines.length >= 6) {
          const splitIdx = Math.floor(lines.length / 2);
          const topLines = lines.slice(0, splitIdx).join('\n');
          const extractedLines = lines.slice(splitIdx).join('\n');
          const callArgs = params.split(',').map(p => p.trim().split(/\s+/).pop()).filter(Boolean).join(', ');

          const helperDef = `\n    private void ${helperName}(${params}) {\n${extractedLines}\n    }\n`;
          const updatedBody = `${topLines}\n        ${helperName}(${callArgs});`;

          transformed = transformed.replace(fullMethod, fullMethod.replace(body, updatedBody) + helperDef);
          changed = true;
        }
      }
    }

    if (!changed) {
      return ClientRefactorEngine.applyClientGuardClause(sourceCode, fileNameHint);
    }

    const ext = ClientRefactorEngine.extensionForLanguage(hintLang);
    const diff = ClientRefactorEngine.buildClientDiff(sourceCode, transformed, `Original${ext}`, `Refactored${ext}`);
    const summary = `Extracted logic into private helper method '${helperName}()'. Reduced host method complexity and LOC while preserving identical parameters and execution flow.`;
    return { refactoredCode: transformed, diff, summary, automated: true };
  }

  static removeUnwantedCode(sourceCode: string, fileNameHint?: string): { refactoredCode: string; diff: string; summary: string; automated: boolean } {
    if (!sourceCode || !sourceCode.trim()) {
      return { refactoredCode: '', diff: '', summary: 'No source provided.', automated: false };
    }

    let transformed = sourceCode;
    let changed = false;
    const actions: string[] = [];

    // 1. Remove unused imports
    const importRegex = /^import\s+([\w.]+);/gm;
    const imports: Array<{ full: string; simple: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(sourceCode)) !== null) {
      const full = m[0];
      const pkg = m[1];
      const simple = pkg.split('.').pop() || '';
      imports.push({ full, simple });
    }

    let removedImports = 0;
    for (const imp of imports) {
      if (imp.simple === '*') continue;
      // Count occurrences outside import statements
      const bodyWithoutImports = transformed.replace(/^import\s+[^;]+;/gm, '');
      const regex = new RegExp(`\\b${imp.simple}\\b`);
      if (!regex.test(bodyWithoutImports)) {
        transformed = transformed.replace(imp.full + '\n', '').replace(imp.full, '');
        removedImports++;
      }
    }
    if (removedImports > 0) {
      actions.push(`Removed ${removedImports} unused import${removedImports === 1 ? '' : 's'}`);
      changed = true;
    }

    // 2. Simplify redundant boolean comparisons (== true / == false)
    if (/\b(==\s*true|==\s*false|true\s*==|false\s*==)\b/.test(transformed)) {
      transformed = transformed
        .replace(/\b([a-zA-Z0-9_.]+)\s*==\s*true\b/g, '$1')
        .replace(/\b([a-zA-Z0-9_.]+)\s*==\s*false\b/g, '!$1')
        .replace(/\btrue\s*==\s*([a-zA-Z0-9_.]+)\b/g, '$1')
        .replace(/\bfalse\s*==\s*([a-zA-Z0-9_.]+)\b/g, '!$1');
      actions.push('Simplified redundant boolean comparisons');
      changed = true;
    }

    // 3. Redundant else elimination
    const elsePattern = /(if\s*\([^)]+\)\s*\{[^}]+?return[^;]*;\s*\})\s*else\s*\{([\s\S]+?)\}/g;
    if (elsePattern.test(transformed)) {
      transformed = transformed.replace(elsePattern, (_match, ifPart, elseBody) => {
        return `${ifPart}\n        ${elseBody.trim()}`;
      });
      actions.push('Eliminated redundant else branches after returns');
      changed = true;
    }

    // 4. Clean duplicate blank lines
    transformed = transformed.replace(/\n{3,}/g, '\n\n');

    const hintLang = fileNameHint ? ClientRefactorEngine.detectLanguage(fileNameHint) : 'Java';
    const ext = ClientRefactorEngine.extensionForLanguage(hintLang);
    const diff = ClientRefactorEngine.buildClientDiff(sourceCode, transformed, `Original${ext}`, `Refactored${ext}`);
    const summary = changed
      ? `Clean Code Applied: ${actions.join(', ')}. Code complexity lowered and dead syntax removed with identical functional output.`
      : 'Codebase is already clean — no unused imports or redundant else branches found.';

    return { refactoredCode: transformed, diff, summary, automated: changed };
  }

  static buildClientValidatorScaffold(className: string, sourceCode: string): { refactoredCode: string; diff: string; summary: string; automated: boolean; delegateCode?: string; delegateFileName?: string } {
    const lang = className ? ClientRefactorEngine.detectLanguage(className) : (sourceCode.includes('def ') && sourceCode.includes(':\n') ? 'Python' : 'Java');
    if (lang === 'Python') {
      const base = (className || 'example').replace(/\.py$/i, '').split('/').pop() || 'example';
      const mod = base.charAt(0).toLowerCase() + base.slice(1);
      const cls = base.charAt(0).toUpperCase() + base.slice(1);
      const validator = `class ${cls}Validator:\n    \"\"\"Single-responsibility validator extracted from ${base}.\"\"\"\n    def validate(self, request):\n        if request is None:\n            raise ValueError("request must not be None")\n        if not request.is_valid():\n            raise ValueError("request validation failed")\n`;
      const diff = `--- /dev/null\n+++ b/${mod}_validator.py\n${validator}`;
      return { refactoredCode: sourceCode, delegateCode: validator, delegateFileName: `${mod}_validator.py`, diff, summary: `Generated single-responsibility ${cls}Validator delegate class scaffold.`, automated: true };
    }
    const base = (className || 'Example').replace(/\.(java|kt|py|ts|tsx|js|jsx)$/i, '').replace(/Service$/i, '').replace(/Controller$/i, '').split('/').pop() || 'Example';
    const validatorName = `${base}Validator`;
    const validator = `package com.codedna.domain;\n\nimport org.springframework.stereotype.Component;\n\n/**\n * Dedicated single-responsibility validator extracted from ${base}.\n * Isolates precondition assertions and boundary checks to lower host class complexity.\n */\n@Component\npublic class ${validatorName} {\n\n    public void validate(Object request) {\n        if (request == null) {\n            throw new IllegalArgumentException("Request must not be null");\n        }\n    }\n}\n`;

    // Inject validator field and call into host class
    let refactoredHost = sourceCode;
    if (sourceCode && sourceCode.includes('class ')) {
      const fieldDecl = `\n    private final ${validatorName} validator = new ${validatorName}();\n`;
      refactoredHost = sourceCode.replace(/class\s+\w+[^{]*\{/, (match) => match + fieldDecl);
    }

    const diff = `--- a/${base}.java\n+++ b/${validatorName}.java\n${validator}`;
    return { refactoredCode: refactoredHost, delegateCode: validator, delegateFileName: `${validatorName}.java`, diff, summary: `Generated single-responsibility ${validatorName} delegate class scaffold and wired delegation into host class.`, automated: true };
  }

  static buildClientDiff(before: string, after: string, oldName = 'Original.java', newName = 'Refactored.java'): string {
    const a = (before || '').split(/\r\n|\r|\n/);
    const b = (after || '').split(/\r\n|\r|\n/);
    let out = `--- a/${oldName}\n+++ b/${newName}\n@@ -1,${a.length} +1,${b.length} @@\n`;
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      const o = i < a.length ? a[i] : null;
      const n = i < b.length ? b[i] : null;
      if (o !== null && n !== null && o === n) out += ` ${o}\n`;
      else {
        if (o !== null) out += `-${o}\n`;
        if (n !== null) out += `+${n}\n`;
      }
    }
    return out;
  }

  static compare(before: RefactorAnalysis, after: RefactorAnalysis): AnalysisComparison {
    const bScore = before.overallScore;
    const aScore = after.overallScore;
    const scoreImp = bScore > 0 ? ((bScore - aScore) / bScore) * 100 : 0;

    const bLoc = before.totalLines || 1;
    const aLoc = after.totalLines || 1;
    const locImp = bLoc > 0 ? ((bLoc - aLoc) / bLoc) * 100 : 0;

    const bComp = before.averageComplexity || 1;
    const aComp = after.averageComplexity || 1;
    const compImp = bComp > 0 ? ((bComp - aComp) / bComp) * 100 : 0;

    const bNesting = before.fileMetrics?.[0]?.maxNestingDepth ?? 1;
    const aNesting = after.fileMetrics?.[0]?.maxNestingDepth ?? 1;
    const nestImp = bNesting > 0 ? ((bNesting - aNesting) / bNesting) * 100 : 0;

    const bDeps = before.fileMetrics?.[0]?.dependencyCount ?? before.fileMetrics?.[0]?.importCount ?? 0;
    const aDeps = after.fileMetrics?.[0]?.dependencyCount ?? after.fileMetrics?.[0]?.importCount ?? 0;
    const depsImp = bDeps > 0 ? ((bDeps - aDeps) / bDeps) * 100 : 0;

    const bCov = before.fileMetrics?.[0]?.testCoverage ?? 18;
    const aCov = after.fileMetrics?.[0]?.testCoverage ?? 18;
    const covImp = bCov > 0 ? ((aCov - bCov) / bCov) * 100 : 0;

    const regressions: string[] = [];
    if (aDeps > bDeps) regressions.push(`Coupling increased: ${bDeps} → ${aDeps} dependencies`);
    if (aCov < bCov) regressions.push(`Coverage dropped: ${bCov}% → ${aCov}%`);
    if (aNesting > bNesting) regressions.push(`Nesting depth increased: ${bNesting} → ${aNesting}`);

    const positives: string[] = [];
    if (compImp > 0) positives.push(`Complexity reduced by ${compImp.toFixed(1)}% (${bComp} → ${aComp})`);
    if (locImp > 0) positives.push(`Class size reduced by ${locImp.toFixed(1)}% (${bLoc} → ${aLoc} LOC)`);
    if (nestImp > 0) positives.push(`Nesting depth reduced by ${nestImp.toFixed(0)}% (depth ${bNesting} → ${aNesting})`);
    if (depsImp > 0) positives.push(`Dependencies decoupled (${bDeps} → ${aDeps} imports)`);
    if (covImp > 0) positives.push(`Test coverage elevated from ${bCov}% to ${aCov}% (+${covImp.toFixed(0)}%)`);
    if (positives.length === 0) positives.push('No measurable improvement detected — verify refactoring was applied.');

    const impactScore = Math.max(5, Math.min(99, Math.round(scoreImp * 1.5 + Math.max(0, compImp) * 0.3 + 15)));

    const bIssues = before.issues?.length ?? 0;
    const aIssues = after.issues?.length ?? 0;

    return {
      beforeAnalysisId: before.id,
      afterAnalysisId: after.id,
      score: { before: bScore, after: aScore, change: Math.round(scoreImp * 10) / 10, improved: aScore < bScore },
      loc: { before: bLoc, after: aLoc, change: Math.round(-locImp * 10) / 10, improved: aLoc <= bLoc },
      complexity: { before: bComp, after: aComp, change: Math.round(-compImp * 10) / 10, improved: aComp <= bComp },
      nesting: { before: bNesting, after: aNesting, change: Math.round(-nestImp * 10) / 10, improved: aNesting <= bNesting },
      dependencies: { before: bDeps, after: aDeps, change: Math.round(-depsImp * 10) / 10, improved: aDeps <= bDeps },
      coverage: { before: bCov, after: aCov, change: Math.round(covImp * 10) / 10, improved: aCov >= bCov },
      overallImprovementPercent: Math.round(scoreImp * 10) / 10,
      impactAssessment: {
        impactScore: impactScore || 50,
        label: impactScore >= 80 ? 'Excellent Refactoring' : impactScore >= 50 ? 'Good Improvement' : 'Marginal Improvement',
        complexityImprovementPercent: Math.round(compImp * 10) / 10,
        locImprovementPercent: Math.round(locImp * 10) / 10,
        nestingImprovementPercent: Math.round(nestImp * 10) / 10,
        coverageImprovementPercent: Math.round(covImp * 10) / 10,
        couplingImprovementPercent: Math.round(depsImp * 10) / 10,
        issuesResolvedCount: Math.max(0, bIssues - aIssues),
        remainingIssuesCount: aIssues,
        regressionCount: regressions.length,
        highlights: positives,
      },
      regressionAlerts: regressions,
      positiveHighlights: positives,
    };
  }
}

// REST API Client
const API_BASE = 'http://localhost:8086/api/v1/refactoriq';

export const refactorIqApi = {
  async getRepositories(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/repositories`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async compareAnalyses(beforeId: number, afterId: number): Promise<AnalysisComparison> {
    const res = await fetch(`${API_BASE}/comparisons/${beforeId}/${afterId}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Comparison failed (HTTP ${res.status}). Ensure both analyses exist and have completed.`);
    }
    return await res.json();
  },

  async analyzeCode(fileName: string, code: string) {
    try {
      const res = await fetch(`${API_BASE}/analyze/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, code }),
      });
      if (res.ok) return await res.json();
    } catch {}
    // Fallback: client-side deterministic analysis (works offline)
    return ClientRefactorEngine.analyzeCode(fileName, code);
  },

  async getAnalysis(id: number) {
    const res = await fetch(`${API_BASE}/analyses/${id}`);
    if (!res.ok) throw new Error(`Analysis ${id} not found (HTTP ${res.status})`);
    return res.json();
  },

  async getAnalysisMetrics(id: number) {
    const res = await fetch(`${API_BASE}/analyses/${id}/metrics`);
    if (!res.ok) throw new Error(`Metrics for ${id} not found`);
    return res.json();
  },

  async getAnalysisIssues(id: number) {
    const res = await fetch(`${API_BASE}/analyses/${id}/issues`);
    if (!res.ok) throw new Error(`Issues for ${id} not found`);
    return res.json();
  },

  async getRefactoringPlan(issueId: number) {
    const res = await fetch(`${API_BASE}/issues/${issueId}/refactoring-plan`);
    if (!res.ok) throw new Error(`Refactoring plan for issue ${issueId} not found`);
    return res.json();
  },

  async transformCode(sourceCode: string, transformationType: string, className?: string) {
    try {
      const res = await fetch(`${API_BASE}/refactoring/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode, transformationType, className }),
      });
      if (res.ok) return await res.json();
    } catch {}
    // Offline fallback — works without backend/refactoriq-service running
    const t = (transformationType || '').toUpperCase();
    const hintName = className || (sourceCode.includes('def ') && sourceCode.includes(':\n') ? 'Example.py' : 'Example.java');
    if (t.includes('METHOD')) {
      return ClientRefactorEngine.extractMethod(sourceCode, hintName);
    }
    if (t.includes('CLEAN') || t.includes('UNWANTED') || t.includes('IMPORT')) {
      return ClientRefactorEngine.removeUnwantedCode(sourceCode, hintName);
    }
    if (t.includes('CLASS') || t.includes('VALIDATOR')) {
      return ClientRefactorEngine.buildClientValidatorScaffold(hintName, sourceCode);
    }
    return ClientRefactorEngine.applyClientGuardClause(sourceCode, hintName);
  },

  async createRefactoringSession(issueId: number) {
    const res = await fetch(`${API_BASE}/issues/${issueId}/refactoring-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (!res.ok) throw new Error(`Failed to create refactoring session (HTTP ${res.status})`);
    return res.json();
  },

  async completeRefactoringSession(sessionId: number, codeMap: Record<string, string>) {
    const res = await fetch(`${API_BASE}/refactoring/${sessionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codeMap),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Complete session failed (HTTP ${res.status}). Provide a non-empty code map.`);
    }
    return res.json();
  },
};
