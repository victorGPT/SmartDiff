import React, { useRef, useEffect, useMemo } from 'react';
import { diffLines } from 'diff';
import { marked } from 'marked';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { AlignJustify, Columns } from 'lucide-react';

interface DocumentViewProps {
  v1Content: string;
  v2Content: string;
  activeChangeId: string | null;
  highlightLines: { start: number; end: number } | null;
  viewMode: 'edit' | 'diff' | 'preview';
  diffLayout: 'split' | 'unified';
  onLayoutChange: (layout: 'split' | 'unified') => void;
  lang: Language;
}

interface RowData {
  left?: {
    content: string;
    lineNumber: number;
    type: 'removed' | 'unchanged';
  };
  right?: {
    content: string;
    lineNumber: number;
    type: 'added' | 'unchanged';
  };
}

interface UnifiedRow {
  content: string;
  type: 'added' | 'removed' | 'unchanged';
  v1LineNumber?: number;
  v2LineNumber?: number;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ 
  v1Content, 
  v2Content, 
  activeChangeId, 
  highlightLines,
  viewMode,
  diffLayout,
  onLayoutChange,
  lang
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const t = TRANSLATIONS[lang];
  const isDiffMode = viewMode === 'diff';
  const isPreviewMode = viewMode === 'preview';

  // Markdown Rendering
  const markdownHtml = useMemo(() => {
    if (!isPreviewMode) return '';
    return marked.parse(v2Content, { gfm: true, breaks: true }) as string;
  }, [v2Content, isPreviewMode]);

  // Calculate Diff for Split View
  const splitRows = useMemo(() => {
    if (isPreviewMode || diffLayout === 'unified') return [];
    
    const diffs = diffLines(v1Content, v2Content);
    const result: RowData[] = [];
    
    let v1LineCounter = 1;
    let v2LineCounter = 1;

    diffs.forEach((part) => {
      const lines = part.value.replace(/\n$/, '').split('\n');
      
      if (part.added) {
        lines.forEach(line => {
          result.push({
            right: {
              content: line,
              lineNumber: v2LineCounter++,
              type: 'added'
            }
          });
        });
      } else if (part.removed) {
        lines.forEach(line => {
          result.push({
            left: {
              content: line,
              lineNumber: v1LineCounter++,
              type: 'removed'
            }
          });
        });
      } else {
        lines.forEach(line => {
          result.push({
            left: {
              content: line,
              lineNumber: v1LineCounter++,
              type: 'unchanged'
            },
            right: {
              content: line,
              lineNumber: v2LineCounter++,
              type: 'unchanged'
            }
          });
        });
      }
    });
    return result;
  }, [v1Content, v2Content, isPreviewMode, diffLayout]);

  // Calculate Diff for Unified View
  const unifiedRows = useMemo(() => {
    if (isPreviewMode || diffLayout === 'split') return [];

    const diffs = diffLines(v1Content, v2Content);
    const result: UnifiedRow[] = [];
    
    let v1LineCounter = 1;
    let v2LineCounter = 1;

    diffs.forEach((part) => {
      const lines = part.value.replace(/\n$/, '').split('\n');
      lines.forEach(line => {
        if (part.added) {
          result.push({
            content: line,
            type: 'added',
            v2LineNumber: v2LineCounter++
          });
        } else if (part.removed) {
           result.push({
             content: line,
             type: 'removed',
             v1LineNumber: v1LineCounter++
           });
        } else {
           result.push({
             content: line,
             type: 'unchanged',
             v1LineNumber: v1LineCounter++,
             v2LineNumber: v2LineCounter++
           });
        }
      });
    });
    return result;
  }, [v1Content, v2Content, isPreviewMode, diffLayout]);

