import { ChatMessage } from "../types";
import { auth } from "../lib/firebase";

const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000]; // 1s, 3s

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

      if (response.ok || !isRetryable(response.status) || attempt === retries) {
        return response;
      }

      // Wait before retrying on 5xx/429
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

export async function generateBuildPlan(messages: ChatMessage[], userId: string, experienceLevel: string, designStyle: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150000); // 150s timeout

  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error("Not authenticated. Please sign in and try again.");
    }

    const response = await fetchWithRetry("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messages,
        userId,
        experienceLevel,
        designStyle
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let errorMessage = "Failed to generate plan";
      let statusCode = response.status;
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

    try {
      return await response.json();
    } catch (e) {
      throw new Error("Invalid response format from server", { cause: e });
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
