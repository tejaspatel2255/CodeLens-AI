import React, { useState } from 'react';
import { FolderArchive, GitBranch, Upload, X, Check, Loader2, FileCode, Layers, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';


export default function ProjectScannerModal({ isOpen, onClose, onImportCode }) {
  const [activeTab, setActiveTab] = useState('zip'); // 'zip' | 'github'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [scannedFiles, setScannedFiles] = useState([]);
  const [projectSummary, setProjectSummary] = useState(null);

  if (!isOpen) return null;

  // Process uploaded .zip archive using JSZip
  const handleZipUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setScannedFiles([]);
    setProjectSummary(null);

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      const filesList = [];
      let combinedCode = `// ===== MULTI-FILE PROJECT SCAN: ${file.name} =====\n\n`;

      const validExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.html', '.css', '.json'];

      const MAX_TOTAL_CHARS = 18000;
      let totalChars = 0;

      for (const relativePath of Object.keys(contents.files)) {
        const zipObj = contents.files[relativePath];
        if (zipObj.dir) continue;
        if (relativePath.includes('node_modules/') || relativePath.includes('.git/') || relativePath.includes('dist/')) continue;

        const ext = relativePath.substring(relativePath.lastIndexOf('.')).toLowerCase();
        if (validExts.includes(ext)) {
          let text = await zipObj.async('text');
          
          // Truncate individual file if project total is getting large
          if (totalChars + text.length > MAX_TOTAL_CHARS) {
            const allowed = Math.max(500, MAX_TOTAL_CHARS - totalChars);
            text = text.substring(0, allowed) + `\n// ... [File truncated for optimal AI trace speed] ...`;
          }

          totalChars += text.length;

          filesList.push({
            path: relativePath,
            size: text.length,
            extension: ext,
            content: text
          });

          combinedCode += `// --------------------------------------------------\n`;
          combinedCode += `// FILE: ${relativePath}\n`;
          combinedCode += `// --------------------------------------------------\n`;
          combinedCode += `${text}\n\n`;

          if (totalChars >= MAX_TOTAL_CHARS) break;
        }
      }

      if (filesList.length === 0) {
        throw new Error("No readable source code files (.js, .py, .java, .cpp, etc.) found in .zip");
      }

      setScannedFiles(filesList);
      setProjectSummary({
        projectName: file.name.replace(/\.zip$/i, ''),
        fileCount: filesList.length,
        combinedCode
      });

    } catch (err) {
      setError(err.message || "Failed to parse zip archive");
    } finally {
      setLoading(false);
    }
  };

  // Fetch public GitHub repository / folder files via GitHub API
  const handleGithubFetch = async () => {
    if (!githubUrl.trim()) return;

    // Parse owner and repo from URL (e.g., https://github.com/owner/repo or owner/repo)
    let clean = githubUrl.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const parts = clean.split('/');
    if (parts.length < 2) {
      setError("Invalid GitHub repository format. Use: owner/repository or full URL");
      return;
    }

    const [owner, repo] = parts;
    setLoading(true);
    setError('');
    setScannedFiles([]);
    setProjectSummary(null);

    try {
      // Request tree via GitHub REST API (recursive)
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`);
      let data = await res.json();

      if (!res.ok) {
        // Fallback to 'master' branch if 'main' fails
        const fallbackRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
        data = await fallbackRes.json();
        if (!fallbackRes.ok) {
          throw new Error(data.message || "Repository not found or rate limited");
        }
      }

      const validExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c'];
      const codeTreeItems = (data.tree || []).filter(item => 
        item.type === 'blob' && 
        !item.path.includes('node_modules/') && 
        !item.path.includes('.git/') &&
        validExts.some(ext => item.path.endsWith(ext))
      ).slice(0, 8); // Top 8 core source files to stay performant

      if (codeTreeItems.length === 0) {
        throw new Error("No standard source files (.js, .py, .java, .cpp) found in repo root");
      }

      // Fetch raw file contents
      const fetchedFiles = [];
      let combinedCode = `// ===== MULTI-FILE GITHUB SCAN: ${owner}/${repo} =====\n\n`;

      for (const item of codeTreeItems) {
        const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${item.path}`);
        let text = "";
        if (rawRes.ok) {
          text = await rawRes.text();
        } else {
          const mainRawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${item.path}`);
          if (mainRawRes.ok) text = await mainRawRes.text();
        }

        if (text) {
          fetchedFiles.push({
            path: item.path,
            size: text.length,
            content: text
          });

          combinedCode += `// --------------------------------------------------\n`;
          combinedCode += `// FILE: ${item.path}\n`;
          combinedCode += `// --------------------------------------------------\n`;
          combinedCode += `${text}\n\n`;
        }
      }

      setScannedFiles(fetchedFiles);
      setProjectSummary({
        projectName: `${owner}/${repo}`,
        fileCount: fetchedFiles.length,
        combinedCode
      });

    } catch (err) {
      setError(err.message || "Failed to fetch GitHub repository");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (projectSummary && projectSummary.combinedCode) {
      onImportCode(projectSummary.combinedCode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-xl rounded-2xl border border-border/80 bg-surface/95 shadow-2xl p-6 relative space-y-6 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accentCyan/10 border border-accentCyan/30 text-accentCyan">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-extrabold uppercase tracking-wider text-textMain">
                Multi-File Project Import
              </h3>
              <p className="text-xs text-mutedMain font-medium">
                Scan .zip archives or public GitHub repositories into a unified execution stack
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border/40 text-mutedMain hover:text-textMain hover:bg-surface2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher (.ZIP vs GitHub) */}
        <div className="flex border-b border-border/60 bg-surface2/30 rounded-xl p-1 gap-1">
          <button
            onClick={() => { setActiveTab('zip'); setError(''); }}
            className={`flex-1 py-2.5 px-4 rounded-lg font-heading text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'zip'
                ? 'bg-accentCyan/15 border border-accentCyan/30 text-accentCyan shadow-[0_0_12px_rgba(0,245,196,0.1)]'
                : 'text-mutedMain hover:text-textMain'
            }`}
          >
            <FolderArchive className="h-4 w-4" />
            <span>Upload .ZIP Archive</span>
          </button>
          <button
            onClick={() => { setActiveTab('github'); setError(''); }}
            className={`flex-1 py-2.5 px-4 rounded-lg font-heading text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'github'
                ? 'bg-accentPurple/15 border border-accentPurple/30 text-accentPurple shadow-[0_0_12px_rgba(124,109,250,0.1)]'
                : 'text-mutedMain hover:text-textMain'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            <span>Import GitHub Repo</span>
          </button>

        </div>

        {/* Tab 1: ZIP Upload Input */}
        {activeTab === 'zip' && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-accentCyan/50 rounded-2xl p-8 bg-surface2/20 hover:bg-surface2/40 transition-all cursor-pointer group">
              <Upload className="h-10 w-10 text-mutedMain group-hover:text-accentCyan group-hover:scale-110 transition-all mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-textMain">Choose .zip file from your computer</span>
              <span className="text-[10px] text-mutedMain pt-1">Extracts JS, TS, Python, Java, C++ source files automatically</span>
              <input type="file" accept=".zip" onChange={handleZipUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* Tab 2: GitHub URL Fetch Input */}
        {activeTab === 'github' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-mutedMain">Public GitHub Repo URL or Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. facebook/react or https://github.com/owner/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="flex-1 bg-surface2/50 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-textMain focus:outline-none focus:border-accentPurple"
                />
                <button
                  onClick={handleGithubFetch}
                  disabled={loading || !githubUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-accentPurple text-background font-heading text-xs font-extrabold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Scan Repo</span>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Loading Spinner Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-6 text-accentCyan gap-2 text-xs font-bold font-mono">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Extracting multi-file import tree...</span>
          </div>
        )}

        {/* Scanned Files List Preview */}
        {projectSummary && !loading && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4 animate-fade-in">
            <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
              <span className="font-bold text-accentCyan uppercase tracking-wider flex items-center gap-1.5">
                <Check className="h-4 w-4 text-accentCyan" /> {projectSummary.projectName}
              </span>
              <span className="text-[10px] font-mono bg-accentCyan/10 text-accentCyan px-2 py-0.5 rounded font-bold">
                {projectSummary.fileCount} Source Files Scanned
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {scannedFiles.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] font-code py-1 px-2.5 rounded bg-surface2/40 border border-border/30">
                  <span className="text-textMain/90 flex items-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5 text-accentPurple" /> {f.path}
                  </span>
                  <span className="text-mutedMain text-[9px]">{f.size} bytes</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmImport}
              className="w-full py-3 rounded-xl bg-accentCyan text-background font-heading text-xs font-extrabold uppercase tracking-widest shadow-[0_0_20px_rgba(0,245,196,0.25)] hover:shadow-[0_0_30px_rgba(0,245,196,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Load Combined Multi-File Trace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
