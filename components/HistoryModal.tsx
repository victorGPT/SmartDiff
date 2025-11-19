import React, { useEffect, useState } from 'react';
import { Clock, RotateCcw, X, Search, Trash2, Filter } from 'lucide-react';
import { HistoryRecord, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Button } from './Button';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (record: HistoryRecord) => void;
  lang: Language;
  currentDocTitle?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onRestore, lang, currentDocTitle }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const t = TRANSLATIONS[lang];

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('smartdiff_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by timestamp desc
        setHistory(parsed.sort((a: HistoryRecord, b: HistoryRecord) => b.timestamp - a.timestamp));
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error("Failed to load history", e);
      setHistory([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      // Auto-filter if currentDocTitle is available
      if (currentDocTitle) {
        setSearchTerm(currentDocTitle);
      } else {
        setSearchTerm('');
      }
    }
  }, [isOpen, currentDocTitle]);

  const handleClearHistory = () => {
    if (window.confirm(t.historyConfirmClear)) {
      localStorage.removeItem('smartdiff_history');
      setHistory([]);
    }
  };

  // Filter logic
  const filteredHistory = history.filter(record => {
    const term = searchTerm.toLowerCase();
    return (
      record.docTitle.toLowerCase().includes(term) ||
      record.version.toLowerCase().includes(term) ||
      record.summary.toLowerCase().includes(term)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-300 border border-white/50">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex-shrink-0 bg-white/80 backdrop-blur rounded-t-[32px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
               <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                  <Clock className="w-5 h-5" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 tracking-tight">{t.historyModalTitle}</h3>
            </div>
            <div className="flex items-center space-x-2">
              {history.length > 0 && (
                 <button 
                   onClick={handleClearHistory}
                   className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500"
                   title={t.btnHistoryClear}
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              )}
              <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search / Filter */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#0071e3]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border-0 bg-slate-100/50 rounded-xl text-slate-900 shadow-inner ring-1 ring-transparent placeholder:text-slate-400 focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all sm:text-sm"
              placeholder={t.historySearchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {currentDocTitle && searchTerm === currentDocTitle && (
            <div className="mt-2 flex items-center text-xs text-[#0071e3] font-medium">
              <Filter className="w-3 h-3 mr-1" />
              {t.historyFilterCurrent}: "{currentDocTitle}"
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#F5F5F7]">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              {t.historyEmpty}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
               No matches found for "{searchTerm}"
            </div>
          ) : (
            filteredHistory.map((record) => (
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