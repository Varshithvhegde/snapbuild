// ============================================================================
//  web-app-generator.ts
//  AI Tool Call 引擎 —— 通过 AI SDK 驱动，在内存文件系统中生成 Web App
//  所有文件以 Record<path, content> 形式存储，无任何 Node.js 依赖，可在浏览器运行
// ============================================================================

import { SANDBOX_TEMPLATES } from "@codesandbox/sandpack-react";
import { streamText, generateText } from "ai";
import type { ToolSet } from "ai";
import { getProviderModel, buildProviderOptions } from "./ai-provider";
import type { ApiType } from "./ai-provider";
import { modelSupportsVision } from "./ai-provider";
import { buildPromptWithUserImages } from "./pendingImage";
import { messagesToModelMessages } from "./ai-messages";
import { BUILTIN_TOOLS } from "./ai-tools";
import { sanitizePackageJsonContent } from "./staticSite";
import { repairStaticSiteFiles } from "./staticSiteRepair";
import { DESIGN_SYSTEM_PROMPT } from "./designPrompt";
import {
  applyFilePatches,
  formatPatchResult,
  isPatchFailureResult,
  extractPatchFailurePath,
  RECOVERY_MESSAGE_PREFIX,
  type FilePatch,
} from "./patchFile";
import {
  isRecoveryMessage,
  toolResultModifiedFile,
  buildEditNotAppliedRecovery,
  getMessageText,
  messageExpectsEdit,
} from "./editEnforcement";
import { applySiteTheme, isKnownTheme } from "./applySiteTheme";
import { THEME_PRESETS } from "./design/editProtocol";

// ═══════════════════════════════ 类型定义 ═══════════════════════════════════

/** 项目文件：路径 → 内容 */
export type ProjectFiles = Record<string, string>;

/** OpenAI 多模态内容块 */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

/** 内部消息格式 */
export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ContentPart[] | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  /** 模型思考过程（extended thinking） */
  thinking?: string;
}

/** 工具调用 */
export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

/** 工具定义（OpenAI function calling 格式，保留用于向后兼容） */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  };
}

/** 文件变更记录 */
export interface FileChange {
  path: string;
  action: "created" | "modified" | "deleted";
}

/** generate() 的最终返回值 */
export interface GenerateResult {
  files: ProjectFiles;
  messages: Message[];
  text: string;
  aborted: boolean;
  maxIterationsReached: boolean;
}

/** 构造选项 */
export interface GeneratorOptions {
  /** API 类型 */
  apiType?: ApiType;
  /** API 基础地址 */
  apiBaseUrl: string;
  /** API 密钥 */
  apiKey: string;
  /** 模型 ID */
  model: string;
  /** 自定义系统提示词（提供了合理默认值） */
  systemPrompt?: string;
  /** 初始项目文件 */
  initialFiles?: ProjectFiles;
  /** 工具调用最大循环轮次（默认 30） */
  maxIterations?: number;
  /** 是否启用流式输出（默认 true） */
  stream?: boolean;
  /** 额外的自定义工具（AI SDK ToolSet 格式） */
  customTools?: ToolSet;
  /** 自定义工具的执行回调（内置工具之外的分发到这里） */
  customToolHandler?: (name: string, args: unknown) => string | Promise<string>;
  /** 是否启用 thinking（默认 true） */
  thinking?: boolean;
  /** thinking 的 budget_tokens（默认 10000） */
  thinkingBudget?: number;
  /** Max auto-retry attempts for failed API requests (default 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default 1000) */
  retryDelay?: number;
  /** Names of provider-managed tools (executed server-side, not locally) */
  providerToolNames?: string[];
}

