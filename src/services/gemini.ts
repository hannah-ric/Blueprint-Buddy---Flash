import { ChatMessage } from "../types";

export async function generateBuildPlan(messages: ChatMessage[], userId: string, experienceLevel: string, designStyle: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150000); // 150s timeout

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // Fallback if response is not JSON
      }
      throw new Error(errorMessage);
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
