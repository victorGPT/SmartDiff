export enum ChangeType {
  Feat = 'feat',
  Fix = 'fix',
  Docs = 'docs',
  Refactor = 'refactor',
  Style = 'style',
  Perf = 'perf'
}

export type Language = 'zh' | 'en';
export type AppMode = 'global' | 'patch';

// New: Define target audience for the analysis
export type AnalysisPersona = 'general' | 'developer' | 'executive' | 'public';

export interface TokenUsage {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ChangeItem {
  id: string;
  type: ChangeType;
  title: string;
  description: string;
  lines: {
    start: number;
    end: number;
  };
}

export interface AnalysisResult {
  version: string; // The new calculated semantic version (e.g., 1.1.0)
  previousVersion: string;
  bumpType: 'Major' | 'Minor' | 'Patch';
  summary: string;
  changes: ChangeItem[];
  usage?: TokenUsage;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface GithubConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export interface SmartDocument {
  id: string;
  folderId: string | null; // null if in root
  title: string;
  v1: string;
  v2: string;
  patchText: string;
  mode: AppMode;
  persona: AnalysisPersona; // New: Save persona preference per doc
  createdAt: number;
  updatedAt: number;
  githubConfig?: GithubConfig;
}

export interface DocumentState {
  v1: string;
  v2: string;
}

export interface PatchAction {
  operation: 'insert' | 'replace' | 'delete';
  targetSectionHeader: string;
  description: string;
  reason: string;
}

export interface PatchPlan {
  actions: PatchAction[];
  proposedVersion: string;
  bumpType: 'Major' | 'Minor' | 'Patch';
  summary: string;
  usage?: TokenUsage;
}

export interface HistoryRecord {
  id: string;
  docId?: string; // Link to specific document
  timestamp: number; // Unix timestamp
  version: string;
  summary: string;
  fullContent: string; // The V2 content
  docTitle: string;
}