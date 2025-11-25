import React, { useState, useEffect } from 'react';
import { X, Github, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { GithubConfig, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Button } from './Button';
import { validateGithubToken } from '../services/githubService';

interface GithubModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: GithubConfig;
  onSave: (token: string, config: GithubConfig) => void;
  lang: Language;
}

export const GithubModal: React.FC<GithubModalProps> = ({ isOpen, onClose, config, onSave, lang }) => {
  const t = TRANSLATIONS[lang];
  
  // Local state form
  const [token, setToken] = useState('');
  const [ownerRepo, setOwnerRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [path, setPath] = useState('');
  
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial values
  useEffect(() => {
    if (isOpen) {
      const storedToken = localStorage.getItem('smartdiff_gh_token');
      if (storedToken) setToken(storedToken);
      
      if (config) {
        setOwnerRepo(`${config.owner}/${config.repo}`);
        setBranch(config.branch);
        setPath(config.path);
      }
      setError(null);
    }
  }, [isOpen, config]);

  const handleSave = async () => {
    setError(null);
    setIsValidating(true);

    // 1. Basic validation
    if (!token.trim() || !ownerRepo.includes('/') || !path.trim()) {
      setError("Please fill in all fields correctly.");
      setIsValidating(false);
      return;
    }

    // 2. Validate Token
    const isValid = await validateGithubToken(token);
    if (!isValid) {
      setError("Invalid GitHub Token.");
      setIsValidating(false);
      return;
    }

    // 3. Save
    const [owner, repo] = ownerRepo.split('/');
    const newConfig: GithubConfig = {
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim(),
      path: path.trim()
    };

    localStorage.setItem('smartdiff_gh_token', token);
    onSave(token, newConfig);
    setIsValidating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/50">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <div className="bg-slate-900 text-white p-2 rounded-xl">
            <Github className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.githubModalTitle}</h3>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.githubTokenLabel}</label>
            <input 
              type="password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#0071e3] outline-none transition-all"
              placeholder="ghp_xxxxxxxxxxxx"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">Token is stored locally in your browser.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.githubRepoLabel}</label>
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#0071e3] outline-none transition-all"
              placeholder="facebook/react"
              value={ownerRepo}
              onChange={e => setOwnerRepo(e.target.value)}
            />
          </div>

          <div className="flex space-x-4">
             <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.githubBranchLabel}</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#0071e3] outline-none transition-all"
                  placeholder="main"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                />
             </div>
             <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.githubPathLabel}</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#0071e3] outline-none transition-all"
                  placeholder="docs/README.md"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                />
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
           <Button 
             onClick={handleSave} 
             isLoading={isValidating}
             className="w-full justify-center bg-slate-900 hover:bg-black text-white"
             icon={<Save className="w-4 h-4" />}
           >
             {t.githubSave}
           </Button>
        </div>
      </div>
    </div>
  );
};