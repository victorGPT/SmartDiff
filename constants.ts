import { ChangeType, Language } from "./types";

export const SAMPLE_V1 = `# SmartDiff 产品需求文档 (V1.0)

## 简介
SmartDiff 是一个用于手动比对文本文件的工具。

## 功能列表
1. 上传文本文件。
2. 并排查看文件。
3. 高亮简单的差异。

## 技术栈
- jQuery
- Bootstrap
- PHP 后端`;

export const SAMPLE_V2 = `# SmartDiff 产品需求文档 (V1.1)

## 简介
SmartDiff 是一个 AI 驱动的文档版本管理工具，用于自动分析语义差异。

## 功能列表
1. 上传文本文件 (V1 和 V2)。
2. **AI 分析**: 自动生成更新日志和版本号。
3. **智能导航**: 点击左侧卡片，右侧自动滚动到对应位置。
4. JSON 导出：支持集成到 IDE。
5. **对比模式**: 支持一键开启/关闭新旧版本对比。

## 技术栈
- React
- Tailwind CSS
- Google Gemini API

## 定价策略
- 免费版: 每天 10 次分析
- 专业版: 无限制`;

export const TYPE_COLORS: Record<ChangeType, string> = {
  [ChangeType.Feat]: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100",
  [ChangeType.Fix]: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100",
  [ChangeType.Docs]: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100",
  [ChangeType.Refactor]: "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100",
  [ChangeType.Style]: "bg-pink-50 text-pink-700 border-pink-200 ring-1 ring-pink-100",
  [ChangeType.Perf]: "bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-100"
};

export const CHANGE_TYPE_DESCRIPTIONS: Record<Language, Record<string, string>> = {
  zh: {
    [ChangeType.Feat]: "新功能 (Features) - 引入了新的功能或特性",
    [ChangeType.Fix]: "修复 (Fixes) - 修复了 bug 或错误",
    [ChangeType.Docs]: "文档 (Documentation) - 仅修改了文档",
    [ChangeType.Refactor]: "重构 (Refactor) - 代码结构调整，不影响功能",
    [ChangeType.Style]: "样式 (Style) - 代码格式、UI 样式调整",
    [ChangeType.Perf]: "性能 (Performance) - 提升性能的修改"
  },
  en: {
    [ChangeType.Feat]: "Features - Introduced new features",
    [ChangeType.Fix]: "Fixes - Bug fixes",
    [ChangeType.Docs]: "Documentation - Documentation only changes",
    [ChangeType.Refactor]: "Refactor - Code change that neither fixes a bug nor adds a feature",
    [ChangeType.Style]: "Style - Changes that do not affect the meaning of the code (white-space, formatting, etc)",
    [ChangeType.Perf]: "Performance - A code change that improves performance"
  }
};

// Used to separate document content from appended history logs
export const HISTORY_MARKER = "<!-- 🛡️ SMARTDIFF HISTORY LOG 🛡️ -->";

// Invisible guide for AI IDEs (Cursor/Copilot) to find structured data
export const AI_GUIDE_COMMENT = '<!-- 🤖 SMARTDIFF_AI_GUIDE: For structured changes and version history, refer to the "Analysis JSON" section at the end of this file. -->';

