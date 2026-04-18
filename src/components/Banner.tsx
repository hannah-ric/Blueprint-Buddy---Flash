import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BannerProps {
  message: string | null;
  onDismiss: () => void;
  tone?: "error" | "info";
}

export function Banner({ message, onDismiss, tone = "error" }: BannerProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className={
            tone === "error"
              ? "flex items-start gap-3 border border-[#141414] bg-[#141414] text-[#E4E3E0] px-4 py-3 mx-4 mt-3 text-xs font-mono"
              : "flex items-start gap-3 border border-[#141414] bg-[#E4E3E0] text-[#141414] px-4 py-3 mx-4 mt-3 text-xs font-mono"
          }
        >
          <AlertTriangle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <p className="flex-1 uppercase tracking-wider leading-relaxed">{message}</p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="shrink-0 p-0.5 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
