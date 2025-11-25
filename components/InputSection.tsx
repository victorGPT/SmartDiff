import React from 'react';
import { Language, AppMode, AnalysisPersona } from '../types';
import { TRANSLATIONS } from '../constants';
import { Layers, Sparkles, FileText, Users } from 'lucide-react';

interface InputSectionProps {
  docTitle: string;
  onTitleChange: (val: string) => void;
  v1: string;
  v2: string;
  patchText: string;
  onV1Change: (val: string) => void;
  onV2Change: (val: string) => void;
  onPatchChange: (val: string) => void;
  isAnalyzing: boolean;
  lang: Language;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  persona: AnalysisPersona;
  onPersonaChange: (p: AnalysisPersona) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  docTitle,
  onTitleChange,
  v1, 
  v2, 
  patchText,
  onV1Change, 
  onV2Change, 
  onPatchChange,
  isAnalyzing, 
  lang,
  mode,
  onModeChange,
  persona,
  onPersonaChange
}) => {
  const t = TRANSLATIONS[lang];
  
  return (
    <div className="flex flex-col h-full w-full">
      
      {/* Header Row: Mode Switcher and Title Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6 flex-shrink-0">
        
        {/* iOS Segmented Control & Persona Group */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="bg-slate-200/60 p-1 rounded-lg inline-flex relative shadow-inner flex-shrink-0 self-start md:self-auto">
            <div 
              className={`absolute top-1 bottom-1 rounded-md bg-white shadow-sm transition-all duration-300 ease-out
                ${mode === 'global' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+0px)] w-[calc(50%-4px)]'}
              `}
            ></div>
            <button
              onClick={() => onModeChange('global')}
              disabled={isAnalyzing}
              className={`relative px-6 py-1.5 text-sm font-medium rounded-md z-10 transition-colors flex items-center justify-center
                ${mode === 'global' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Layers className="w-4 h-4 mr-2" />
              {t.modeGlobal}
            </button>
            <button
              onClick={() => onModeChange('patch')}
              disabled={isAnalyzing}
              className={`relative px-6 py-1.5 text-sm font-medium rounded-md z-10 transition-colors flex items-center justify-center
                ${mode === 'patch' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t.modePatch}
            </button>
          </div>

          {/* Persona Selector */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-4 w-4 text-slate-400 group-focus-within:text-[#0071e3] transition-colors" />
            </div>
            <select
              value={persona}
              onChange={(e) => onPersonaChange(e.target.value as AnalysisPersona)}
              className="block w-full sm:w-48 pl-10 pr-8 py-2 border-0 bg-white rounded-lg text-sm text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#0071e3] cursor-pointer outline-none appearance-none font-medium h-full"
              disabled={isAnalyzing}
            >
              <option value="general">{t.personaGeneral}</option>
              <option value="developer">{t.personaDeveloper}</option>
              <option value="executive">{t.personaExecutive}</option>
              <option value="public">{t.personaPublic}</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Document Title Input */}
        <div className="flex-1 w-full md:w-auto">
           <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-[#0071e3] transition-colors" />
             </div>
             <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border-0 bg-white rounded-xl text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#0071e3] sm:text-sm sm:leading-6 transition-all"
                placeholder={t.placeholderDocTitle}
                value={docTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                disabled={isAnalyzing}
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left: V1 Input */}
        <div className="flex flex-col h-full group min-h-[300px]">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center pl-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></span>
            {t.labelV1}
          </label>
          <div className="flex-1 relative rounded-2xl shadow-sm bg-white ring-1 ring-slate-200 transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-[#0071e3]/50 group-focus-within:shadow-lg overflow-hidden">
             <textarea
               className="absolute inset-0 w-full h-full p-6 bg-transparent border-0 text-sm font-mono text-slate-600 focus:ring-0 resize-none leading-relaxed placeholder:text-slate-300 custom-scrollbar"
               placeholder={t.placeholderV1}
               value={v1}
               onChange={(e) => onV1Change(e.target.value)}
               disabled={isAnalyzing}
             />
          </div>
        </div>

        {/* Right: Dynamic Input */}
        <div className="flex flex-col h-full group min-h-[300px]">
          <label className={`block text-xs font-bold uppercase tracking-wider mb-3 flex items-center pl-1 transition-colors flex-shrink-0
            ${mode === 'patch' ? 'text-[#0071e3]' : 'text-slate-400'}
          `}>
             <span className={`w-1.5 h-1.5 rounded-full mr-2 ${mode === 'patch' ? 'bg-[#0071e3]' : 'bg-[#0071e3]'}`}></span>
             {mode === 'patch' ? t.labelPatch : t.labelV2}
          </label>
          
          <div className={`flex-1 relative rounded-2xl shadow-sm bg-white ring-1 transition-all duration-300 group-focus-within:shadow-lg overflow-hidden
              ${mode === 'patch' 
                ? 'ring-blue-100 group-focus-within:ring-2 group-focus-within:ring-[#0071e3]/50' 
                : 'ring-slate-200 group-focus-within:ring-2 group-focus-within:ring-[#0071e3]/50'
              }
            `}>
            <textarea
              className={`absolute inset-0 w-full h-full p-6 bg-transparent border-0 text-sm font-mono focus:ring-0 resize-none leading-relaxed custom-scrollbar
                ${mode === 'patch' 
                  ? 'text-slate-900 placeholder:text-blue-200' 
                  : 'text-slate-900 placeholder:text-slate-300'
                }
              `}
              placeholder={mode === 'patch' ? t.placeholderPatch : t.placeholderV2}
              value={mode === 'patch' ? patchText : v2}
              onChange={(e) => mode === 'patch' ? onPatchChange(e.target.value) : onV2Change(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};