import { useEffect } from "react";

export interface KeyBinding {
  key: string;
  meta?: boolean; // ⌘ on macOS / Ctrl elsewhere
  shift?: boolean;
  handler: (e: KeyboardEvent) => void;
  // If false, shortcut fires even while typing in inputs/textareas. Default true.
  ignoreInputs?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Registers a set of global keyboard shortcuts. Matches on `e.metaKey || e.ctrlKey`
 * so the same bindings work on macOS and other platforms.
 */
export function useKeyboardShortcuts(bindings: KeyBinding[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const metaPressed = e.metaKey || e.ctrlKey;
      for (const b of bindings) {
        if (e.key.toLowerCase() !== b.key.toLowerCase()) continue;
        if (Boolean(b.meta) !== metaPressed) continue;
        if (Boolean(b.shift) !== e.shiftKey) continue;
        const ignoreInputs = b.ignoreInputs ?? true;
        if (ignoreInputs && isTypingTarget(e.target)) continue;
        b.handler(e);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bindings]);
}
