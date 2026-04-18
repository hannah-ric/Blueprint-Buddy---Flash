import { BuildPlan } from "../types";
import { User } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Trash2, Hammer, Calendar, StickyNote, Flag, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

interface ProjectHistoryProps {
  user: User | null;
  history: BuildPlan[];
  isLoading: boolean;
  onSelectPlan: (plan: BuildPlan) => void;
  onError?: (message: string) => void;
}

export function ProjectHistory({ user, history, isLoading, onSelectPlan, onError }: ProjectHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Auto-cancel the "confirm delete" state after 3s.
  useEffect(() => {
    if (!pendingDeleteId) return;
    const timer = setTimeout(() => setPendingDeleteId(null), 3000);
    return () => clearTimeout(timer);
  }, [pendingDeleteId]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#E4E3E0]">
        <div className="text-center max-w-md border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] bg-white">
          <div className="w-16 h-16 bg-[#E4E3E0] border border-[#141414] rounded-none flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] mb-6">
            <Hammer className="text-[#141414]" size={24} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-light serif italic text-[#141414] mb-4">Sign in to save projects</h3>
          <p className="text-[#141414]/60 text-xs font-mono uppercase tracking-wider leading-relaxed">
            Create an account to save your generated build plans and access them from anywhere.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-[#E4E3E0]" aria-busy="true" aria-label="Loading project history">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="relative bg-white border border-[#141414] p-5 flex flex-col h-[280px] animate-pulse"
            >
              <div className="h-6 w-3/4 bg-[#141414]/10 mb-4" />
              <div className="h-3 w-full bg-[#141414]/10 mb-2" />
              <div className="h-3 w-5/6 bg-[#141414]/10 mb-2" />
              <div className="h-3 w-4/6 bg-[#141414]/10" />
              <div className="mt-auto pt-4 border-t border-[#141414]/20 flex items-center justify-between">
                <div className="h-3 w-24 bg-[#141414]/10" />
                <div className="h-5 w-16 bg-[#141414]/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#E4E3E0]">
        <div className="text-center max-w-md border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] bg-white">
          <div className="w-16 h-16 bg-[#E4E3E0] border border-[#141414] rounded-none flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] mb-6">
            <Hammer className="text-[#141414]" size={24} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-light serif italic text-[#141414] mb-4">No Projects Yet</h3>
          <p className="text-[#141414]/60 text-xs font-mono uppercase tracking-wider leading-relaxed">
            Your generated build plans will appear here. Start a new design to see it in your history.
          </p>
        </div>
      </div>
    );
  }

  const handleDelete = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    if (pendingDeleteId !== planId) {
      setPendingDeleteId(planId);
      return;
    }
    setDeletingId(planId);
    setPendingDeleteId(null);
    try {
      await deleteDoc(doc(db, "plans", planId));
    } catch (err) {
      const msg = handleFirestoreError(err, OperationType.DELETE, `plans/${planId}`);
      onError?.(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#E4E3E0]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((plan) => {
          const stepCount = plan.instructions?.length ?? 0;
          const doneSteps = plan.stepReactions
            ? Object.values(plan.stepReactions).filter((r) => r === "done").length
            : 0;
          const issueCount = plan.issueFlags?.length ?? 0;
          const hasNotes = Boolean(plan.authorNotes && plan.authorNotes.trim().length > 0);
          return (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPlan(plan)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPlan(plan);
                }
              }}
              aria-label={`Open plan ${plan.name}`}
              className="group relative bg-white border border-[#141414] p-5 cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] focus-visible:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414] transition-all flex flex-col h-[280px]"
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-serif italic text-xl text-[#141414] line-clamp-2 pr-8">{plan.name}</h4>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, plan.id!)}
                  disabled={deletingId === plan.id}
                  aria-label={pendingDeleteId === plan.id ? "Confirm delete project" : "Delete project"}
                  className={`absolute top-4 right-4 p-2 border border-[#141414] transition-colors ${
                    pendingDeleteId === plan.id
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-[#E4E3E0] text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                  } ${deletingId === plan.id ? 'opacity-50 cursor-wait' : ''}`}
                  title={pendingDeleteId === plan.id ? "Click again to confirm" : "Delete project"}
                >
                  <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-[#141414]/70 line-clamp-3 mb-auto font-sans">
                {plan.description}
              </p>

              {(hasNotes || issueCount > 0 || doneSteps > 0) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#141414]/60">
                  {hasNotes && (
                    <span className="flex items-center gap-1" title="Has private notes">
                      <StickyNote size={12} aria-hidden="true" />
                      Notes
                    </span>
                  )}
                  {doneSteps > 0 && (
                    <span className="flex items-center gap-1" title="Steps marked done">
                      <CheckCircle2 size={12} aria-hidden="true" />
                      {doneSteps}/{stepCount}
                    </span>
                  )}
                  {issueCount > 0 && (
                    <span className="flex items-center gap-1 text-yellow-700" title="Flagged issues">
                      <Flag size={12} aria-hidden="true" />
                      {issueCount}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#141414]/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#141414]/60">
                  <Calendar size={14} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] px-2 py-1">
                  {plan.modelParts?.length || 0} Parts
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
