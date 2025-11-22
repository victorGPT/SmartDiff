import React, { useState, useEffect } from 'react';
import { X, Target, BrainCircuit, CheckCircle2, ListChecks, Edit3, Sparkles as SparklesIcon, Cpu } from 'lucide-react';
import { PatchPlan, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Button } from './Button';

interface PatchPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetVersion: string) => void;
  plan: PatchPlan | null;
  lang: Language;
  isGenerating: boolean;
}

export const PatchPreviewModal: React.FC<PatchPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  plan, 
  lang,
  isGenerating
}) => {
  const t = TRANSLATIONS[lang];
  const [versionInput, setVersionInput] = useState('');

  useEffect(() => {
    if (plan) {
      setVersionInput(plan.proposedVersion);
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/50">
        
        {/* Header */}
        <div className="p-8 pb-4 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <div className="p-3 bg-blue-100 rounded-2xl text-[#0071e3]">
                    <SparklesIcon className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{t.patchPreviewTitle}</h3>
                    <p className="text-slate-500 text-sm font-medium">{t.patchPreviewDesc}</p>
                 </div>
              </div>
          </div>
        </div>
        
        {/* Content Scrollable Area */}
        <div className="px-8 py-4 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          {/* Version Proposal Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
             <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                   <Edit3 className="w-3 h-3 mr-2" />
                   {t.patchVersionTitle}
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border shadow-sm
                  ${plan.bumpType === 'Major' ? 'bg-red-50 text-red-600 border-red-100' : 
                    plan.bumpType === 'Minor' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                    'bg-green-50 text-green-600 border-green-100'}`}>
                  {plan.bumpType} Update
                </span>
             </div>
             <div className="relative">
               <input 
                 type="text" 
                 value={versionInput}
                 onChange={(e) => setVersionInput(e.target.value)}
                 className="w-full p-4 text-2xl font-bold text-slate-900 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all text-center"
               />
               <span className="absolute top-0 left-0 h-full flex items-center pl-4 text-slate-400 font-bold text-lg pointer-events-none">v</span>
             </div>
          </div>

          {/* Actions List */}
          <div>
             <div className="flex items-center mb-4">
               <ListChecks className="w-5 h-5 text-slate-900 mr-2" />
               <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{t.patchActionsTitle}</h4>
             </div>
             
             <div className="space-y-4">
               {plan.actions.map((action, idx) => (
                 <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                       <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-wide">
                         {action.targetSectionHeader}
                       </div>
                       <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg
                         ${action.operation === 'delete' ? 'bg-red-50 text-red-600' : 
                           action.operation === 'replace' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}
                       `}>
                         {action.operation}
                       </div>
                    </div>
                    <p className="text-base font-medium text-slate-800 mb-2 leading-relaxed">
                      {action.description}
                    </p>
                    <div className="text-sm text-slate-500 flex items-start">
                      <BrainCircuit className="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                      <span className="italic">{action.reason}</span>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Overall Summary */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
             <p className="text-sm text-slate-600 leading-relaxed font-medium">
               {plan.summary}
             </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center flex-shrink-0">
           {/* Token Info */}
           <div className="hidden sm:flex items-center text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
              <Cpu className="w-3 h-3 mr-1.5 text-slate-400" />
              <span>{plan.usage?.totalTokens || 0} Tokens</span>
           </div>

          <div className="flex space-x-4 ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={isGenerating} className="text-slate-500">
              {t.btnCancel}
            </Button>
            <Button 
              onClick={() => onConfirm(versionInput)} 
              isLoading={isGenerating}
              className="bg-[#0071e3] hover:bg-[#0077ED] text-white px-8"
              icon={<CheckCircle2 className="w-4 h-4"/>}
            >
              {t.btnConfirmPatch}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};