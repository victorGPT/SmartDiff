import { Folder, SmartDocument, HistoryRecord, GithubConfig } from '../types';

// Define the shape of our storage layer
// This allows us to swap 'localStorage' for 'vscode.workspace.fs' in the future.
export interface StorageAdapter {
  getFolders(): Folder[];
  saveFolders(folders: Folder[]): void;
  
  getDocuments(): SmartDocument[];
  saveDocuments(docs: SmartDocument[]): void;
  
  getActiveDocId(): string | null;
  saveActiveDocId(id: string | null): void;
  
  getHistory(): HistoryRecord[];
  saveHistory(history: HistoryRecord[]): void;
  clearHistory(): void;
  
  getGithubToken(): string | null;
  saveGithubToken(token: string): void;
  
  // Migration helpers
  getLegacyItem(key: string): string | null;
}

class BrowserStorage implements StorageAdapter {
  private KEYS = {
    FOLDERS: 'smartdiff_folders',
    DOCUMENTS: 'smartdiff_documents',
    ACTIVE_ID: 'smartdiff_active_id',
    HISTORY: 'smartdiff_history',
    GH_TOKEN: 'smartdiff_gh_token'
  };

  getFolders(): Folder[] {
    const data = localStorage.getItem(this.KEYS.FOLDERS);
    return data ? JSON.parse(data) : [];
  }

  saveFolders(folders: Folder[]): void {
    localStorage.setItem(this.KEYS.FOLDERS, JSON.stringify(folders));
  }

  getDocuments(): SmartDocument[] {
    const data = localStorage.getItem(this.KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : [];
  }

  saveDocuments(docs: SmartDocument[]): void {
    localStorage.setItem(this.KEYS.DOCUMENTS, JSON.stringify(docs));
  }

  getActiveDocId(): string | null {
    return localStorage.getItem(this.KEYS.ACTIVE_ID);
  }

  saveActiveDocId(id: string | null): void {
    if (id) {
      localStorage.setItem(this.KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(this.KEYS.ACTIVE_ID);
    }
  }

  getHistory(): HistoryRecord[] {
    const data = localStorage.getItem(this.KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  }

  saveHistory(history: HistoryRecord[]): void {
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
  }

  clearHistory(): void {
    localStorage.removeItem(this.KEYS.HISTORY);
  }

  getGithubToken(): string | null {
    return localStorage.getItem(this.KEYS.GH_TOKEN);
  }

  saveGithubToken(token: string): void {
    localStorage.setItem(this.KEYS.GH_TOKEN, token);
  }

  getLegacyItem(key: string): string | null {
    return localStorage.getItem(key);
  }
}

export const storage = new BrowserStorage();