import React, { useEffect, useState } from 'react';
import { Clock, RotateCcw, X, ArrowRight } from 'lucide-react';
import { HistoryRecord, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Button } from './Button';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (record: HistoryRecord) => void;
  lang: Language;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onRestore, lang }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('smartdiff_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Sort by timestamp desc
          setHistory(parsed.sort((a: HistoryRecord, b: HistoryRecord) => b.timestamp - a.timestamp));
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-300 border border-white/50">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white/80 backdrop-blur">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                <Clock className="w-5 h-5" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 tracking-tight">{t.historyModalTitle}</h3>
          </div>
          <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#F5F5F7]">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              {t.historyEmpty}
            </div>
          ) : (
            history.map((record) => (
              <div key={record.id} className="bg-white p-5 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all group">
                 <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-[#0071e3]">v{record.version}</span>
                      <span className="text-sm font-medium text-slate-900">{record.docTitle || 'Untitled'}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                 </div>
                 <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-2">
                   {record.summary}
                 </p>
                 <div className="flex justify-end">
                   <Button 
                     variant="secondary" 
                     onClick={() => {
                       if (window.confirm(t.restoreConfirm)) {
                         onRestore(record);
                         onClose();
                       }
                     }}
                     className="text-xs h-8 px-4 group-hover:border-indigo-200 group-hover:text-indigo-600"
                     icon={<RotateCcw className="w-3 h-3"/>}
                   >
                     {t.btnRestore}
                   </Button>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};