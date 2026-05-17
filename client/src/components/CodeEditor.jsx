import React, { useState, useEffect, useRef } from 'react';
import { Play, Clipboard, Trash2, Copy, FileCode, Check } from 'lucide-react';

const LANGUAGE_PILLS = [
  { name: 'JavaScript', ext: 'js', color: 'text-yellow-400 bg-yellow-400/15 border-yellow-400/30' },
  { name: 'Python', ext: 'py', color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30' },
  { name: 'Java', ext: 'java', color: 'text-orange-400 bg-orange-400/15 border-orange-400/30' },
  { name: 'C++', ext: 'cpp', color: 'text-sky-400 bg-sky-400/15 border-sky-400/30' },
  { name: 'TypeScript', ext: 'ts', color: 'text-blue-400 bg-blue-400/15 border-blue-400/30' }
];

export default function CodeEditor({ onAnalyze, loading }) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [detectedLang, setDetectedLang] = useState('');
  const textareaRef = useRef(null);

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
    
    // C++ Detection
    if (lowerCode.includes('#include') || lowerCode.includes('std::') || lowerCode.includes('cout <<') || lowerCode.includes('cin >>')) {
      setDetectedLang('C++');
      return;
    }
    
    // Java Detection
    if (lowerCode.includes('public class') || lowerCode.includes('system.out.print') || lowerCode.includes('public static void main')) {
      setDetectedLang('Java');
      return;
    }
    
    // Python Detection
    if (lowerCode.includes('def ') || lowerCode.includes('elif ') || lowerCode.includes('import pandas') || lowerCode.includes('print(') && !lowerCode.includes('console.log')) {
      // Small refinement to ensure Python doesn't trigger for console.log print references
      setDetectedLang('Python');
      return;
    }
    
    // TypeScript Detection
    if (lowerCode.includes('interface ') || lowerCode.includes(': string') || lowerCode.includes(': number') || lowerCode.includes('as ') && (lowerCode.includes('const ') || lowerCode.includes('let '))) {
      setDetectedLang('TypeScript');
      return;
    }
    
    // Default fallback to JavaScript if common keywords are present
    if (lowerCode.includes('const ') || lowerCode.includes('let ') || lowerCode.includes('console.log') || lowerCode.includes('function ')) {
      setDetectedLang('JavaScript');
      return;
    }

    setDetectedLang('');
  }, [code]);

  // Clipboard Paste Helper
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
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
          onAnalyze(code);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, loading, onAnalyze]);

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
      
      // Support listed extensions
      const allowedExtensions = ['js', 'py', 'java', 'cpp', 'c', 'cs', 'ts', 'html', 'css', 'txt'];
      if (!allowedExtensions.includes(extension)) {
        showToast("Unsupported file extension. Try dropping JS, PY, Java, or CPP files.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target.result);
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
      className={`relative w-full rounded-2xl border transition-all duration-300 ${
        dragActive 
          ? 'border-accentCyan bg-accentCyan/5 shadow-[0_0_25px_rgba(0,245,196,0.15)]' 
          : code.trim() 
            ? 'border-accentCyan/45 bg-surface shadow-[0_0_20px_rgba(0,245,196,0.02)] animate-pulse-glow'
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
            <FileCode className="h-3.5 w-3.5" /> Workspace.{detectedLang ? detectedLang.substring(0,2).toLowerCase() : 'txt'}
          </span>
        </div>

        {/* Action button tools */}
        <div className="flex items-center gap-1">
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
            onClick={() => { setCode(''); showToast("Cleared workspace."); }}
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
        <div className="flex-1 relative pl-4">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here... supports Javascript, Python, Java, C++, and more. Or drag and drop a source file directly."
            className="w-full h-full min-h-[368px] bg-transparent text-textMain outline-none resize-none font-code border-0 p-0 focus:ring-0 placeholder:text-mutedMain/45 placeholder:italic leading-6"
            style={{ tabSize: 4 }}
          />
        </div>
      </div>

      {/* Footer Submit Bar */}
      <div className="border-t border-border/80 px-4 py-3 bg-surface/50 rounded-b-2xl flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        
        {/* Auto Language Detection Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {LANGUAGE_PILLS.map((pill, pIdx) => {
            const isMatch = detectedLang === pill.name;
            return (
              <span
                key={pIdx}
                className={`px-2 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isMatch 
                    ? `${pill.color} shadow-[0_0_12px_rgba(255,255,255,0.03)] scale-105 font-bold`
                    : 'text-mutedMain/40 border-border/60 bg-transparent'
                }`}
              >
                {pill.name}
              </span>
            );
          })}
        </div>

        <button
          onClick={() => code.trim() && onAnalyze(code)}
          disabled={loading || !code.trim()}
          className="relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-heading text-sm font-extrabold uppercase tracking-widest text-background bg-accentCyan hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_0_20px_rgba(0,245,196,0.25)] hover:shadow-[0_0_30px_rgba(0,245,196,0.45)]"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-background" />
              <span>Analyze Code</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Drag Overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-accentCyan z-10 pointer-events-none transition-all">
          <FileCode className="h-16 w-16 text-accentCyan animate-bounce" />
          <p className="mt-4 text-lg font-heading text-textMain">Drop your code file here</p>
          <p className="text-sm text-mutedMain mt-1">Accepts JS, PY, Java, CPP, TS, and CS files</p>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastVisible && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-surface2 border border-border px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold tracking-wider text-accentCyan z-20 flex items-center gap-2 animate-bounce">
          <Check className="h-3.5 w-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