/** 事件回调 */
export interface GeneratorEvents {
  /** AI 输出文本片段（流式时逐 chunk 触发） */
  onText?: (delta: string) => void;
  /** AI 思考过程片段（流式时逐 chunk 触发） */
  onThinking?: (delta: string) => void;
  /** AI 开始调用某个工具 */
  onToolCall?: (name: string, toolCallId: string) => void;
  /** 工具执行完毕 */
  onToolResult?: (name: string, args: unknown, result: string) => void;
  /** 项目文件发生变更 */
  onFileChange?: (files: ProjectFiles, changes: FileChange[]) => void;
  /** 项目模板变更（init_project 触发） */
  onTemplateChange?: (template: string, files: ProjectFiles) => void;
  /** 项目依赖变更（manage_dependencies 触发，需要重启 Sandpack） */
  onDependenciesChange?: (files: ProjectFiles) => void;
  /** 整个 generate 流程结束 */
  onComplete?: (result: GenerateResult) => void;
  /** 出错 */
  onError?: (error: Error) => void;
  /** API request is being retried after a failure */
  onRetry?: (attempt: number, maxAttempts: number, error: Error) => void;
  /** 上下文压缩，返回压缩后的消息列表 */
  onCompact?: () => Promise<Message[] | null>;
  /** Patch failed and agent tried to stop — revoke premature reply and inject recovery */
  onPatchRecovery?: (recoveryContent: string) => void;
}

// ═══════════════════════════════ 默认常量 ═══════════════════════════════════

const DEFAULT_SYSTEM_PROMPT = `<role>
You are an expert full-stack developer and senior agency product designer. Snapbuild is a ONE-SHOT website maker: you deliver complete, deployable, studio-quality sites in a single session — never partial drafts, never generic AI templates.
</role>

<workflow>
BUILD (empty project):
1. Read <one_shot_builder> and <design_system> — pick ONE site archetype, then execute fully.
2. Batch-write ALL files in parallel (complete index.html with every section) — do NOT stop after hero.
3. Call image_search early for every visual slot; use exact URLs in HTML.
4. Include motion CSS + scroll reveal JS in the first write.
5. Run get_console_logs once at the end; fix errors; verify <quality_bar> checklist.

EDIT (existing project — theme, colors, spacing, copy, layout):
1. Follow <edit_protocol> exactly — read_files FIRST, then patch or write_file.
2. Theme/color requests: update :root --primary HSL + replace hardcoded bg-emerald/bg-green/hex with bg-primary/text-primary.
3. Failed patch → read_files + write_file full file immediately. Never claim done after failed patches.
4. get_console_logs after edits; fix errors before replying.

Chat reply: 1-2 sentences only — never paste code in chat.
</workflow>

<chat_style>
- Keep chat replies SHORT (1–3 sentences for simple tasks).
- NEVER paste source code, file contents, or sections like "Code (final)" in chat. The user sees code in the editor/preview — chat is for brief status only.
- Do NOT include "How to run locally", verification essays, accessibility write-ups, or long markdown summaries in chat.
- When finished, say what you built in plain language (e.g. "Done — Hello World page with your image as the full-page background.").
- Do not output GFM task checklists or architecture summaries in the final chat message.
</chat_style>

<rules>
- Code Integrity: Produce only complete, runnable code. The use of placeholders, "// TODO" comments, or truncated snippets (e.g., "...") is strictly forbidden.
- Modern Standards: Use modern ES6+ JavaScript syntax and CSS variables for all styling to ensure maintainability. Use semantic HTML5 elements to improve SEO and structural clarity.
- Default stack for landing pages: static HTML + Tailwind CDN + shadcn/ui tokens + ui_kit components (copy exact class recipes — never invent buttons/cards).
- Tailwind CSS: ALWAYS include \`<script src="https://cdn.tailwindcss.com"></script>\` + shadcn HSL variables + tailwind.config color mapping from ui_kit.
- Use ui_kit button/card/nav/section recipes for ALL interactive and container elements — this prevents spacing bugs and inconsistent UI.
- React/shadcn: only for apps (dashboard, todo). Use vite-react-ts + src/components/ui/ shadcn patterns. Landing pages = static HTML ui_kit.
- Chart usage: If a webpage contains a large amount of data, you can use \`Chart.js\` to generate charts by injecting \`<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\` into \`index.html\`, thereby improving the page's expressiveness and interactivity.
- Accessibility: All generated UI components must comply with WCAG accessibility standards, including proper ARIA roles and keyboard navigation.
- Security Protocols: Implement strict security measures, including input sanitization and specific preventions against Cross-Site Scripting (XSS).
- Documentation: Use JSDoc or standardized commenting for all complex logic, functions, and custom modules.
- Performance Optimization: Proactively suggest and implement performance enhancements such as code splitting, lazy loading of assets, and efficient resource management.
- Enhance visual appeal: Using appropriate images during page development can effectively enhance the visual appeal of a website.
- Dependencies: Strictly forbid the use of deprecated libraries, APIs, or unmaintained third-party packages.
- Project Organization: Maintain professional directory structures and logical file hierarchies for all projects to ensure scalability.
- Markdown Formatting: When outputting content in responses, use proper Markdown syntax: images as \`![alt](url)\`, links as \`[title](url)\`, and utilize tables, blockquotes, and other Markdown features for better readability.
</rules>

<tools>
- Read-Before-Write: ALWAYS call read_files on index.html (and styles.css if present) before ANY modification. Never patch from memory.
- Theme/color edits: ALWAYS use apply_site_theme tool (blue, navy, green, etc.) — never patch_file for theme changes. Follow up with read_files if custom hex colors remain.
- Incremental Edits: Use patch_file for single text/class swaps only when you have the exact string from read_files. Set replace_all:true to replace every occurrence of a color class.
- Failed Patches: If patch_file returns "✗ not found" or "FAILED", you MUST read_files then write_file the complete file in the same turn — do not stop or tell the user it's done.
- Efficiency: Batch parallel read_files + write_file/patch_file calls when editing multiple files.
- Mandatory Verification: Execute get_console_logs after edits. Fix all runtime errors before finishing.
- Image Assets: When building UI components, use the image_search tool to find appropriate real images for hero sections, banners, marketing pages, product showcases, galleries, blog posts, and user profiles. Curate a cohesive photo mood. For simple icons, use inline SVG — never emoji as UI icons.
- User Uploads: When the user provides image URL(s) in their message (from Snapbuild's image library or attachments), use those exact URLs in HTML/CSS. Never ask the user to re-upload.
- NPM Packages: When you need third-party libraries, use search_npm_packages and get_npm_package_detail. Prefer packages with TypeScript support and active maintenance.
</tools>

${DESIGN_SYSTEM_PROMPT}`;

