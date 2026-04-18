import { Hammer } from "lucide-react";
import { motion } from "motion/react";

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#E4E3E0] p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="text-center space-y-4 max-w-md"
      >
        <div className="w-16 h-16 border border-[#141414] bg-[#E4E3E0] text-[#141414] flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <Hammer size={24} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#141414]/60">Blueprint Buddy</p>
        <h2 className="text-3xl font-light serif italic text-[#141414]">Start your build</h2>
        <p className="text-sm text-[#141414]/60 leading-relaxed">
          Describe your furniture idea in the chat to generate professional build plans, 3D previews, and material
          lists.
        </p>
        <p className="text-[10px] uppercase tracking-widest font-mono text-[#141414]/40 pt-4">
          Tip: Include dimensions, wood species, and intended use
        </p>
      </motion.div>
    </div>
  );
}