export const TRANSLATIONS = {
  zh: {
    appTitle: "AI 自动化文档版本管理",
    beta: "Beta",
    inputModeTitle: "AI 自动化文档版本管理",
    inputModeDesc: "SmartDiff 使用 AI 识别语义变更，生成更新日志，并自动计算版本号。",
    labelV1: "旧版本 (V1)",
    placeholderV1: "在此粘贴原始文档...",
    labelV2: "新版本 (V2)",
    placeholderV2: "在此粘贴修改后的全量文档...",
    labelDocTitle: "文档标题",
    placeholderDocTitle: "输入或自动读取文档标题...",
    btnAnalyze: "开始分析",
    btnDiffShow: "对比",
    btnDiffHide: "退出对比",
    btnPreview: "预览",
    btnEdit: "源码",
    btnExport: "导出",
    btnShare: "分享",
    btnReset: "重置",
    btnLoadDemo: "加载示例",
    btnHistory: "历史记录",
    historyModalTitle: "时间机器 (Time Machine)",
    historyEmpty: "暂无历史记录。每次成功分析后会自动保存快照。",
    btnRestore: "回滚至此版本",
    restoreConfirm: "确认要将此版本加载到“旧版本 (V1)”输入框吗？当前未保存的内容将会丢失。",
    errorEmpty: "请同时提供 V1 和 V2 的内容。",
    errorPatchEmpty: "请提供 V1 内容和补丁片段。",
    errorApi: "分析失败，请检查 API Key 是否有效并重试。",
    sidebarVersion: "版本",
    sidebarUpdate: "更新",
    sidebarChangelog: "变更日志",
    docHeaderV1: "旧版本 (V1)",
    docHeaderV2: "新版本 (V2)",
    docFocus: "Focus",
    exportLegendTitle: "变更类型说明 (Change Types Legend)",
    exportNote: "备注",
    exportNoteContent: "所有更新和变动请查看 `### 结构化分析数据 (Analysis JSON)` 这一章节",
    exportMetaHeader: "SMARTDIFF AI METADATA\n此部分包含结构化版本数据，专为 AI 编程助手 (如 Cursor, Copilot) 设计。",
    exportSectionTitle: "结构化分析数据 (Analysis JSON)",
    jsonModalTitle: "结构化数据 (JSON)",
    jsonSchemaVersion: "Schema v1.0",
    jsonGeneratedBy: "由 SmartDiff AI 生成",
    jsonCopy: "复制",
    jsonCopied: "已复制",
    analysisPromptLang: "Simplified Chinese",
    tokenUsage: "Token 消耗",
    
    // Smart Patch specific
    modeGlobal: "全局更新",
    modePatch: "智能补丁",
    labelPatch: "补丁片段",
    placeholderPatch: "在此输入你想添加的一段话、一个功能描述或修正内容。AI 将自动帮你找到合适的位置插入...",
    btnPlanPatch: "生成补丁方案",
    patchPreviewTitle: "AI 补丁预演",
    patchPreviewDesc: "我分析了您的意图，计划进行以下修改。请确认版本号及操作。",
    patchPlanTarget: "目标章节",
    patchPlanOperation: "操作类型",
    patchPlanReason: "AI 思考链 (Reasoning)",
    patchVersionTitle: "版本建议",
    patchVersionLabel: "新版本号 (可修改)",
    patchActionsTitle: "执行计划清单",
    btnConfirmPatch: "确认并应用补丁",
    btnCancel: "取消",
    opInsert: "插入内容",
    opReplace: "替换内容",
    opDelete: "删除内容",

    // History
    btnHistoryClear: "清空历史",
    historySearchPlaceholder: "搜索历史记录...",
    historyFilterCurrent: "只显示当前文档",
    historyConfirmClear: "确定要清空所有历史记录吗？此操作无法撤销。",

    // File Explorer
    fileExplorerTitle: "资源管理器",
    feNewFolder: "新建项目",
    feNewFile: "新建文档",
    feUntitledDoc: "未命名文档",
    feUntitledFolder: "未命名项目",
    feRename: "重命名",
    feDelete: "删除",
    feDeleteFolderConfirm: "确定要删除此项目及其包含的所有文档吗？",
    feDeleteFileConfirm: "确定要删除此文档吗？",
    feEmpty: "暂无文件，请新建。",
    feDefaultProject: "默认项目",

    // Share
    shareModalTitle: "分享中心",
    shareTabSummary: "研发群通知",
    shareTabHtml: "交互式离线报告",
    shareSummaryDesc: "复制简洁的摘要，适合发送到 Slack、钉钉或 PR 描述。",
    shareHtmlDesc: "生成包含完整版本历史的单文件应用。支持离线查看任意版本对比。",
    btnCopySummary: "复制摘要",
    btnDownloadHtml: "下载 HTML 应用",
    summaryCopied: "已复制！"
  },
  en: {
    appTitle: "AI Automated Document Version Management",
    beta: "Beta",
    inputModeTitle: "AI Automated Document Version Management",
    inputModeDesc: "SmartDiff uses AI to identify semantic changes, generate changelogs, and automatically calculate version numbers.",
    labelV1: "Original (V1)",
    placeholderV1: "Paste original document here...",
    labelV2: "New Version (V2)",
    placeholderV2: "Paste updated document here...",
    labelDocTitle: "Document Title",
    placeholderDocTitle: "Enter or auto-detect document title...",
    btnAnalyze: "Start Analysis",
    btnDiffShow: "Diff",
    btnDiffHide: "Hide Diff",
    btnPreview: "Preview",
    btnEdit: "Source",
    btnExport: "Export",
    btnShare: "Share",
    btnReset: "Reset",
    btnLoadDemo: "Load Demo",
    btnHistory: "History",
    historyModalTitle: "Time Machine",
    historyEmpty: "No history yet. Snapshots are saved automatically after analysis.",
    btnRestore: "Restore this version",
    restoreConfirm: "Are you sure you want to load this version into 'Original (V1)'? Unsaved changes will be lost.",
    errorEmpty: "Please provide content for both V1 and V2.",
    errorPatchEmpty: "Please provide V1 content and the patch fragment.",
    errorApi: "Analysis failed. Please check your API Key and try again.",
    sidebarVersion: "Version",
    sidebarUpdate: "Update",
    sidebarChangelog: "Changelog",
    docHeaderV1: "Original (V1)",
    docHeaderV2: "New (V2)",
    docFocus: "Focus",
    exportLegendTitle: "Change Types Legend",
    exportNote: "Note",
    exportNoteContent: "For all updates and changes, please refer to the `### Analysis JSON` section.",
    exportMetaHeader: "SMARTDIFF AI METADATA\nThis section contains structured version data designed for AI coding assistants (e.g., Cursor, Copilot).",
    exportSectionTitle: "Analysis JSON",
    jsonModalTitle: "Structured Data (JSON)",
    jsonSchemaVersion: "Schema v1.0",
    jsonGeneratedBy: "Generated by SmartDiff AI",
    jsonCopy: "Copy",
    jsonCopied: "Copied",
    analysisPromptLang: "English",
    tokenUsage: "Token Usage",

    // Smart Patch specific
    modeGlobal: "Global Update",
    modePatch: "Smart Patch",
    labelPatch: "Patch Fragment",
    placeholderPatch: "Enter the text snippet, feature description, or fix you want to apply. AI will automatically find the best place to insert it...",
    btnPlanPatch: "Plan Patch",
    patchPreviewTitle: "AI Patch Preview",
    patchPreviewDesc: "I analyzed your intent and plan to make the following changes. Please verify version and actions.",
    patchPlanTarget: "Target Section",
    patchPlanOperation: "Operation",
    patchPlanReason: "Reasoning",
    patchVersionTitle: "Version Proposal",
    patchVersionLabel: "New Version (Editable)",
    patchActionsTitle: "Planned Actions",
    btnConfirmPatch: "Confirm & Apply",
    btnCancel: "Cancel",
    opInsert: "Insert",
    opReplace: "Replace",
    opDelete: "Delete",

    // History
    btnHistoryClear: "Clear History",
    historySearchPlaceholder: "Search history...",
    historyFilterCurrent: "Filter by current doc",
    historyConfirmClear: "Are you sure you want to clear all history? This cannot be undone.",

    // File Explorer
    fileExplorerTitle: "Explorer",
    feNewFolder: "New Project",
    feNewFile: "New Doc",
    feUntitledDoc: "Untitled Doc",
    feUntitledFolder: "Untitled Project",
    feRename: "Rename",
    feDelete: "Delete",
    feDeleteFolderConfirm: "Are you sure you want to delete this project and all its documents?",
    feDeleteFileConfirm: "Are you sure you want to delete this document?",
    feEmpty: "No files yet.",
    feDefaultProject: "Default Project",

    // Share
    shareModalTitle: "Share Center",
    shareTabSummary: "Team Update",
    shareTabHtml: "Interactive Report",
    shareSummaryDesc: "Formatted summary for Chat apps or PR descriptions.",
    shareHtmlDesc: "Generate a standalone Single Page App. Interactive history and diffing.",
    btnCopySummary: "Copy Summary",
    btnDownloadHtml: "Download HTML App",
    summaryCopied: "Copied!"
  }
};