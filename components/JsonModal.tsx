import React from 'react';
import { X, Copy, Check, Code2 } from 'lucide-react';
import { AnalysisResult, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResult;
  lang: Language;
}

export const JsonModal: React.FC<JsonModalProps> = ({ isOpen, onClose, data, lang }) => {
  const [copied, setCopied] = React.useState(false);
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-[#1e1e1e] text-slate-300 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Code2 className="w-5 h-5 mr-3 text-[#0071e3]" />
            {t.jsonModalTitle}
          </h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleCopy}
              className="px-3 py-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white flex items-center space-x-2"
              title={t.jsonCopy}
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-wider">{copied ? t.jsonCopied : t.jsonCopy}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-[#1e1e1e] custom-scrollbar">
          <pre className="font-mono text-[13px] leading-relaxed text-[#a6accd]">
            <code dangerouslySetInnerHTML={{ 
              __html: JSON.stringify(data, null, 2)
                .replace(/"key":/g, '<span class="text-[#89ddff]">"key":</span>')
                .replace(/"string"/g, '<span class="text-[#c3e88d]">"string"</span>') 
                // Basic syntax highlighting shim
            }} />
             {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 border-t border-white/10 bg-[#1e1e1e] rounded-b-2xl text-[11px] font-medium text-slate-500 flex justify-between items-center uppercase tracking-wider">
          <span>{t.jsonSchemaVersion}</span>
          <span>{t.jsonGeneratedBy}</span>
        </div>
      </div>
    </div>
  );
};