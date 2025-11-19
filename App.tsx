import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DocumentView } from './components/DocumentView';
import { InputSection } from './components/InputSection';
import { Button } from './components/Button';
import { JsonModal } from './components/JsonModal';
import { PatchPreviewModal } from './components/PatchPreviewModal';
import { HistoryModal } from './components/HistoryModal';
import { FileExplorer } from './components/FileExplorer';
import { analyzeDiff, createPatchPlan, generatePatchedDocument } from './services/geminiService';
import { AnalysisResult, Language, AppMode, PatchPlan, HistoryRecord, Folder, SmartDocument } from './types';
import { SAMPLE_V1, SAMPLE_V2, CHANGE_TYPE_DESCRIPTIONS, TRANSLATIONS } from './constants';
import { Sparkles, Play, Code2, RotateCcw, SplitSquareHorizontal, Eye, Download, Languages, FileInput, FileText, Clock, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// Helper for ID generation
const generateId = () => Math.random().toString(36).substring(2, 11);

const App: React.FC = () => {
  // --- State: File System ---
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- State: UI & Analysis ---
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPatchGenerating, setIsPatchGenerating] = useState(false);
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [patchPlan, setPatchPlan] = useState<PatchPlan | null>(null);
  const [showPatchPreview, setShowPatchPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [activeChangeId, setActiveChangeId] = useState<string | null>(null);
  const [highlightLines, setHighlightLines] = useState<{ start: number; end: number } | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // View Mode: 'edit' (default/source), 'diff' (comparison), 'preview' (markdown)
  const [viewMode, setViewMode] = useState<'edit' | 'diff' | 'preview'>('edit');
  const [lang, setLang] = useState<Language>('zh');

  const t = TRANSLATIONS[lang];

  // Derived Active Document State
  const activeDoc = documents.find(d => d.id === activeDocId) || null;

  // --- Initialization & Migration ---
  useEffect(() => {
    const storedFolders = localStorage.getItem('smartdiff_folders');
    const storedDocs = localStorage.getItem('smartdiff_documents');
    const storedActiveId = localStorage.getItem('smartdiff_active_id');

    if (storedDocs) {
      setFolders(storedFolders ? JSON.parse(storedFolders) : []);
      setDocuments(JSON.parse(storedDocs));
      setActiveDocId(storedActiveId || null);
    } else {
      // MIGRATION: Check for legacy single-draft
      const legacyV1 = localStorage.getItem('draft_v1');
      const legacyTitle = localStorage.getItem('draft_title');
      
      const defaultFolderId = generateId();
      const newFolder: Folder = {
         id: defaultFolderId,
         name: t.feDefaultProject,
         createdAt: Date.now()
      };

      const newDoc: SmartDocument = {
        id: generateId(),
        folderId: defaultFolderId,
        title: legacyTitle || t.feUntitledDoc,
        v1: legacyV1 || '',
        v2: localStorage.getItem('draft_v2') || '',
        patchText: localStorage.getItem('draft_patch') || '',
        mode: (localStorage.getItem('draft_mode') as AppMode) || 'global',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setFolders([newFolder]);
      setDocuments([newDoc]);
      setActiveDocId(newDoc.id);
    }
  }, []); // Run once on mount

  // --- Persistence ---
  useEffect(() => {
    if (documents.length > 0) {
       localStorage.setItem('smartdiff_folders', JSON.stringify(folders));
       localStorage.setItem('smartdiff_documents', JSON.stringify(documents));
    }
    if (activeDocId) {
      localStorage.setItem('smartdiff_active_id', activeDocId);
    }
  }, [folders, documents, activeDocId]);


  // --- File System Handlers ---
  const handleCreateFolder = () => {
    const newFolder: Folder = {
      id: generateId(),
      name: t.feUntitledFolder,
      createdAt: Date.now()
    };
    setFolders([...folders, newFolder]);
  };

  const handleCreateDoc = (folderId: string | null) => {
    const newDoc: SmartDocument = {
      id: generateId(),
      folderId,
      title: t.feUntitledDoc,
      v1: '',
      v2: '',
      patchText: '',
      mode: 'global',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setDocuments([...documents, newDoc]);
    setActiveDocId(newDoc.id);
    // Reset UI state for new doc
    setStep('input');
    setResult(null);
    setViewMode('edit');
  };

  const handleRenameFolder = (id: string, newName: string) => {
    setFolders(folders.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const handleRenameDoc = (id: string, newName: string) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, title: newName } : d));
  };

  const handleDeleteFolder = (id: string) => {
    setFolders(folders.filter(f => f.id !== id));
    // Also delete docs in folder
    const docsToDelete = documents.filter(d => d.folderId === id).map(d => d.id);
    setDocuments(documents.filter(d => d.folderId !== id));
    if (docsToDelete.includes(activeDocId || '')) {
      setActiveDocId(null);
    }
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
    if (activeDocId === id) setActiveDocId(null);
  };

  // --- Document Update Handlers ---
  const updateActiveDoc = (updates: Partial<SmartDocument>) => {
    if (!activeDocId) return;
    setDocuments(prevDocs => prevDocs.map(doc => 
      doc.id === activeDocId 
        ? { ...doc, ...updates, updatedAt: Date.now() } 
        : doc
    ));
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const detectTitle = (text: string): string => {
    if (!text) return '';
    const lines = text.split('\n');
    const h1 = lines.find(line => line.trim().startsWith('# '));
    if (h1) return h1.replace('# ', '').trim();
    const firstLine = lines.find(line => line.trim().length > 0);
    if (firstLine && firstLine.length < 100) return firstLine.trim();
    return '';
  };

  const stripMetadata = (text: string): string => {
    if (!text) return '';
    const markerIndex = text.indexOf('SMARTDIFF AI METADATA');
    if (markerIndex !== -1) {
       const split = text.split(/<!--\s*=+\s*SMARTDIFF AI METADATA/);
       if (split.length > 1) {
         return split[0].replace(/(<br\s*\/?>\s*)?(<hr\s*\/?>\s*)?$/i, '').trim();
       }
    }
    return text;
  };

  const saveToHistory = (analysis: AnalysisResult, content: string, title: string) => {
    try {
      const newRecord: HistoryRecord = {
        id: generateId(),
        docId: activeDocId || undefined,
        timestamp: Date.now(),
        version: analysis.version,
        summary: analysis.summary,
        fullContent: content,
        docTitle: title || 'Untitled'
      };
      
      const stored = localStorage.getItem('smartdiff_history');
      const history = stored ? JSON.parse(stored) : [];
      const newHistory = [newRecord, ...history].slice(0, 50); // Increase limit slightly
      localStorage.setItem('smartdiff_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const handleRestore = (record: HistoryRecord) => {
    updateActiveDoc({
      v1: record.fullContent,
      v2: '',
      patchText: '',
      title: record.docTitle
    });
    setStep('input');
    setResult(null);
  };

  // Auto-detect title
  useEffect(() => {
    if (activeDoc && (!activeDoc.title || activeDoc.title === t.feUntitledDoc)) {
      const sourceText = activeDoc.v2 || activeDoc.v1;
      const detected = detectTitle(sourceText);
      if (detected && detected !== activeDoc.title) {
        updateActiveDoc({ title: detected });
      }
    }
  }, [activeDoc?.v1, activeDoc?.v2]);

  const handleLoadDemo = () => {
    updateActiveDoc({
      v1: SAMPLE_V1,
      v2: SAMPLE_V2,
      title: 'SmartDiff 产品需求文档'
    });
  };

  const handleAnalyze = useCallback(async () => {
    setError(null);
    if (!activeDoc) return;
    
    if (activeDoc.mode === 'global') {
      if (!activeDoc.v1.trim() || !activeDoc.v2.trim()) {
          setError(t.errorEmpty);
          return;
      }
      
      setIsAnalyzing(true);
      try {
        const cleanV1 = stripMetadata(activeDoc.v1);
        const cleanV2 = stripMetadata(activeDoc.v2);

        const analysis = await analyzeDiff(cleanV1, cleanV2, lang);
        setResult(analysis);
        setStep('result');
        saveToHistory(analysis, cleanV2, activeDoc.title);
        
        if (analysis.changes.length > 0) {
          setActiveChangeId(analysis.changes[0].id);
          setHighlightLines(analysis.changes[0].lines);
        }
      } catch (err) {
        setError(t.errorApi);
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    } 
    else {
      if (!activeDoc.v1.trim() || !activeDoc.patchText.trim()) {
        setError(t.errorPatchEmpty);
        return;
      }

      setIsAnalyzing(true);
      try {
        const cleanV1 = stripMetadata(activeDoc.v1);
        const plan = await createPatchPlan(cleanV1, activeDoc.patchText, lang);
        setPatchPlan(plan);
        setShowPatchPreview(true);
      } catch (err) {
        setError(t.errorApi);
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [activeDoc, lang, t]);

  const handleConfirmPatch = useCallback(async (targetVersion: string) => {
    if (!patchPlan || !activeDoc) return;

    setIsPatchGenerating(true);
    try {
      const cleanV1ForGen = stripMetadata(activeDoc.v1);
      
      const newV2 = await generatePatchedDocument(cleanV1ForGen, activeDoc.patchText, patchPlan, targetVersion, lang);
      updateActiveDoc({ v2: newV2 });

      const cleanV2 = stripMetadata(newV2); 
      const analysis = await analyzeDiff(cleanV1ForGen, cleanV2, lang, targetVersion);
      setResult(analysis);
      saveToHistory(analysis, cleanV2, activeDoc.title);
      
      setShowPatchPreview(false);
      setStep('result');
      
      if (analysis.changes.length > 0) {
        setActiveChangeId(analysis.changes[0].id);
        setHighlightLines(analysis.changes[0].lines);
      }
    } catch (err) {
      setError(t.errorApi);
      console.error(err);
    } finally {
      setIsPatchGenerating(false);
    }
  }, [activeDoc, patchPlan, lang, t]);

  const handleSelectChange = useCallback((id: string, startLine: number) => {
    setActiveChangeId(id);
    const change = result?.changes.find(c => c.id === id);
    if (change) {
      setHighlightLines(change.lines);
      if (viewMode === 'preview') {
         setViewMode('edit');
      }
    }
  }, [result, viewMode]);

  const handleReset = () => {
    setStep('input');
    setResult(null);
    setActiveChangeId(null);
    setHighlightLines(null);
    setError(null);
    setViewMode('edit');
    setPatchPlan(null);
    setShowPatchPreview(false);
  };

  const handleExport = useCallback(() => {
    if (!result || !activeDoc) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const humanTime = new Date().toLocaleString();
    
    const safeTitle = (activeDoc.title || 'SmartDiff').replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_ ]/g, '').trim();
    const filename = `${safeTitle}_v${result.version}_${timestamp}.md`;

    let legendText = `### ${t.exportLegendTitle}\n`;
    const descriptions = CHANGE_TYPE_DESCRIPTIONS[lang];
    Object.entries(descriptions).forEach(([key, desc]) => {
      legendText += `- **${key}**: ${desc}\n`;
    });

    const noteText = `> **${t.exportNote}**: ${t.exportNoteContent}`;
    const cleanV2 = stripMetadata(activeDoc.v2);
    let contentWithNote = cleanV2;
    const lines = cleanV2.split('\n');
    const h1Index = lines.findIndex(line => line.trim().startsWith('# '));

    if (h1Index !== -1) {
      lines.splice(h1Index + 1, 0, "", noteText, "");
      contentWithNote = lines.join('\n');
    } else {
      contentWithNote = `${noteText}\n\n${cleanV2}`;
    }

    const exportContent = `${contentWithNote}

<br/>
<hr/>

<!-- 
=============================================================================
${t.exportMetaHeader}
Generated at: ${humanTime}
=============================================================================
-->

${legendText}

### ${t.exportSectionTitle}
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`
`;

    const blob = new Blob([exportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result, activeDoc, lang, t]);

  return (
    <div className="h-screen flex bg-[#F5F5F7] overflow-hidden text-slate-900 font-sans">
      
      {/* Sidebar: File Explorer */}
      <div className={`transition-all duration-300 ease-in-out border-r border-slate-200/60 bg-slate-50/50 flex flex-col
        ${isSidebarOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}
      `}>
        <FileExplorer 
          folders={folders}
          documents={documents}
          activeDocId={activeDocId}
          onSelectDoc={(id) => {
            setActiveDocId(id);
            setStep('input');
            setResult(null);
            setError(null);
          }}
          onCreateFolder={handleCreateFolder}
          onCreateDoc={handleCreateDoc}
          onRenameFolder={handleRenameFolder}
          onRenameDoc={handleRenameDoc}
          onDeleteFolder={handleDeleteFolder}
          onDeleteDoc={handleDeleteDoc}
          lang={lang}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navbar */}
        <header className="h-18 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 py-4 flex-shrink-0 z-30">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-200/50 text-slate-500"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-3">
              <div className="bg-[#0071e3] p-2 rounded-xl shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight hidden sm:block">{t.appTitle}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={toggleLanguage} 
              className="text-xs font-bold uppercase tracking-wider"
              icon={<Languages className="w-4 h-4"/>}
            >
              {lang === 'zh' ? 'En' : '中'}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowHistory(true)}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#0071e3]"
              icon={<Clock className="w-4 h-4"/>}
            >
              {t.btnHistory}
            </Button>

            <div className="h-5 w-px bg-slate-300 mx-2 hidden sm:block"></div>

            {step === 'result' && (
              <div className="flex items-center space-x-2 bg-slate-100/50 p-1.5 rounded-full border border-slate-200/60">
                {/* View Toggle Group */}
                <div className="flex bg-white rounded-full shadow-sm p-0.5 mr-2">
                    <button 
                      onClick={() => setViewMode('edit')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1
                        ${viewMode === 'edit' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                      title={t.btnEdit}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline ml-1">{t.btnEdit}</span>
                    </button>
                    <button 
                      onClick={() => setViewMode('diff')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1
                        ${viewMode === 'diff' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                      title={t.btnDiffShow}
                    >
                      <SplitSquareHorizontal className="w-3.5 h-3.5" />
                      <span className="hidden md:inline ml-1">{t.btnDiffShow}</span>
                    </button>
                    <button 
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1
                        ${viewMode === 'preview' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                      title={t.btnPreview}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden md:inline ml-1">{t.btnPreview}</span>
                    </button>
                </div>
                
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                
                <Button variant="ghost" onClick={handleExport} icon={<Download className="w-4 h-4"/>} className="rounded-full px-3" title={t.btnExport} />
                <Button variant="ghost" onClick={() => setShowJson(true)} icon={<FileText className="w-4 h-4"/>} className="rounded-full px-3" title="JSON" />
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw className="w-4 h-4"/>} className="rounded-full px-3 text-slate-400 hover:text-red-600" title={t.btnReset} />
              </div>
            )}
            {step === 'input' && (
              <>
                  <Button 
                    variant="secondary" 
                    onClick={handleLoadDemo} 
                    className="mr-2 bg-white/80 backdrop-blur border-white/50 shadow-sm"
                    icon={<FileInput className="w-4 h-4" />}
                  >
                    {t.btnLoadDemo}
                  </Button>
                  <Button 
                    onClick={handleAnalyze} 
                    isLoading={isAnalyzing} 
                    disabled={!activeDoc || isAnalyzing || (activeDoc.mode === 'global' ? (!activeDoc.v1 || !activeDoc.v2) : (!activeDoc.v1 || !activeDoc.patchText))}
                    icon={<Play className="w-4 h-4 fill-current" />}
                    className={`shadow-lg shadow-indigo-500/20 px-6 ${activeDoc?.mode === 'patch' ? 'bg-[#0071e3] hover:bg-[#0077ED] shadow-blue-500/20' : ''}`}
                  >
                    {activeDoc?.mode === 'global' ? t.btnAnalyze : t.btnPlanPatch}
                  </Button>
              </>
            )}
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 relative overflow-hidden">
          {/* Error Banner */}
          {error && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-50/90 backdrop-blur-md text-red-600 px-6 py-3 rounded-full border border-red-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 flex items-center text-sm font-medium animate-in slide-in-from-top-4 fade-in duration-300">
                  <Sparkles className="w-4 h-4 mr-2" /> 
                  {error}
              </div>
          )}
          
          {!activeDocId ? (
             <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>Select or create a document to start</p>
             </div>
          ) : step === 'input' ? (
            <div className="h-full w-full overflow-y-auto custom-scrollbar">
              <div className="p-6 w-full h-full flex flex-col">
                  <div className="text-center mb-6 flex-shrink-0">
                      <h2 className="text-3xl font-bold text-[#1d1d1f] mb-2 tracking-tight">{t.inputModeTitle}</h2>
                      <p className="text-base text-slate-500 font-medium leading-relaxed">{t.inputModeDesc}</p>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                      <InputSection 
                        docTitle={activeDoc?.title || ''}
                        onTitleChange={(val) => updateActiveDoc({ title: val })}
                        v1={activeDoc?.v1 || ''} 
                        v2={activeDoc?.v2 || ''}
                        patchText={activeDoc?.patchText || ''}
                        onV1Change={(val) => updateActiveDoc({ v1: val })} 
                        onV2Change={(val) => updateActiveDoc({ v2: val })} 
                        onPatchChange={(val) => updateActiveDoc({ patchText: val })}
                        isAnalyzing={isAnalyzing}
                        lang={lang}
                        mode={activeDoc?.mode || 'global'}
                        onModeChange={(val) => updateActiveDoc({ mode: val })}
                      />
                  </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex p-4 gap-4">
              {/* Sidebar (Results) */}
              <div className="w-80 flex-shrink-0 h-full z-20 flex flex-col">
                {result && (
                  <Sidebar 
                    result={result} 
                    activeChangeId={activeChangeId} 
                    onSelectChange={handleSelectChange} 
                    lang={lang}
                  />
                )}
              </div>

              {/* Main View (Document Preview) */}
              <div className="flex-1 h-full flex flex-col relative z-10 overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
                <DocumentView 
                  v1Content={activeDoc?.v1 || ''}
                  v2Content={activeDoc?.v2 || ''}
                  activeChangeId={activeChangeId} 
                  highlightLines={highlightLines}
                  viewMode={viewMode}
                  lang={lang}
                />
              </div>
            </div>
          )}
        </main>

        {/* Modals */}
        <PatchPreviewModal 
          isOpen={showPatchPreview}
          onClose={() => setShowPatchPreview(false)}
          onConfirm={handleConfirmPatch}
          plan={patchPlan}
          lang={lang}
          isGenerating={isPatchGenerating}
        />

        <HistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onRestore={handleRestore}
          lang={lang}
          currentDocTitle={activeDoc?.title}
        />

        {result && (
          <JsonModal 
            isOpen={showJson} 
            onClose={() => setShowJson(false)} 
            data={result} 
            lang={lang}
          />
        )}
      </div>
    </div>
  );
};

export default App;