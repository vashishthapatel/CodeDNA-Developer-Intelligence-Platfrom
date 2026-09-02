import { getToken } from './github';
import { ClientRefactorEngine, RefactorAnalysis, FileMetric, RefactorIssue, RefactorRecommendation } from './refactoriq';

export interface LiveRepoProgress {
  status: 'IDLE' | 'FETCHING_TREE' | 'DOWNLOADING_FILES' | 'ANALYZING_AST' | 'COMPLETED' | 'ERROR';
  message: string;
  progressPercent: number;
  totalFilesFound: number;
  analyzedFilesCount: number;
  currentFileName?: string;
}

export async function analyzeLiveGitHubRepo(
  repoFullName: string,
  customToken?: string,
  onProgress?: (p: LiveRepoProgress) => void
): Promise<{
  analysis: RefactorAnalysis;
  fileMetrics: FileMetric[];
  issues: RefactorIssue[];
  recommendations: RefactorRecommendation[];
  fileContents: Record<string, string>;
}> {
  const token = customToken || getToken() || '';
  const cleanRepo = repoFullName
    .replace('https://github.com/', '')
    .replace('.git', '')
    .trim();

  const [owner, repoName] = cleanRepo.split('/');
  if (!owner || !repoName) {
    throw new Error('Please enter a valid GitHub repository in "owner/repo" format (e.g. vashishthapatel/DSA-JAVA)');
  }

  onProgress?.({
    status: 'FETCHING_TREE',
    message: `Connecting to GitHub API for ${owner}/${repoName}...`,
    progressPercent: 15,
    totalFilesFound: 0,
    analyzedFilesCount: 0,
  });

  // 1. Fetch Repository Info & Default Branch
  let defaultBranch = 'main';
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!repoInfoRes.ok) {
      if (repoInfoRes.status === 404) {
        throw new Error(`Repository "${cleanRepo}" not found. If this is a private repository, connect with GitHub via OAuth first.`);
      } else if (repoInfoRes.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please provide a GitHub token to proceed.');
      }
      throw new Error(`GitHub API error: HTTP ${repoInfoRes.status}`);
    }
    const repoInfo = await repoInfoRes.json();
    defaultBranch = repoInfo.default_branch || 'main';
  } catch (err: any) {
    if (err.message) throw err;
  }

  // 2. Fetch Git Tree recursively
  onProgress?.({
    status: 'FETCHING_TREE',
    message: `Fetching file tree for branch '${defaultBranch}'...`,
    progressPercent: 30,
    totalFilesFound: 0,
    analyzedFilesCount: 0,
  });

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/trees/${defaultBranch}?recursive=1`,
    { headers }
  );

  if (!treeRes.ok) {
    throw new Error(`Failed to load repository tree: HTTP ${treeRes.status}`);
  }

  const treeData = await treeRes.json();
  const treeList: any[] = treeData.tree || [];

  // Filter Java or source code files
  const javaFiles = treeList.filter(
    (item: any) =>
      item.type === 'blob' &&
      (item.path.endsWith('.java') ||
        item.path.endsWith('.kt') ||
        item.path.endsWith('.ts') ||
        item.path.endsWith('.js') ||
        item.path.endsWith('.py')) &&
      !item.path.includes('.git') &&
      !item.path.includes('node_modules') &&
      !item.path.includes('target/') &&
      !item.path.includes('build/')
  );

  if (javaFiles.length === 0) {
    throw new Error(`No Java or source code files found in ${cleanRepo}.`);
  }

  // Limit to max 25 files for fast, responsive interactive analysis
  const targetFiles = javaFiles.slice(0, 25);

  onProgress?.({
    status: 'DOWNLOADING_FILES',
    message: `Found ${javaFiles.length} source files. Downloading top ${targetFiles.length} files...`,
    progressPercent: 45,
    totalFilesFound: javaFiles.length,
    analyzedFilesCount: 0,
  });

  const allFileMetrics: FileMetric[] = [];
  const allIssues: RefactorIssue[] = [];
  const allRecommendations: RefactorRecommendation[] = [];
  const fileContents: Record<string, string> = {};
  let totalLines = 0;
  let totalComplexitySum = 0;
  let weightedScoreSum = 0;
  const analysisId = Date.now();

  // 3. Download and Analyze each file
  for (let i = 0; i < targetFiles.length; i++) {
    const fileItem = targetFiles[i];
    const fileName = fileItem.path.split('/').pop() || fileItem.path;

    onProgress?.({
      status: 'ANALYZING_AST',
      message: `Analyzing AST & decision trees: ${fileName} (${i + 1}/${targetFiles.length})...`,
      progressPercent: 50 + Math.round(((i + 1) / targetFiles.length) * 45),
      totalFilesFound: javaFiles.length,
      analyzedFilesCount: i + 1,
      currentFileName: fileName,
    });

    try {
      let content = '';
      if (fileItem.url) {
        const blobRes = await fetch(fileItem.url, { headers });
        if (blobRes.ok) {
          const blobData = await blobRes.json();
          if (blobData.encoding === 'base64' && blobData.content) {
            content = decodeURIComponent(escape(atob(blobData.content.replace(/\s/g, ''))));
          }
        }
      }

      if (!content) {
        // Fallback to raw githubusercontent
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/${defaultBranch}/${fileItem.path}`
        );
        if (rawRes.ok) {
          content = await rawRes.text();
        }
      }

      if (content) {
        fileContents[fileItem.path] = content;
        const fileResult = ClientRefactorEngine.analyzeCode(fileItem.path, content);
        const fm = fileResult.fileMetric;
        fm.id = analysisId + i + 1;
        fm.analysisId = analysisId;

        // Reparent issues to this live analysis and give them stable unique ids
        fileResult.issues.forEach((iss, k) => {
          iss.analysisId = analysisId;
          iss.id = analysisId + (i + 1) * 10 + k + 1;
        });
        fileResult.recommendations.forEach((rec, k) => {
          const linkedIssue = fileResult.issues[k] ?? fileResult.issues[0];
          if (linkedIssue) rec.issueId = linkedIssue.id;
          rec.id = analysisId + (i + 1) * 100 + k + 1;
        });

        allFileMetrics.push(fm);
        allIssues.push(...fileResult.issues);
        allRecommendations.push(...fileResult.recommendations);

        totalLines += fm.linesOfCode;
        totalComplexitySum += fm.cyclomaticComplexity;
        weightedScoreSum += fm.complexityScore * Math.max(10, fm.linesOfCode);

        // Try sending to backend if available
        try {
          fetch('http://localhost:8086/api/v1/refactoriq/analyze/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: fileItem.path, code: content }),
          }).catch(() => {});
        } catch {}
      }
    } catch (fileErr) {
      console.warn(`Could not parse ${fileItem.path}`, fileErr);
    }
  }

  // Sort file metrics by Hotspot score descending
  allFileMetrics.sort((a, b) => b.hotspotScore - a.hotspotScore);

  const avgScore = totalLines > 0 ? weightedScoreSum / totalLines : 40;
  const overallScore = Math.max(5, Math.min(100, Math.round(avgScore)));
  const avgComplexity =
    allFileMetrics.length > 0
      ? Math.round((totalComplexitySum / allFileMetrics.length) * 10) / 10
      : 5;

  const analysis: RefactorAnalysis = {
    id: analysisId,
    repositoryId: Date.now() % 10000,
    commitSha: defaultBranch,
    overallScore,
    totalFiles: allFileMetrics.length,
    totalLines,
    totalClasses: allFileMetrics.length,
    totalMethods: allFileMetrics.reduce((sum, f) => sum + f.methodCount, 0),
    averageComplexity: avgComplexity,
    status: 'COMPLETED',
    summary: `Live analysis completed for ${cleanRepo} (${allFileMetrics.length} files, ${totalLines} LOC). Detected ${allIssues.length} code issues. Overall score: ${overallScore}/100.`,
    createdAt: new Date().toISOString(),
    fileMetrics: allFileMetrics,
    issues: allIssues,
    recommendations: allRecommendations,
  };

  onProgress?.({
    status: 'COMPLETED',
    message: `Analysis complete! Evaluated ${allFileMetrics.length} files across ${cleanRepo}.`,
    progressPercent: 100,
    totalFilesFound: javaFiles.length,
    analyzedFilesCount: allFileMetrics.length,
  });

  return {
    analysis,
    fileMetrics: allFileMetrics,
    issues: allIssues,
    recommendations: allRecommendations,
    fileContents,
  };
}
