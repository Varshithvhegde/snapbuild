// ============================================================================
//  sse-bridge.ts
//  Streaming response helper for AI API calls.
//  Web: uses native fetch. Tauri desktop builds can swap in invoke/events.
// ============================================================================

export interface SseRequestOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

/**
 * Create a streaming Response for SSE/LLM API calls.
 * In the browser this uses native fetch (CORS must be allowed by the provider).
 */
export function createSseResponse(
  options: SseRequestOptions,
): Promise<Response> {
  return fetch(options.url, {
    method: options.method,
    headers: options.headers,
    body: options.body,
    signal: options.signal,
  });
}