  // Scroll to highlight
  useEffect(() => {
    if (!isPreviewMode && highlightLines && scrollContainerRef.current) {
      let targetRowIndex = -1;
      
      if (diffLayout === 'split') {
        targetRowIndex = splitRows.findIndex(row => 
          row.right && row.right.lineNumber === highlightLines.start
        );
      } else {
        targetRowIndex = unifiedRows.findIndex(row => 
           row.type !== 'removed' && row.v2LineNumber === highlightLines.start
        );
      }

      if (targetRowIndex !== -1 && rowRefs.current[targetRowIndex]) {
        rowRefs.current[targetRowIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeChangeId, highlightLines, splitRows, unifiedRows, isPreviewMode, diffLayout]);

  return (
    <div className="h-full flex flex-col bg-white shadow-sm rounded-l-3xl overflow-hidden border-l border-slate-100/50">
       {/* Header */}
       {!isPreviewMode && (
         <div className="flex border-b border-slate-100 bg-white/80 backdrop-blur-md text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-20">
           {isDiffMode && diffLayout === 'split' && (
              <div className="w-1/2 py-3 px-6 border-r border-slate-100">{t.docHeaderV1}</div>
           )}
           <div className={`${isDiffMode && diffLayout === 'split' ? 'w-1/2' : 'w-full'} py-3 px-6 flex justify-between items-center`}>
              <span>{isDiffMode && diffLayout === 'unified' ? 'Unified View' : t.docHeaderV2}</span>
              
              <div className="flex items-center space-x-3">
                 {highlightLines && (
                    <span className="text-[10px] px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 shadow-sm transition-all">
                       {t.docFocus}: L{highlightLines.start}-{highlightLines.end}
                    </span>
                 )}
                 {isDiffMode && (
                   <div className="flex bg-slate-100/50 rounded-lg p-0.5 border border-slate-200">
                      <button 
                        onClick={() => onLayoutChange('split')}
                        className={`p-1.5 rounded-md transition-all ${diffLayout === 'split' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title={t.viewSplit}
                      >
                         <Columns className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onLayoutChange('unified')}
                        className={`p-1.5 rounded-md transition-all ${diffLayout === 'unified' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title={t.viewUnified}
                      >
                         <AlignJustify className="w-3.5 h-3.5" />
                      </button>
                   </div>
                 )}
              </div>
           </div>
         </div>
       )}

       {/* Scroller */}
       <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
         
         {isPreviewMode ? (
            <div className="markdown-body bg-white">
               <div dangerouslySetInnerHTML={{ __html: markdownHtml }} />
            </div>
         ) : (
            <div className="min-h-full py-4 font-mono text-xs md:text-[13px] leading-6">
              {/* SPLIT LAYOUT */}
              {diffLayout === 'split' && splitRows.map((row, index) => {
                const isSemanticHighlight = row.right && highlightLines && 
                  row.right.lineNumber >= highlightLines.start && 
                  row.right.lineNumber <= highlightLines.end;

                if (!isDiffMode && !row.right) return null;

                return (
                  <div 
                    key={index} 
                    ref={el => { if (rowRefs.current) rowRefs.current[index] = el; }}
                    className={`flex group transition-colors duration-200 ${isSemanticHighlight ? 'bg-[#F2F8FD]' : ''}`}
                  >
                    {isDiffMode && (
                      <div className={`w-1/2 flex border-r border-slate-100/80 relative
                        ${row.left?.type === 'removed' ? 'bg-[#FFF0F0]' : ''}
                      `}>
                         {row.left ? (
                           <>
                             <div className="w-12 text-right pr-4 py-0.5 text-slate-300 select-none text-[10px] flex-shrink-0">
                               {row.left.lineNumber}
                             </div>
                             <div className={`flex-1 pl-4 py-0.5 whitespace-pre-wrap break-words font-medium
                               ${row.left.type === 'removed' ? 'text-red-900/70 line-through decoration-red-300' : 'text-slate-500'}
                             `}>
                               {row.left.content || ' '}
                             </div>
                           </>
                         ) : (
                            <div className="w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMmYyZjIiLz4KPC9zdmc+')] opacity-60"></div>
                         )}
                      </div>
                    )}

                    <div className={`${isDiffMode ? 'w-1/2' : 'w-full'} flex relative transition-colors duration-300
                      ${isDiffMode && row.right?.type === 'added' ? 'bg-[#F0FFF4]' : ''}
                    `}>
                       {isSemanticHighlight && (
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0071e3] z-10 shadow-[0_0_12px_rgba(0,113,227,0.4)]"></div>
                       )}

                       {row.right ? (
                         <>
                            <div className={`w-12 text-right pr-4 py-0.5 select-none text-[10px] flex-shrink-0 transition-colors
                              ${isSemanticHighlight ? 'text-[#0071e3] font-bold' : 'text-slate-300'}
                            `}>
                             {row.right.lineNumber}
                           </div>
                           <div className={`flex-1 pl-4 py-0.5 whitespace-pre-wrap break-words font-medium
                             ${isDiffMode && row.right.type === 'added' ? 'text-green-800' : 
                               isSemanticHighlight ? 'text-slate-900' : 'text-slate-600'}
                           `}>
                             {row.right.content || ' '}
                           </div>
                         </>
                       ) : (
                          <div className="w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMmYyZjIiLz4KPC9zdmc+')] opacity-60"></div>
                       )}
                    </div>
                  </div>
                );
              })}
              
              {/* UNIFIED LAYOUT */}
              {diffLayout === 'unified' && unifiedRows.map((row, index) => {
                 const isSemanticHighlight = row.v2LineNumber && highlightLines && 
                   row.v2LineNumber >= highlightLines.start && 
                   row.v2LineNumber <= highlightLines.end;
                 
                 // If not in Diff Mode, we filter out removed lines to just show the "Result" 
                 // (though typically we fallback to Split for Edit mode, but let's support it)
                 if (!isDiffMode && row.type === 'removed') return null;

                 return (
                   <div 
                     key={index}
                     ref={el => { if (rowRefs.current) rowRefs.current[index] = el; }}
                     className={`flex border-b border-slate-50 relative
                       ${row.type === 'added' ? 'bg-[#F0FFF4]' : row.type === 'removed' ? 'bg-[#FFF0F0]' : isSemanticHighlight ? 'bg-[#F2F8FD]' : 'bg-white'}
                     `}
                   >
                     {isSemanticHighlight && (
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0071e3] z-10 shadow-[0_0_12px_rgba(0,113,227,0.4)]"></div>
                     )}
                     
                     {/* Line Number V1 */}
                     <div className="w-12 text-right pr-2 py-0.5 text-slate-300 select-none text-[10px] border-r border-slate-100/50">
                       {row.v1LineNumber || ''}
                     </div>
                     
                     {/* Line Number V2 */}
                     <div className={`w-12 text-right pr-4 py-0.5 select-none text-[10px] border-r border-slate-100/50
                        ${isSemanticHighlight && row.v2LineNumber ? 'text-[#0071e3] font-bold' : 'text-slate-300'}
                     `}>
                       {row.v2LineNumber || ''}
                     </div>

                     {/* Content */}
                     <div className={`flex-1 pl-4 py-0.5 whitespace-pre-wrap break-words font-medium
                        ${row.type === 'added' ? 'text-green-800' : row.type === 'removed' ? 'text-red-900/70 line-through' : 'text-slate-600'}
                        ${isSemanticHighlight && row.type !== 'removed' ? 'text-slate-900' : ''}
                     `}>
                        {row.content || ' '}
                     </div>
                   </div>
                 );
              })}

              <div className="h-32"></div>
            </div>
         )}
       </div>
    </div>
  );
};