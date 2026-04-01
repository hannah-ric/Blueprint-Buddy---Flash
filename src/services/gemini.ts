import { ChatMessage } from "../types";

export async function generateBuildPlan(messages: ChatMessage[], userId: string, experienceLevel: string, designStyle: string) {
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
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate plan");
  }

  return response.json();
}
