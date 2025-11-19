import React, { useRef, useEffect, useMemo } from 'react';
import { diffLines } from 'diff';
import { marked } from 'marked';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface DocumentViewProps {
  v1Content: string;
  v2Content: string;
  activeChangeId: string | null;
  highlightLines: { start: number; end: number } | null;
  viewMode: 'edit' | 'diff' | 'preview';
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

export const DocumentView: React.FC<DocumentViewProps> = ({ 
  v1Content, 
  v2Content, 
  activeChangeId, 
  highlightLines,
  viewMode,
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
    // Simple synchronous parse assuming no async extensions
    return marked.parse(v2Content, { gfm: true, breaks: true }) as string;
  }, [v2Content, isPreviewMode]);

  // Calculate Diff and structure into rows
  const rows = useMemo(() => {
    if (isPreviewMode) return []; // Skip diff calculation in preview mode

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
  }, [v1Content, v2Content, isPreviewMode]);

  // Scroll to the specific line in V2 when a card is clicked
  useEffect(() => {
    if (!isPreviewMode && highlightLines && scrollContainerRef.current) {
      // Find the row index where the right side matches the start line
      const targetRowIndex = rows.findIndex(row => 
        row.right && row.right.lineNumber === highlightLines.start
      );

      if (targetRowIndex !== -1 && rowRefs.current[targetRowIndex]) {
        rowRefs.current[targetRowIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeChangeId, highlightLines, rows, isPreviewMode]);

  return (
    <div className="h-full flex flex-col bg-white shadow-sm rounded-l-3xl overflow-hidden border-l border-slate-100/50">
       {/* Header for columns (Hidden in Preview Mode) */}
       {!isPreviewMode && (
         <div className="flex border-b border-slate-100 bg-white/80 backdrop-blur-md text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-20">
           {isDiffMode && (
              <div className="w-1/2 py-3 px-6 border-r border-slate-100">{t.docHeaderV1}</div>
           )}
           <div className={`${isDiffMode ? 'w-1/2' : 'w-full'} py-3 px-6 flex justify-between items-center`}>
              <span>{t.docHeaderV2}</span>
              {highlightLines && (
                <span className="text-[10px] px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 shadow-sm transition-all">
                   {t.docFocus}: L{highlightLines.start}-{highlightLines.end}
                </span>
              )}
           </div>
         </div>
       )}

       {/* Scroller */}
       <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
         
         {isPreviewMode ? (
            // PREVIEW MODE - Using github-markdown-css class
            <div className="markdown-body bg-white">
               <div dangerouslySetInnerHTML={{ __html: markdownHtml }} />
            </div>
         ) : (
            // EDITOR / DIFF MODE
            <div className="min-h-full py-4 font-mono text-xs md:text-[13px] leading-6">
              {rows.map((row, index) => {
                // Semantic Highlight Logic
                const isSemanticHighlight = row.right && highlightLines && 
                  row.right.lineNumber >= highlightLines.start && 
                  row.right.lineNumber <= highlightLines.end;

                // If NOT in diff mode, we only render rows that have V2 content (right)
                if (!isDiffMode && !row.right) return null;

                return (
                  <div 
                    key={index} 
                    ref={el => { if (rowRefs.current) rowRefs.current[index] = el; }}
                    className={`flex group transition-colors duration-200
                      ${isSemanticHighlight ? 'bg-[#F2F8FD]' : ''}
                    `}
                  >
                    {/* LEFT COLUMN (V1) - Only visible in Diff Mode */}
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
                           // Empty placeholder pattern
                            <div className="w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMmYyZjIiLz4KPC9zdmc+')] opacity-60"></div>
                         )}
                      </div>
                    )}

                    {/* RIGHT COLUMN (V2) - Always visible, width adjusts */}
                    <div className={`${isDiffMode ? 'w-1/2' : 'w-full'} flex relative transition-colors duration-300
                      ${isDiffMode && row.right?.type === 'added' ? 'bg-[#F0FFF4]' : ''}
                    `}>
                       {/* Semantic Highlight Indicator Bar */}
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
              {/* Padding at bottom */}
              <div className="h-32"></div>
            </div>
         )}
       </div>
    </div>
  );
};