/** 内置工具定义 */
// 内置工具已迁移到 ai-tools.ts，使用 Zod schema 定义

// ════════════════════════════ WebAppGenerator 类 ════════════════════════════

export class WebAppGenerator {
  // ── 内部状态 ──
  private files: ProjectFiles;
  private messages: Message[];
  private events: GeneratorEvents;
  private ctrl: AbortController | null = null;

  // ── 配置（只读） ──
  private readonly apiType: ApiType;
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly systemPrompt: string;
  private readonly maxIterations: number;
  private readonly useStream: boolean;
  private readonly tools: ToolSet;
  private readonly customToolHandler?: GeneratorOptions["customToolHandler"];
  private readonly useThinking: boolean;
  private editRecoveryCount = 0;
  private editRecoveryUserIdx = -1;
  private readonly thinkingBudget: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly providerToolNames: Set<string>;
  private systemPromptSuffix: string = "";

  constructor(options: GeneratorOptions, events: GeneratorEvents = {}) {
    this.apiType = options.apiType ?? "openai-compatible";
    this.apiBaseUrl = options.apiBaseUrl;
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.systemPrompt = options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.maxIterations = options.maxIterations ?? 30;
    this.useStream = options.stream ?? true;
    this.tools = { ...BUILTIN_TOOLS, ...(options.customTools ?? {}) };
    this.customToolHandler = options.customToolHandler;
    this.useThinking = options.thinking ?? true;
    this.thinkingBudget = options.thinkingBudget ?? 10000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.providerToolNames = new Set(options.providerToolNames ?? []);

    this.files = { ...(options.initialFiles ?? {}) };
    this.messages = [];
    this.events = events;
  }

  // ═══════════════════════════ 公开 API ═══════════════════════════════════

  /** 获取当前项目文件快照 */
  getFiles(): ProjectFiles {
    return { ...this.files };
  }

  /** 替换整个项目文件 */
  setFiles(files: ProjectFiles): void {
    this.files = repairStaticSiteFiles({ ...files });
  }

  /** 获取完整对话消息历史 */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /** 清空对话历史（文件保留） */
  resetMessages(): void {
    this.messages = [];
  }

  /** 从外部状态同步对话历史（用于保持与 Store 的一致性） */
  syncMessages(messages: Message[]): void {
    this.messages = [...messages];
  }

