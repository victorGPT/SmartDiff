import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DocumentView } from './components/DocumentView';
import { InputSection } from './components/InputSection';
import { Button } from './components/Button';
import { JsonModal } from './components/JsonModal';
import { PatchPreviewModal } from './components/PatchPreviewModal';
import { HistoryModal } from './components/HistoryModal';
import { analyzeDiff, createPatchPlan, generatePatchedDocument } from './services/geminiService';
import { AnalysisResult, Language, AppMode, PatchPlan, HistoryRecord } from './types';
import { SAMPLE_V1, SAMPLE_V2, CHANGE_TYPE_DESCRIPTIONS, TRANSLATIONS } from './constants';
import { Sparkles, Play, Code2, RotateCcw, SplitSquareHorizontal, Eye, Download, Languages, FileInput, FileText, Clock } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [appMode, setAppMode] = useState<AppMode>('global');
  
  // Initialize as empty so placeholders are visible
  const [v1Text, setV1Text] = useState('');
  const [v2Text, setV2Text] = useState('');
  const [patchText, setPatchText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  
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

  // Handlers
  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const detectTitle = (text: string): string => {
    if (!text) return '';
    const lines = text.split('\n');
    // Try to find Markdown H1 (e.g., "# My Title")
    const h1 = lines.find(line => line.trim().startsWith('# '));
    if (h1) return h1.replace('# ', '').trim();
    
    // Fallback to first non-empty line if it looks like a title (shortish)
    const firstLine = lines.find(line => line.trim().length > 0);
    if (firstLine && firstLine.length < 100) return firstLine.trim();
    
    return '';
  };

  // Helper to remove AI Metadata footer from text for clean analysis
  const stripMetadata = (text: string): string => {
    if (!text) return '';
    // Look for the specific marker used in handleExport
    // We split by the marker and take the first part
    // The marker is roughly: <!-- ... SMARTDIFF AI METADATA ...
    const markerIndex = text.indexOf('SMARTDIFF AI METADATA');
    
    if (markerIndex !== -1) {
       // Try to find the start of the HTML comment block slightly before the marker
       const split = text.split(/<!--\s*=+\s*SMARTDIFF AI METADATA/);
       if (split.length > 1) {
         // Remove any trailing <br/><hr/> that might have been added before the comment
         return split[0].replace(/(<br\s*\/?>\s*)?(<hr\s*\/?>\s*)?$/i, '').trim();
       }
    }
    return text;
  };

  const saveToHistory = (analysis: AnalysisResult, content: string, title: string) => {
    try {
      const newRecord: HistoryRecord = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        version: analysis.version,
        summary: analysis.summary,
        fullContent: content,
        docTitle: title || 'Untitled'
      };
      
      const stored = localStorage.getItem('smartdiff_history');
      const history = stored ? JSON.parse(stored) : [];
      // Keep last 20 records
      const newHistory = [newRecord, ...history].slice(0, 20);
      localStorage.setItem('smartdiff_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const handleRestore = (record: HistoryRecord) => {
    // Set the restored content as V1 (Original) so user can continue working from it
    setV1Text(record.fullContent);
    // Clear V2 and Patch since we are starting a new iteration
    setV2Text('');
    setPatchText('');
    setDocTitle(record.docTitle);
    setStep('input');
    setResult(null);
    // If we were in global mode, we stay. If in patch mode, we stay.
  };

  // Auto-detect title from content if title field is empty
  useEffect(() => {
    if (!docTitle) {
      // Prefer V2 content, fallback to V1
      const sourceText = v2Text || v1Text;
      const detected = detectTitle(sourceText);
      if (detected) {
        setDocTitle(detected);
      }
    }
  }, [v1Text, v2Text, docTitle]);

  const handleLoadDemo = () => {
    setV1Text(SAMPLE_V1);
    setV2Text(SAMPLE_V2);
    setDocTitle('SmartDiff 产品需求文档');
  };

  const handleAnalyze = useCallback(async () => {
    setError(null);
    
    // MODE 1: Global Update (Manual V1 & V2)
    if (appMode === 'global') {
      if (!v1Text.trim() || !v2Text.trim()) {
          setError(t.errorEmpty);
          return;
      }
      
      setIsAnalyzing(true);
      try {
        // CLEAN Inputs before analysis to avoid noise from old metadata
        const cleanV1 = stripMetadata(v1Text);
        const cleanV2 = stripMetadata(v2Text);

        // Pass undefined for knownVersion in global mode, let AI infer
        const analysis = await analyzeDiff(cleanV1, cleanV2, lang);
        setResult(analysis);
        setStep('result');
        saveToHistory(analysis, cleanV2, docTitle);
        
        // Select first change by default
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
    // MODE 2: Smart Patch (V1 + Fragment -> AI Plan -> AI Generate -> Analysis)
    else {
      if (!v1Text.trim() || !patchText.trim()) {
        setError(t.errorPatchEmpty);
        return;
      }

      setIsAnalyzing(true);
      try {
        // Note: We pass clean V1 for planning to focus on content
        const cleanV1 = stripMetadata(v1Text);
        const plan = await createPatchPlan(cleanV1, patchText, lang);
        setPatchPlan(plan);
        setShowPatchPreview(true);
      } catch (err) {
        setError(t.errorApi);
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [v1Text, v2Text, patchText, lang, t, appMode, docTitle]);

  const handleConfirmPatch = useCallback(async (targetVersion: string) => {
    if (!patchPlan) return;

    setIsPatchGenerating(true);
    try {
      // 1. Generate the new V2 document
      // IMPORTANT: We pass CLEAN V1 to the generator now (Clean Slate Strategy).
      // We strip old metadata so it doesn't get duplicated or confuse the generator.
      const cleanV1ForGen = stripMetadata(v1Text);
      
      const newV2 = await generatePatchedDocument(cleanV1ForGen, patchText, patchPlan, targetVersion, lang);
      setV2Text(newV2);

      // 2. Perform standard analysis on the new pair
      // CRITICAL: We must strip metadata from inputs for the Analysis step (though newV2 should be clean now)
      const cleanV2 = stripMetadata(newV2); 

      // Pass knownVersion explicitly so AI doesn't hallucinate a different version number
      const analysis = await analyzeDiff(cleanV1ForGen, cleanV2, lang, targetVersion);
      setResult(analysis);
      saveToHistory(analysis, cleanV2, docTitle);
      
      // 3. Transition UI
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
  }, [v1Text, patchText, patchPlan, lang, t, docTitle]);

  const handleSelectChange = useCallback((id: string, startLine: number) => {
    setActiveChangeId(id);
    const change = result?.changes.find(c => c.id === id);
    if (change) {
      setHighlightLines(change.lines);
      // Force switch to editor view if clicked, so they can see the highlight
      // But if they are in Diff mode, that supports highlight too. 
      // Only Preview mode doesn't support specific line highlighting yet (as it renders HTML).
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
    if (!result) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const humanTime = new Date().toLocaleString();
    
    const safeTitle = (docTitle || 'SmartDiff').replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_ ]/g, '').trim();
    const filename = `${safeTitle}_v${result.version}_${timestamp}.md`;

    let legendText = `### ${t.exportLegendTitle}\n`;
    const descriptions = CHANGE_TYPE_DESCRIPTIONS[lang];
    Object.entries(descriptions).forEach(([key, desc]) => {
      legendText += `- **${key}**: ${desc}\n`;
    });

    const noteText = `> **${t.exportNote}**: ${t.exportNoteContent}`;

    // Ensure we use the clean version (without metadata) as base for export
    // just in case, though state should be clean now.
    const cleanV2 = stripMetadata(v2Text);
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
  }, [result, v2Text, lang, t, docTitle]);

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F7] overflow-hidden text-slate-900 font-sans">
      {/* Navbar - Glass Effect */}
      <header className="h-18 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 py-4 flex-shrink-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="bg-[#0071e3] p-2 rounded-xl shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight hidden sm:block">{t.appTitle}</h1>
          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase tracking-wide border border-slate-200">{t.beta}</span>
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
                  disabled={isAnalyzing || (appMode === 'global' ? (!v1Text || !v2Text) : (!v1Text || !patchText))}
                  icon={<Play className="w-4 h-4 fill-current" />}
                  className={`shadow-lg shadow-indigo-500/20 px-6 ${appMode === 'patch' ? 'bg-[#0071e3] hover:bg-[#0077ED] shadow-blue-500/20' : ''}`}
                >
                  {appMode === 'global' ? t.btnAnalyze : t.btnPlanPatch}
                </Button>
             </>
           )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Error Banner */}
        {error && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-50/90 backdrop-blur-md text-red-600 px-6 py-3 rounded-full border border-red-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 flex items-center text-sm font-medium animate-in slide-in-from-top-4 fade-in duration-300">
                <Sparkles className="w-4 h-4 mr-2" /> 
                {error}
            </div>
        )}

        {step === 'input' ? (
          <div className="h-full w-full overflow-y-auto custom-scrollbar">
             {/* Removing max-w constraint and vertical centering to allow full usage of screen */}
             <div className="p-6 w-full h-full flex flex-col">
                <div className="text-center mb-6 flex-shrink-0">
                    <h2 className="text-3xl font-bold text-[#1d1d1f] mb-2 tracking-tight">{t.inputModeTitle}</h2>
                    <p className="text-base text-slate-500 font-medium leading-relaxed">{t.inputModeDesc}</p>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <InputSection 
                      docTitle={docTitle}
                      onTitleChange={setDocTitle}
                      v1={v1Text} 
                      v2={v2Text}
                      patchText={patchText}
                      onV1Change={setV1Text} 
                      onV2Change={setV2Text} 
                      onPatchChange={setPatchText}
                      isAnalyzing={isAnalyzing}
                      lang={lang}
                      mode={appMode}
                      onModeChange={setAppMode}
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
                 v1Content={v1Text}
                 v2Content={v2Text}
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
  );
};

export default App;