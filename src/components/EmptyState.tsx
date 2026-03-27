import { Hammer } from "lucide-react";
import { motion } from "motion/react";

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#E4E3E0]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 max-w-md px-6"
      >
        <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Hammer className="text-gray-400" size={32} />
        </div>
        <h2 className="text-3xl font-light serif italic text-gray-800">Start Your Build</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Describe your furniture idea in the chat to generate professional build plans, 
          3D previews, and material lists.
        </p>
      </motion.div>
    </div>
  );
}
