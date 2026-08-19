import type { Message as _Message, ProjectFiles as _ProjectFiles } from "../lib/generator";

export type {
  ProjectFiles,
  ContentPart,
  Message,
  ToolCall,
  ToolDefinition,
  FileChange,
  GenerateResult,
  GeneratorOptions,
  GeneratorEvents,
} from "../lib/generator";

export type { AISettings, WebSearchSettings, AssetSearchSettings } from "../store/settings";
export type { OpenAIClientConfig } from "../lib/client";
export type { ApiType } from "../lib/ai-provider";

// ─── Chat UI types ────────────────────────────────────────────────────────────

/** Attachment in the input pipeline (before sending) */
export interface Attachment {
  type: "file" | "image";
  name: string;
  /** DataURL for images/PDFs, plain text for text files */
  content: string;
  /** Original file size in bytes */
  size: number;
}

/** Element picked from the live preview for targeted AI edits */
export interface PreviewElementSelection {
  id: string;
  tag: string;
  selector: string;
  classes: string[];
  text?: string;
  idAttr?: string;
  href?: string;
  src?: string;
}

export interface TextBlock {
  type: "text";
  content: string;
  id: string;
}

export interface ImageBlock {
  type: "image";
  url: string;
  filename?: string;
  id: string;
}

export interface FileBlock {
  type: "file";
  name: string;
  content: string;
  /** Original file size in bytes */
  size: number;
  id: string;
}

export interface ElementBlock {
  type: "element";
  tag: string;
  selector: string;
  classes: string[];
  text?: string;
  idAttr?: string;
  id: string;
}

export interface ThinkingBlock {
  type: "thinking";
  content: string;
  id: string;
}

export interface ToolBlock {
  type: "tool";
  toolName: string;
  title: string;
  path: string;
  paths?: string[];
  result: string;
  id: string;
}

export type Block = TextBlock | ImageBlock | FileBlock | ElementBlock | ThinkingBlock | ToolBlock;

export interface MergedMessage {
  role: "user" | "assistant";
  blocks: Block[];
  id: string;
}

// ─── Snapshot types ─────────────────────────────────────────────────────────

/** Incremental project snapshot (git-like) */
export interface ProjectSnapshot {
  id: string;
  /** The conversation this snapshot belongs to */
  conversationId: string;
  /** Associated MergedMessage ID (e.g. "assistant-0") */
  messageId: string;
  /** File path → unified diff patch (modified files only) */
  patches: Record<string, string>;
  /** Newly added files: path → full content */
  addedFiles: Record<string, string>;
  /** Paths of deleted files */
  deletedFiles: string[];
  createdAt: number;
}

// ─── Memory types ───────────────────────────────────────────────────────────

export interface MemoryItem {
  id: string;
  content: string;
  category: "preference" | "personal_info" | "instruction" | "fact" | "project";
  createdAt: number;
  updatedAt: number;
}

export interface MemoryOperation {
  action: "add" | "update" | "delete";
  /** Required for update and delete */
  id?: string;
  /** Required for add and update */
  content?: string;
  /** Required for add, optional for update */
  category?: MemoryItem["category"];
}

// ─── Conversation types ──────────────────────────────────────────────────────

/** Compressed context: summary text + the message index where compression starts */
export interface CompressedContext {
  summary: string;
  fromIndex: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: _Message[];
  files: _ProjectFiles;
  template: string;
  isProjectInitialized: boolean;
  compressedContext?: CompressedContext;
  /** Convex site record for this chat's deploy target */
  siteId?: string;
  /** Live URL after deploy (https://{slug}.site.sharepad.in) */
  deployedUrl?: string;
  pinned?: boolean;
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
}
