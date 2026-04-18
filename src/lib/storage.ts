import { BuildPlan, ChatMessage } from "../types";

const STORAGE_KEY = "bb:session:v1";
const MAX_STORED_MESSAGES = 50;

export interface PersistedSession {
  userId: string | null;
  currentPlan: BuildPlan | null;
  messages: ChatMessage[];
  experienceLevel: string;
  designStyle: string;
  savedAt: string;
}

function sanitizeMessagesForStorage(messages: ChatMessage[]): ChatMessage[] {
  // Images are huge in base64 and can blow past the localStorage quota.
  // We keep the text + planData reference, drop inline image bytes.
  return messages.slice(-MAX_STORED_MESSAGES).map((msg) => {
    const { imageData: _imageData, imageMimeType: _imageMimeType, ...rest } = msg;
    return rest;
  });
}

export function loadSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (err) {
    console.warn("Failed to load saved session:", err);
    return null;
  }
}

export function saveSession(session: Omit<PersistedSession, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedSession = {
      ...session,
      messages: sanitizeMessagesForStorage(session.messages),
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Quota exceeded or serialization issue — drop silently, it's a nice-to-have.
    console.warn("Failed to save session:", err);
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
