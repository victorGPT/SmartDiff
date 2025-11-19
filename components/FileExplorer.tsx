import React, { useState } from 'react';
import { Folder, SmartDocument, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { FolderPlus, FilePlus2, ChevronRight, ChevronDown, Folder as FolderIcon, FileText, MoreVertical, Trash2, Edit2, Plus } from 'lucide-react';

interface FileExplorerProps {
  folders: Folder[];
  documents: SmartDocument[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateFolder: () => void;
  onCreateDoc: (folderId: string | null) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onRenameDoc: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  lang: Language;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  folders,
  documents,
  activeDocId,
  onSelectDoc,
  onCreateFolder,
  onCreateDoc,
  onRenameFolder,
  onRenameDoc,
  onDeleteFolder,
  onDeleteDoc,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(folders.map(f => f.id))); // Default expand all
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedFolders(newSet);
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEditing = (id: string, isFolder: boolean) => {
    if (editName.trim()) {
      if (isFolder) onRenameFolder(id, editName);
      else onRenameDoc(id, editName);
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, isFolder: boolean) => {
    if (e.key === 'Enter') saveEditing(id, isFolder);
    if (e.key === 'Escape') setEditingId(null);
  };

  // Get docs in root (no folder)
  const rootDocs = documents.filter(d => !d.folderId);

  // Render Item
  const renderItem = (id: string, name: string, isActive: boolean, isFolder: boolean, folderId: string | null = null) => {
    const isEditing = editingId === id;

    return (
      <div 
        className={`group flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors mb-0.5
          ${isActive ? 'bg-blue-100/50 text-[#0071e3]' : 'hover:bg-slate-100 text-slate-600'}
        `}
        onClick={() => {
            if (isFolder) toggleFolder(id);
            else onSelectDoc(id);
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
           <span className="mr-2 text-slate-400 flex-shrink-0">
             {isFolder ? (
                expandedFolders.has(id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
             ) : (
                <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-[#0071e3]' : 'text-slate-400'}`} />
             )}
           </span>
           
           {isEditing ? (
             <input 
               autoFocus
               className="w-full bg-white border border-[#0071e3] rounded px-1 py-0.5 text-xs outline-none"
               value={editName}
               onChange={e => setEditName(e.target.value)}
               onBlur={() => saveEditing(id, isFolder)}
               onKeyDown={e => handleKeyDown(e, id, isFolder)}
               onClick={e => e.stopPropagation()}
             />
           ) : (
             <span className={`text-xs font-medium truncate ${isActive ? 'font-bold' : ''}`}>{name}</span>
           )}
        </div>

        {/* Actions (visible on hover) */}
        {!isEditing && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isFolder && (
              <button 
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                onClick={(e) => { e.stopPropagation(); onCreateDoc(id); }}
                title={t.feNewFile}
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            <button 
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
              onClick={(e) => { e.stopPropagation(); startEditing(id, name); }}
              title={t.feRename}
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button 
              className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (window.confirm(isFolder ? t.feDeleteFolderConfirm : t.feDeleteFileConfirm)) {
                    isFolder ? onDeleteFolder(id) : onDeleteDoc(id);
                }
              }}
              title={t.feDelete}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-r border-slate-200/60 w-64 flex-shrink-0">
       <div className="p-4 border-b border-slate-100 flex items-center justify-between">
         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.fileExplorerTitle}</h3>
         <div className="flex space-x-1">
           <button onClick={onCreateFolder} className="p-1.5 hover:bg-slate-200 rounded text-slate-500" title={t.feNewFolder}>
             <FolderPlus className="w-4 h-4" />
           </button>
           <button onClick={() => onCreateDoc(null)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500" title={t.feNewFile}>
             <FilePlus2 className="w-4 h-4" />
           </button>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {/* Folders */}
          {folders.map(folder => (
            <div key={folder.id} className="mb-1">
               {renderItem(folder.id, folder.name, false, true)}
               
               {/* Folder Children */}
               {expandedFolders.has(folder.id) && (
                 <div className="ml-3 pl-2 border-l border-slate-200/60">
                    {documents.filter(d => d.folderId === folder.id).map(doc => (
                       <div key={doc.id}>
                         {renderItem(doc.id, doc.title || t.feUntitledDoc, activeDocId === doc.id, false, folder.id)}
                       </div>
                    ))}
                 </div>
               )}
            </div>
          ))}

          {/* Root Files */}
          {rootDocs.map(doc => (
            <div key={doc.id}>
              {renderItem(doc.id, doc.title || t.feUntitledDoc, activeDocId === doc.id, false)}
            </div>
          ))}

          {folders.length === 0 && rootDocs.length === 0 && (
             <div className="text-center py-8 text-xs text-slate-400">
               {t.feEmpty}
             </div>
          )}
       </div>
    </div>
  );
};