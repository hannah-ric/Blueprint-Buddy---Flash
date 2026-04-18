import { ChatMessage } from "../types";

const MAX_RETRIES = 4;
const RETRY_DELAYS = [1000, 3000, 5000, 5000]; // 1s, 3s, 5s, 5s

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);
      
      // AI Studio proxy might return 200 OK with HTML during container startup.
      // We should treat this as a retryable error.
      const contentType = response.headers.get("content-type");
      const isHtml = contentType && contentType.includes("text/html");

      if ((response.ok && !isHtml) || (!isRetryable(response.status) && !isHtml) || attempt === retries) {
        return response;
      }

      // Wait before retrying
      if (attempt < retries) {
        await delay(RETRY_DELAYS[attempt]);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry abort errors (timeout)
      if (lastError.name === "AbortError") throw lastError;

      // Retry network errors
      if (attempt < retries) {
        await delay(RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

export interface GenerateProgressEvent {
  phase: 'thinking' | 'drafting' | 'validating' | 'correcting' | 'done';
  plan?: any;
  message?: string;
  isClarifying?: boolean;
}

export async function generateBuildPlan(
  messages: ChatMessage[], 
  experienceLevel: string, 
  designStyle: string,
  onProgress?: (event: GenerateProgressEvent) => void,
  signal?: AbortSignal
) {
  if (!signal) {
    const fallbackController = new AbortController();
    signal = fallbackController.signal;
  }

  const response = await fetchWithRetry("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      experienceLevel,
      designStyle
    }),
    signal
  });

  if (!response.ok) {
    let errorMessage = "Failed to generate plan";
    const statusCode = response.status;
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch {
      // Fallback if response is not JSON
    }
    const err = new Error(errorMessage);
    (err as Error & { statusCode: number }).statusCode = statusCode;
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Stream not supported by browser");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx;
      
      while ((newlineIdx = buffer.indexOf('\n\n')) >= 0) {
        const chunk = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 2);
        
        if (chunk.startsWith('data: ')) {
          const dataStr = chunk.slice(6);
          let event;
          try {
            event = JSON.parse(dataStr);
          } catch(e) {
            continue; // Ignore incomplete chunks
          }
          
          if (event.error) {
            throw new Error(event.error);
          }
          if (onProgress) {
            onProgress(event as GenerateProgressEvent);
          }
          if (event.phase === 'done') {
            return event;
          }
        }
      }
    }
    throw new Error("Stream closed before completion");
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('Generation was stopped'))) {
      const abortError = new Error("Generation was stopped by the user.");
      abortError.name = "AbortError";
      throw abortError;
    }
    throw error;
  }
}