  /** Set a dynamic suffix to append to the system prompt (e.g., memory context) */
  setSystemPromptSuffix(suffix: string): void {
    this.systemPromptSuffix = suffix;
  }

  /** 中止正在进行的 generate 请求 */
  abort(): void {
    this.ctrl?.abort();
    this.ctrl = null;
  }

  /**
   * 重试：不添加新的用户消息，直接重新运行生成循环
   * 用于错误后重试，此时用户消息已在历史中
   */
  async retry(): Promise<GenerateResult> {
    return this._runGenerateLoop();
  }

  /**
   * 核心方法：发送用户消息，驱动 AI 通过 Tool Call 循环生成/修改项目文件
   */
  async generate(
    userMessage: string,
    attachments?: Array<{
      type: string;
      name: string;
      content: string;
      size: number;
    }>,
  ): Promise<GenerateResult> {
    const supportsVision = modelSupportsVision(this.apiType, this.model);

    if (attachments && attachments.length > 0) {
      const parts: ContentPart[] = [];
      const imageAttachments = attachments.filter((a) => a.type === "image");
      const nonImageAttachments = attachments.filter((a) => a.type !== "image");

      if (!supportsVision && imageAttachments.length > 0) {
        const prompt = buildPromptWithUserImages(
          userMessage,
          imageAttachments.map((att) => ({
            url: att.content,
            filename: att.name,
          })),
        );
        parts.push({ type: "text", text: prompt });
      } else {
        if (userMessage) parts.push({ type: "text", text: userMessage });
        for (const att of imageAttachments) {
          parts.push({ type: "text", text: `[Image: ${att.name}]` });
          parts.push({ type: "image_url", image_url: { url: att.content } });
        }
      }

      for (const att of nonImageAttachments) {
        parts.push({
          type: "text",
          text: `[File: ${att.name} | ${att.size}]\n${att.content}`,
        });
      }
      this.messages.push({ role: "user", content: parts });
    } else {
      this.messages.push({ role: "user", content: userMessage });
    }

    this.editRecoveryCount = 0;
    this.editRecoveryUserIdx = -1;

    return this._runGenerateLoop();
  }

  private async _runGenerateLoop(): Promise<GenerateResult> {
    const systemContent = this.buildSystemContent();
    let fullText = "";
    let aborted = false;
    let maxReached = false;

    try {
      for (let iter = 0; iter < this.maxIterations; iter++) {
        const requestMessages: Message[] = [
          { role: "system", content: systemContent },
          ...this.messages,
        ];

        const assistantMsg = await this.requestWithRetry(requestMessages);

        this.messages.push(assistantMsg);
        if (assistantMsg.content) {
          fullText += assistantMsg.content;
        }

        if (!assistantMsg.tool_calls?.length) {
          const recovered = this.tryEditRecovery(fullText);
          if (recovered) {
            fullText = recovered;
            continue;
          }
          break;
        }

        for (const toolCall of assistantMsg.tool_calls) {
          // Skip provider-managed tools (executed server-side, e.g. built-in search)
          if (this.providerToolNames.has(toolCall.function.name)) {
            continue;
          }

          if (
            toolCall.function.name === "compact_context" &&
            this.events.onCompact
          ) {
            const compacted = await this.events.onCompact();
            if (compacted) {
              this.messages = compacted;
              // Add back the assistant message with tool_calls and the tool result
              this.messages.push(assistantMsg);
            }
            this.messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: compacted
                ? "OK — context compressed successfully."
                : "Context compression skipped (not enough messages).",
            });
            this.events.onToolResult?.(
              toolCall.function.name,
              {},
              this.messages[this.messages.length - 1].content as string,
            );
            continue;
          }

          const { result, changes } = await this.executeTool(toolCall);

          this.messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });

