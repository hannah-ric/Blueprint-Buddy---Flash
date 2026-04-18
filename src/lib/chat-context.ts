import { ChatMessage } from "../types";

const MAX_TURNS = 12;

/**
 * Prepare chat history for the server:
 *  - keep only the most recent MAX_TURNS messages
 *  - keep inline image data only on the most recent user message (images bloat
 *    tokens and Gemini only needs the latest reference)
 *  - keep plan JSON only on the most recent model message that has one (that's
 *    the "current" design the user is iterating on)
 */
export function prepareMessagesForServer(messages: ChatMessage[]): ChatMessage[] {
  const trimmed = messages.slice(-MAX_TURNS);

  let lastUserImageIndex = -1;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (trimmed[i].role === "user" && trimmed[i].imageData) {
      lastUserImageIndex = i;
      break;
    }
  }

  let lastPlanIndex = -1;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (trimmed[i].role === "model" && trimmed[i].planData) {
      lastPlanIndex = i;
      break;
    }
  }

  return trimmed.map((msg, i) => {
    const cleaned: ChatMessage = { role: msg.role, content: msg.content };
    if (msg.imageData && msg.imageMimeType && i === lastUserImageIndex) {
      cleaned.imageData = msg.imageData;
      cleaned.imageMimeType = msg.imageMimeType;
    }
    if (msg.planData && i === lastPlanIndex) {
      cleaned.planData = msg.planData;
      cleaned.hasPlan = msg.hasPlan;
    }
    return cleaned;
  });
}
