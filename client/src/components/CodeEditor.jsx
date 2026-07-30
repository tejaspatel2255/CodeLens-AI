import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Clipboard, Copy, Trash2, Check, Sparkles, Terminal, RefreshCw, FolderArchive, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ProjectScannerModal from './ProjectScannerModal';

const LANGUAGE_PILLS = [

  { name: 'C', ext: 'c', color: 'text-red-500 bg-red-500/15 border-red-500/30' },
  { name: 'C++', ext: 'cpp', color: 'text-rose-400 bg-rose-400/15 border-rose-400/30' },
  { name: 'Java', ext: 'java', color: 'text-orange-400 bg-orange-400/15 border-orange-400/30' },
  { name: 'Python', ext: 'py', color: 'text-yellow-400 bg-yellow-400/15 border-yellow-400/30' },
  { name: 'JavaScript', ext: 'js', color: 'text-green-400 bg-green-400/15 border-green-400/30' }
];

export default function CodeEditor({ onAnalyze, loading, activeLine }) {
  const { currentAnalysis, setCurrentAnalysis, user, getApiUrl } = useApp();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [detectedLang, setDetectedLang] = useState('');
  const [manualLang, setManualLang] = useState('');
  const [converting, setConverting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const textareaRef = useRef(null);


  const handleConvertCode = async (targetLang) => {
    if (!code.trim()) return;
    setConverting(true);
    showToast(`Converting code to ${targetLang}...`);
    try {
      const res = await fetch(`${getApiUrl()}/api/generate/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          sourceLanguage: activeLang,
          targetLanguage: targetLang
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert');
      
      setCode(data.convertedCode);
      setManualLang(targetLang);
      showToast(`Successfully converted to ${targetLang}!`);
    } catch (err) {
      showToast(err.message || 'Conversion error');
    } finally {
      setConverting(false);
    }
  };


  // Auto-reload code when a history item is selected for re-use
  useEffect(() => {
    if (currentAnalysis && currentAnalysis.original_code) {
      setCode(currentAnalysis.original_code);
    } else {
      // Check for draft generated code passing through from Generate page
      const draftCode = localStorage.getItem('codelens_draft_code');
      const draftLang = localStorage.getItem('codelens_draft_lang');
      if (draftCode) {
        setCode(draftCode);
        if (draftLang) setManualLang(draftLang);
        // Clear it so it doesn't persist across random unmounts
        localStorage.removeItem('codelens_draft_code');
        localStorage.removeItem('codelens_draft_lang');
      }
    }
  }, [currentAnalysis]);

  // Line count generation for side indicator
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // Live Auto-Detection of Programming Languages based on syntax keywords
  useEffect(() => {
    if (!code.trim()) {
      setDetectedLang('');
      return;
    }

    const lowerCode = code.toLowerCase();

    // C++ Detection (std:: namespace, streams cout/cin)
    if ((lowerCode.includes('#include') && (lowerCode.includes('std::') || lowerCode.includes('cout') || lowerCode.includes('cin'))) || lowerCode.includes('using namespace std')) {
      setDetectedLang('C++');
      return;
    }

    // C Detection (printf, scanf, standard procedurals)
    if (lowerCode.includes('#include') || lowerCode.includes('printf(') || lowerCode.includes('scanf(') || lowerCode.includes('int main(') || lowerCode.includes('void main(')) {
      setDetectedLang('C');
      return;
    }

    // Java Detection
    if (lowerCode.includes('public class') || lowerCode.includes('system.out.print') || lowerCode.includes('public static void main')) {
      setDetectedLang('Java');
      return;
    }

    // Python Detection
    if (lowerCode.includes('def ') || lowerCode.includes('elif ') || lowerCode.includes('import pandas') || lowerCode.includes('print(') && !lowerCode.includes('console.log')) {
      setDetectedLang('Python');
      return;
    }


    // Default fallback to JavaScript if common keywords are present
    if (lowerCode.includes('const ') || lowerCode.includes('let ') || lowerCode.includes('console.log') || lowerCode.includes('function ')) {
      setDetectedLang('JavaScript');
      return;
    }

    setDetectedLang('');
  }, [code]);

  // Determine active language
  const activeLang = manualLang || detectedLang || 'JavaScript';

  // Clipboard Paste Helper
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
        setManualLang(''); // Reset manual selection to let auto-detect check it
        showToast("Code pasted successfully!");
      }
    } catch (err) {
      showToast("Clipboard read blocked. Paste using Ctrl+V directly.");
    }
  };

  // Clipboard Copy Helper
  const handleCopy = () => {
    if (!code.trim()) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard shortcut handler (Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (code.trim() && !loading) {
          onAnalyze(code, activeLang);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, loading, onAnalyze, activeLang]);

  // Drag and Drop files handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const filename = file.name;
      const extension = filename.split('.').pop().toLowerCase();

      const allowedExtensions = ['js', 'py', 'java', 'cpp', 'c', 'cs', 'ts', 'html', 'css', 'txt'];
      if (!allowedExtensions.includes(extension)) {
        showToast("Unsupported file extension. Try dropping JS, PY, Java, or CPP files.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target.result);
        setManualLang(''); // Reset manual selection
        showToast(`Imported ${filename} successfully!`);
      };
      reader.readAsText(file);
    }
  };

  // Standard toast trigger utility
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => setToastVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative w-full rounded-2xl border transition-all duration-300 ${dragActive
          ? 'border-accentCyan bg-accentCyan/5 shadow-[0_0_25px_rgba(0,245,196,0.15)]'
          : code.trim()
            ? 'border-accentCyan/45 bg-surface shadow-[0_0_20px_rgba(0,245,196,0.02)]'
            : 'border-border bg-surface shadow-2xl'
        }`}
    >
      {/* Editor Header Tools */}
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-surface/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-accentRed/80 shadow-[0_0_8px_rgba(255,107,107,0.25)]"></span>
            <span className="h-3 w-3 rounded-full bg-accentYellow/80 shadow-[0_0_8px_rgba(255,217,61,0.25)]"></span>
            <span className="h-3 w-3 rounded-full bg-accentCyan/80 shadow-[0_0_8px_rgba(0,245,196,0.25)]"></span>
          </div>
          <span className="ml-2 font-code text-xs text-mutedMain flex items-center gap-1.5 uppercase tracking-wider">
            <FileCode className="h-3.5 w-3.5" /> Workspace.{activeLang ? activeLang.substring(0, 2).toLowerCase() : 'txt'}
          </span>
          {currentAnalysis && (
            <span className="ml-2 text-[9px] px-2 py-0.5 rounded-full bg-accentCyan/10 border border-accentCyan/20 text-accentCyan font-sans font-extrabold uppercase tracking-widest flex items-center gap-1 shadow-sm select-none">
              <span className="relative flex h-1 w-1">
                <span className="relative inline-flex rounded-full h-1 w-1 bg-accentCyan"></span>
              </span>
              UNDERSTANDING MODE
            </span>
          )}
        </div>

        {/* Action button tools */}
        <div className="flex items-center gap-1.5">
          {code.trim() && !currentAnalysis && (
            <div className="relative group">
              <button
                disabled={converting}
                className="px-2.5 py-1 rounded-lg bg-accentPurple/10 hover:bg-accentPurple/20 border border-accentPurple/30 text-accentPurple font-heading text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Transpile code into another programming language"
              >
                <RefreshCw className={`h-3 w-3 ${converting ? 'animate-spin' : ''}`} />
                <span>Convert</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border/80 rounded-xl shadow-2xl p-1 hidden group-hover:block z-30 animate-fade-in">
                <span className="text-[9px] uppercase font-mono font-bold text-mutedMain px-2 py-1 block border-b border-border/40">Convert To:</span>
                {['C++', 'Java', 'Python', 'JavaScript'].map((langOption) => (
                  <button
                    key={langOption}
                    onClick={() => handleConvertCode(langOption)}
                    disabled={activeLang === langOption || converting}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-code text-textMain hover:bg-accentPurple/15 hover:text-accentPurple disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    {langOption}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-accentCyan/10 hover:bg-accentCyan/20 border border-accentCyan/30 text-accentCyan font-heading text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
            title="Import .zip project or public GitHub repo"
          >
            <FolderArchive className="h-3 w-3" />
            <span>Import Project</span>
          </button>

          <button
            onClick={handlePaste}
            className="p-1.5 rounded-lg text-mutedMain hover:text-textMain hover:bg-surface2 transition-all"
            title="Paste from clipboard"
          >
            <Clipboard className="h-4 w-4" />
          </button>


          <button
            onClick={handleCopy}
            disabled={!code.trim()}
            className="p-1.5 rounded-lg text-mutedMain hover:text-textMain hover:bg-surface2 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title="Copy all code"
          >
            {copied ? <Check className="h-4 w-4 text-accentCyan" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { setCode(''); setManualLang(''); showToast("Cleared workspace."); }}
            disabled={!code.trim()}
            className="p-1.5 rounded-lg text-mutedMain hover:text-accentRed hover:bg-accentRed/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title="Clear all text"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex min-h-[400px] max-h-[550px] overflow-auto font-code text-sm leading-relaxed p-4">
        {/* Line Numbers column */}
        <div className="flex flex-col text-right select-none text-mutedMain/50 font-mono pr-4 border-r border-border/40 min-w-[2.5rem]">
          {lineNumbers.map((num) => (
            <div key={num} className="h-6">{num}</div>
          ))}
        </div>

        {/* Text Input Block */}
        <div className="flex-1 relative pl-4 select-text">
          {activeLine ? (
            <div className="flex flex-col w-full h-full min-h-[368px] bg-transparent text-textMain outline-none resize-none font-code border-0 p-0 leading-6">
              {code.split('\n').map((lineText, idx) => {
                // Check if this line is active
                const isActive = activeLine && lineText.trim() === activeLine.trim();
                return (
                  <div
                    key={idx}
                    className={`h-6 flex items-center transition-all duration-300 w-full rounded ${
                      isActive
                        ? 'bg-accentCyan/15 border-l-2 border-accentCyan text-accentCyan font-bold px-2.5 shadow-[0_0_15px_rgba(0,245,196,0.15)] animate-pulse'
                        : 'px-2.5 text-textMain/80 hover:bg-surface2/10'
                    }`}
                  >
                    {lineText || ' '}
                  </div>
                );
              })}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here... supports C, C++, Java, Python, and JavaScript. Or drag and drop a source file directly."
              className={`w-full h-full min-h-[368px] bg-transparent text-textMain outline-none resize-none font-code border-0 p-0 focus:ring-0 placeholder:text-mutedMain/45 placeholder:italic leading-6 ${currentAnalysis ? 'cursor-default select-text opacity-95 text-accentCyan/90' : ''}`}
              readOnly={!!currentAnalysis}
              style={{ tabSize: 4 }}
            />
          )}
        </div>
      </div>

      {/* Footer Submit Bar */}
      <div className="border-t border-border/80 px-4 py-3 bg-surface/50 rounded-b-2xl flex flex-col sm:flex-row gap-4 sm:items-center justify-between animate-fade-in">

        {/* Interactive Language Selection Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {LANGUAGE_PILLS.map((pill, pIdx) => {
            const isMatch = activeLang === pill.name;
            return (
              <button
                key={pIdx}
                onClick={() => {
                  setManualLang(pill.name);
                  showToast(`Selected language: ${pill.name}`);
                }}
                className={`px-2.5 py-1 rounded-xl border text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${isMatch
                    ? `${pill.color} shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-105 font-black border`
                    : 'text-mutedMain/40 border-border/40 bg-transparent hover:text-textMain hover:border-border'
                  }`}
              >
                {pill.name}
              </button>
            );
          })}
        </div>

        {/* Primary Run Action Button */}
        {currentAnalysis ? (
          <button
            onClick={() => {
              if (!user) {
                showToast("Sign in required to modify code or run analyses!");
                setTimeout(() => navigate('/auth?mode=login'), 1200);
                return;
              }
              setCurrentAnalysis(null);
            }}
            className="px-6 py-2 rounded-xl bg-surface border border-border/80 text-textMain hover:bg-surface2 hover:text-accentCyan font-heading text-xs font-black uppercase tracking-widest hover:scale-102 hover:shadow-[0_0_15px_rgba(0,245,196,0.05)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔓 Modify / New Code</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (!user) {
                showToast("Sign in required to modify code or run analyses!");
                setTimeout(() => navigate('/auth?mode=login'), 1200);
                return;
              }
              onAnalyze(code, activeLang);
            }}
            disabled={loading || !code.trim()}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-accentCyan to-accentPurple text-background font-heading text-xs font-black uppercase tracking-widest hover:scale-102 hover:shadow-[0_0_20px_rgba(0,245,196,0.25)] active:scale-98 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Analyze Code</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Floating Micro-Toast Notification */}
      {toastVisible && (
        <div className="absolute bottom-16 right-4 z-50 bg-background/90 border border-border/80 text-textMain px-3.5 py-1.5 rounded-xl font-heading text-[10px] uppercase font-bold tracking-wider shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <Terminal className="h-3.5 w-3.5 text-accentCyan" />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Multi-File Project Import & GitHub Zip Scanner Modal */}
      <ProjectScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onImportCode={(combinedCode) => {
          setCode(combinedCode);
          setManualLang('');
          showToast("Imported multi-file project workspace!");
        }}
      />
    </div>
  );
}