          if (changes.length > 0) {
            this.events.onFileChange?.(this.getFiles(), changes);
          }
        }

        if (iter === this.maxIterations - 1) {
          maxReached = true;
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        aborted = true;
      } else {
        this.events.onError?.(err);
        throw err;
      }
    }

    const result: GenerateResult = {
      files: this.getFiles(),
      messages: this.getMessages(),
      text: fullText,
      aborted,
      maxIterationsReached: maxReached,
    };

    this.events.onComplete?.(result);
    return result;
  }

  // ══════════════════════════ 内部方法 ══════════════════════════════════════

  /** Check if an error is retryable */
  private isRetryableError(err: any): boolean {
    if (err.name === "AbortError") return false;
    if (err.status) return err.status === 429 || err.status >= 500;
    // No HTTP status → likely a network error, retryable
    return true;
  }

  /** Sleep that can be interrupted by abort signal */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      this.ctrl?.signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });
  }

  /** Wrap API request with retry logic */
  private async requestWithRetry(messages: Message[]): Promise<Message> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.requestAI(messages);
      } catch (err: any) {
        if (!this.isRetryableError(err) || attempt >= this.maxRetries)
          throw err;
        this.events.onRetry?.(attempt + 1, this.maxRetries, err);
        const delay =
          this.retryDelay * Math.pow(2, attempt) + Math.random() * 500;
        await this.sleep(delay);
      }
    }
  }

  private buildSystemContent(): string {
    const paths = Object.keys(this.files).sort();
    const listing =
      paths.length > 0
        ? "\n\nCurrent project files:\n" + paths.map((p) => `- ${p}`).join("\n")
        : "\n\nThe project is empty — no files yet.";
    return this.systemPrompt + listing + this.systemPromptSuffix;
  }

  /** 通过 AI SDK 发起请求 */
  private async requestAI(messages: Message[]): Promise<Message> {
    this.ctrl = new AbortController();

    const coreMessages = messagesToModelMessages(
      messages,
      this.apiType,
      this.model,
    );
    const model = getProviderModel({
      apiType: this.apiType,
      apiBaseUrl: this.apiBaseUrl,
      apiKey: this.apiKey,
      model: this.model,
    });

    const providerOptions = this.useThinking
      ? buildProviderOptions(this.apiType, this.thinkingBudget)
      : undefined;

    if (this.useStream) {
      return this.requestStreamAI(model, coreMessages, providerOptions);
    } else {
      return this.requestGenerateAI(model, coreMessages, providerOptions);
    }
  }

  /** 流式请求 — 使用 AI SDK streamText() */
  private async requestStreamAI(
    model: ReturnType<typeof getProviderModel>,
    coreMessages: ReturnType<typeof messagesToModelMessages>,
    providerOptions?: ReturnType<typeof buildProviderOptions>,
  ): Promise<Message> {
    const result = streamText({
      model,
      messages: coreMessages,
      tools: this.tools,
      maxRetries: 0, // retry 由 requestWithRetry 处理
      abortSignal: this.ctrl!.signal,
      providerOptions: providerOptions as any,
    });

    let contentAccum = "";
    let thinkingAccum = "";
    const toolCallsAccum: ToolCall[] = [];

    for await (const part of result.fullStream) {
      switch (part.type) {
        case "text-delta":
          contentAccum += part.text;
          this.events.onText?.(part.text);
          break;

        case "reasoning-delta":
          thinkingAccum += part.text;
          this.events.onThinking?.(part.text);
          break;

        case "tool-input-start":
          // Skip UI notification for provider-managed tools
          if (!this.providerToolNames.has(part.toolName)) {
            this.events.onToolCall?.(part.toolName, part.id);
          }
          break;

        case "tool-call":
          // Only track non-provider tool calls for local execution
          if (!this.providerToolNames.has(part.toolName)) {
            toolCallsAccum.push({
              id: part.toolCallId,
              type: "function",
              function: {
                name: part.toolName,
                arguments: JSON.stringify(part.input),
              },
            });
          }
          break;
      }
    }

    return {
      role: "assistant",
      content: contentAccum || null,
      tool_calls: toolCallsAccum.length > 0 ? toolCallsAccum : undefined,
      thinking: thinkingAccum || undefined,
    };
  }

  /** 非流式请求 — 使用 AI SDK generateText() */
  private async requestGenerateAI(
    model: ReturnType<typeof getProviderModel>,
    coreMessages: ReturnType<typeof messagesToModelMessages>,
    providerOptions?: ReturnType<typeof buildProviderOptions>,
  ): Promise<Message> {
    const result = await generateText({
      model,
      messages: coreMessages,
      tools: this.tools,
      maxRetries: 0,
      abortSignal: this.ctrl!.signal,
      providerOptions: providerOptions as any,
    });

    if (result.text) {
      this.events.onText?.(result.text);
    }

    const reasoning = (result as any).reasoning;
    if (reasoning) {
      this.events.onThinking?.(reasoning);
    }

    const toolCalls: ToolCall[] = (result.toolCalls || []).map((tc) => ({
      id: tc.toolCallId,
      type: "function",
      function: {
        name: tc.toolName,
        arguments: JSON.stringify(tc.input),
      },
    }));

    for (const tc of toolCalls) {
      this.events.onToolCall?.(tc.function.name, tc.id);
    }

    return {
      role: "assistant",
      content: result.text || null,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      thinking: reasoning || undefined,
    };
  }

  private async executeTool(
    toolCall: ToolCall,
  ): Promise<{ result: string; changes: FileChange[] }> {
    const name = toolCall.function.name;

    let args: any;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      const errMsg = `Error: failed to parse arguments for "${name}"`;
      this.events.onToolResult?.(name, null, errMsg);
      return { result: errMsg, changes: [] };
    }

    const changes: FileChange[] = [];
    let result: string;

    switch (name) {
      case "init_project":
        result = this.toolInitProject(args.template, changes);
        break;

      case "manage_dependencies":
        result = this.toolManageDependencies(args.package_json, changes);
        break;

      case "list_files":
        result = this.toolListFiles();
        break;

      // case "read_file":
      //   result = this.toolReadFile(args.path);
      //   break;

      case "read_files":
        result = this.toolReadFiles(args.paths);
        break;

      case "write_file":
        result = this.toolWriteFile(args.path, args.content, changes);
        break;

      case "patch_file": {
        const patches = Array.isArray(args.patches)
          ? args.patches
          : [args.patches];
        result = this.toolPatchFile(args.path, patches, changes);
        break;
      }

      case "apply_site_theme":
        result = this.toolApplySiteTheme(args.theme, changes);
        break;

      case "delete_file":
        result = this.toolDeleteFile(args.path, changes);
        break;

      case "search_in_files":
        result = this.toolSearchInFiles(args.pattern);
        break;

      default:
        if (this.customToolHandler) {
          try {
            result = await this.customToolHandler(name, args);
          } catch (err: any) {
            result = `Error in custom tool "${name}": ${err.message}`;
          }
        } else {
          result = `Error: unknown tool "${name}"`;
        }
    }

    this.events.onToolResult?.(name, args, result);
    return { result, changes };
  }

  private toolInitProject(template: string, changes: FileChange[]): string {
    const tmpl = SANDBOX_TEMPLATES[template as keyof typeof SANDBOX_TEMPLATES];
    if (!tmpl) {
      return `Error: unknown template "${template}". Use one of: ${Object.keys(SANDBOX_TEMPLATES).join(", ")}`;
    }
    const newFiles: ProjectFiles = {};
    for (const [path, file] of Object.entries(tmpl.files)) {
      const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
      const code =
        typeof file === "string" ? file : (file as { code: string }).code;
      newFiles[normalizedPath] = code;
      changes.push({ path: normalizedPath, action: "created" });
    }
    this.files = newFiles;
    this.events.onTemplateChange?.(template, this.getFiles());
    return `OK — initialized project with template "${template}" (${Object.keys(newFiles).length} files)`;
  }

  private toolManageDependencies(
    packageJson: string,
    changes: FileChange[],
  ): string {
    const sanitized = sanitizePackageJsonContent(packageJson);
    try {
      JSON.parse(sanitized);
    } catch {
      return "Error: invalid JSON in package_json";
    }
    const pkgPath =
      Object.keys(this.files).find((p) => p.endsWith("package.json")) ||
      "package.json";
    const action: FileChange["action"] =
      pkgPath in this.files ? "modified" : "created";
    this.files[pkgPath] = sanitized;
    changes.push({ path: pkgPath, action });
    this.events.onDependenciesChange?.(this.getFiles());
    return `OK — ${action} ${pkgPath}, dependencies updated. Sandpack will restart.`;
  }

  private toolListFiles(): string {
    const paths = Object.keys(this.files).sort();
    if (paths.length === 0) return "(empty project — no files)";
    return paths.join("\n");
  }

  // private toolReadFile(path: string): string {
  //   if (!(path in this.files)) {
  //     return `Error: file not found — "${path}"`;
  //   }
  //   return this.files[path];
  // }

  private toolReadFiles(paths: string[]): string {
    if (!Array.isArray(paths) || paths.length === 0) {
      return "Error: no paths provided";
    }
    return paths
      .map((path) => {
        if (!(path in this.files)) {
          return `=== ${path} ===\nError: file not found`;
        }
        return `=== ${path} ===\n${this.files[path]}`;
      })
      .join("\n\n");
  }

  private applyFileWrites(changes: FileChange[]): void {
    if (Object.keys(this.files).length === 0) return;
    const before = { ...this.files };
    const repaired = repairStaticSiteFiles(this.files);
    for (const [path, content] of Object.entries(repaired)) {
      if (before[path] === content) continue;
      const existed = path in before;
      this.files[path] = content;
      if (!changes.some((c) => c.path === path)) {
        changes.push({ path, action: existed ? "modified" : "created" });
      }
    }
  }

  private toolWriteFile(
    path: string,
    content: string,
    changes: FileChange[],
  ): string {
    const action: FileChange["action"] =
      path in this.files ? "modified" : "created";
    const body = path.endsWith("package.json")
      ? sanitizePackageJsonContent(content)
      : content;
    this.files[path] = body;
    changes.push({ path, action });
    this.applyFileWrites(changes);
    return `OK — ${action}: ${path} (${this.files[path]?.length ?? body.length} chars)`;
  }

  private toolPatchFile(
    path: string,
    patches: FilePatch[],
    changes: FileChange[],
  ): string {
    if (!(path in this.files)) {
      return `Error: file not found — "${path}"`;
    }

    const original = this.files[path];
    const { content, log, applied, failed, failedSearches } =
      applyFilePatches(original, patches);

    if (content !== original) {
      this.files[path] = path.endsWith("package.json")
        ? sanitizePackageJsonContent(content)
        : content;
      changes.push({ path, action: "modified" });
      this.applyFileWrites(changes);
    }

    return formatPatchResult(
      path,
      applied,
      failed,
      patches.length,
      log,
      failed > 0 ? original : undefined,
      failed > 0 ? failedSearches : undefined,
    );
  }

  private findUnresolvedPatchFailure(): { path: string } | null {
    let failPath: string | null = null;
    let failIndex = -1;

    for (let i = this.messages.length - 1; i >= 0; i--) {
      const m = this.messages[i];
      if (m.role !== "tool" || typeof m.content !== "string") continue;
      if (isPatchFailureResult(m.content)) {
        failPath = extractPatchFailurePath(m.content);
        failIndex = i;
        break;
      }
    }

    if (!failPath || failIndex < 0) return null;

    // Resolved if write_file or successful patch happened after the failure
    for (let i = failIndex + 1; i < this.messages.length; i++) {
      const m = this.messages[i];
      if (m.role === "assistant" && m.tool_calls?.length) {
        for (const tc of m.tool_calls) {
          if (tc.function.name === "write_file") return null;
          if (tc.function.name === "apply_site_theme") return null;
        }
      }
      if (m.role === "tool" && typeof m.content === "string") {
        if (m.content.startsWith(`OK — modified: ${failPath}`)) return null;
        if (m.content.startsWith(`OK — created: ${failPath}`)) return null;
        if (
          m.content.includes("PATCH_FAILED: false") &&
          m.content.includes(failPath)
        ) {
          return null;
        }
      }
    }

    return { path: failPath };
  }

  private findPendingEditWithoutChanges(): { path: string; userIdx: number } | null {
    if (Object.keys(this.files).length === 0) return null;

    let lastEditUserIdx = -1;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const m = this.messages[i];
      if (m.role !== "user") continue;
      const text = getMessageText(m.content);
      if (isRecoveryMessage(text)) continue;
      if (messageExpectsEdit(m.content)) {
        lastEditUserIdx = i;
        break;
      }
    }
    if (lastEditUserIdx < 0) return null;

    for (let i = lastEditUserIdx + 1; i < this.messages.length; i++) {
      const m = this.messages[i];
      if (m.role === "tool" && typeof m.content === "string") {
        if (toolResultModifiedFile(m.content)) return null;
      }
    }

    const htmlPath =
      Object.keys(this.files).find((p) => p === "index.html") ??
      Object.keys(this.files).find((p) => p.endsWith(".html")) ??
      "index.html";

    return { path: htmlPath, userIdx: lastEditUserIdx };
  }

  /** Revoke premature "Done" and inject recovery. Returns updated fullText or null. */
  private tryEditRecovery(fullText: string): string | null {
    const unresolved = this.findUnresolvedPatchFailure();
    const pendingEdit = unresolved ? null : this.findPendingEditWithoutChanges();

    if (!unresolved && !pendingEdit) return null;

    const userIdx = pendingEdit?.userIdx ?? this.editRecoveryUserIdx;
    if (userIdx === this.editRecoveryUserIdx && this.editRecoveryCount >= 3) {
      return null;
    }
    if (userIdx !== this.editRecoveryUserIdx) {
      this.editRecoveryUserIdx = userIdx;
      this.editRecoveryCount = 0;
    }
    this.editRecoveryCount++;

    const last = this.messages[this.messages.length - 1];
    if (last?.role === "assistant" && !last.tool_calls?.length && last.content) {
      const premature = typeof last.content === "string" ? last.content : "";
      this.messages.pop();
      if (premature) {
        fullText = fullText.slice(0, Math.max(0, fullText.length - premature.length));
      }
    }

    let recoveryContent: string;
    if (unresolved) {
      recoveryContent =
        `${RECOVERY_MESSAGE_PREFIX} Patch on "${unresolved.path}" FAILED — ` +
        `changes were NOT saved. You MUST call write_file("${unresolved.path}", ...) ` +
        `with the complete updated file. Do NOT reply done until write_file succeeds.`;
    } else if (pendingEdit) {
      const content = this.files[pendingEdit.path] ?? "";
      recoveryContent = buildEditNotAppliedRecovery(pendingEdit.path, content);
    } else {
      return fullText;
    }

    this.messages.push({ role: "user", content: recoveryContent });
    this.events.onPatchRecovery?.(recoveryContent);
    return fullText;
  }

  private toolApplySiteTheme(theme: string, changes: FileChange[]): string {
    if (!isKnownTheme(theme)) {
      return `Error: unknown theme "${theme}". Use: ${Object.keys(THEME_PRESETS).join(", ")}`;
    }

    const htmlPath = Object.keys(this.files).find(
      (p) => p === "index.html" || p.endsWith("/index.html"),
    );
    if (!htmlPath) {
      return "Error: index.html not found — apply_site_theme only works on static HTML sites.";
    }

    const original = this.files[htmlPath];
    const { html, changes: changeLog } = applySiteTheme(original, theme);

    if (html === original) {
      return (
        `Warning: apply_site_theme made no automatic changes to ${htmlPath}. ` +
        `The file may use custom color vars without --primary. ` +
        `Use read_files then write_file to update colors manually.`
      );
    }

    this.files[htmlPath] = html;
    changes.push({ path: htmlPath, action: "modified" });

    return [
      `OK — applied ${THEME_PRESETS[theme].label} theme to ${htmlPath}`,
      ...changeLog.map((c) => `  • ${c}`),
      "",
      "If buttons/CTAs still look wrong, read_files and replace any remaining hardcoded hex or color classes with bg-primary/text-primary.",
    ].join("\n");
  }

  private toolSearchInFiles(pattern: string): string {
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, "g");
    } catch {
      return `Error: invalid regex pattern — "${pattern}"`;
    }
    const results: string[] = [];
    for (const [path, content] of Object.entries(this.files)) {
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push(`${path}:${i + 1}: ${lines[i].trim()}`);
        }
        regex.lastIndex = 0;
      }
    }
    return results.length > 0 ? results.join("\n") : "(no matches found)";
  }

  private toolDeleteFile(path: string, changes: FileChange[]): string {
    if (!(path in this.files)) {
      return `Error: file not found — "${path}"`;
    }
    delete this.files[path];
    changes.push({ path, action: "deleted" });
    return `OK — deleted: ${path}`;
  }
}
