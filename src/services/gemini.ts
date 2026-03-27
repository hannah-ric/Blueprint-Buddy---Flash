import { BuildPlan, ChatMessage } from "../types";

export async function generateBuildPlan(
  messages: ChatMessage[],
  userId: string,
  experienceLevel: string,
  designStyle: string
): Promise<BuildPlan> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, userId, experienceLevel, designStyle }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Server error: ${response.status}`);
  }

  return response.json();
}
