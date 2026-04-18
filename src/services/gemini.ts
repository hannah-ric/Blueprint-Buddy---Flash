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

export async function generateBuildPlan(messages: ChatMessage[], experienceLevel: string, designStyle: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150000); // 150s timeout

  try {
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
      signal: controller.signal
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

    let text = "";
    try {
      text = await response.text();
      return JSON.parse(text);
    } catch (e) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("The server is still starting up. Please wait a few seconds and try again.", { cause: e });
      }
      throw new Error(`Invalid response format from server. Received: ${text.substring(0, 200)}`, { cause: e });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Request timed out. The design is taking longer than expected. Please try again.", { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
