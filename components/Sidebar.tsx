import React from 'react';
import { AnalysisResult, ChangeType, Language } from '../types';
import { TYPE_COLORS, TRANSLATIONS } from '../constants';
import { ArrowUpCircle, CheckCircle2, FileText, Code, Terminal, Sparkles } from 'lucide-react';

interface SidebarProps {
  result: AnalysisResult;
  activeChangeId: string | null;
  onSelectChange: (id: string, startLine: number) => void;
  lang: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ result, activeChangeId, onSelectChange, lang }) => {
  const t = TRANSLATIONS[lang];

  const getIcon = (type: ChangeType) => {
    switch (type) {
      case ChangeType.Feat: return <Sparkles className="w-3.5 h-3.5" />;
      case ChangeType.Fix: return <CheckCircle2 className="w-3.5 h-3.5" />;
      case ChangeType.Docs: return <FileText className="w-3.5 h-3.5" />;
      case ChangeType.Refactor: return <Code className="w-3.5 h-3.5" />;
      default: return <Terminal className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7] border-r border-slate-200/60">
      {/* Header / Master Card */}
      <div className="p-5">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-sm line-through font-mono">v{result.previousVersion}</span>
              <span className="text-[#0071e3] font-bold text-3xl tracking-tight">v{result.version}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm
              ${result.bumpType === 'Major' ? 'bg-red-50 text-red-600 border-red-100' : 
                result.bumpType === 'Minor' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                'bg-green-50 text-green-600 border-green-100'}`}>
              {result.bumpType}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {result.summary}
          </p>
        </div>
      </div>

      {/* Change List */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3 custom-scrollbar">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2 sticky top-0 bg-[#F5F5F7] py-2 z-10 backdrop-blur-sm">
          {t.sidebarChangelog}
        </h3>
        
        {result.changes.map((change) => (
          <div
            key={change.id}
            onClick={() => onSelectChange(change.id, change.lines.start)}
            className={`group cursor-pointer rounded-2xl p-5 transition-all duration-300 relative
              ${activeChangeId === change.id 
                ? 'bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] ring-1 ring-[#0071e3] scale-[1.02] z-10' 
                : 'bg-white/60 hover:bg-white border border-transparent hover:shadow-md hover:scale-[1.01]'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${TYPE_COLORS[change.type]}`}>
                {getIcon(change.type)}
                <span>{change.type}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium">
                 L{change.lines.start}-{change.lines.end}
              </span>
            </div>
            
            <h4 className={`text-[15px] font-bold mb-1.5 leading-snug ${activeChangeId === change.id ? 'text-[#1d1d1f]' : 'text-slate-700'}`}>
              {change.title}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {change.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};