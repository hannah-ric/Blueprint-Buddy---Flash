import { BuildPlan } from "../types";
import { User } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface ProjectHistoryProps {
  user: User | null;
  history: BuildPlan[];
  isLoading: boolean;
  onSelectPlan: (plan: BuildPlan) => void;
}

export function ProjectHistory({ user, history, isLoading, onSelectPlan }: ProjectHistoryProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        {!user ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Sign in to view your project history.</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No projects found. Start a new design to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((plan, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={plan.id} 
                onClick={() => onSelectPlan(plan)}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-orange-500 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium group-hover:text-orange-600 transition-colors">{plan.name}</h3>
                  <p className="text-[10px] font-mono text-gray-400">{new Date(plan.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6">{plan.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{plan.material}</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-gray-50 rounded text-[9px] font-mono text-gray-500">{plan.cutList.length} Parts</span>
                    <span className="px-2 py-1 bg-gray-50 rounded text-[9px] font-mono text-gray-500">{plan.instructions.length} Steps</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
