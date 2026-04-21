import { BuildPlan, StepReaction, PlanIssueFlag } from "../types";
import {
  Download,
  FileText,
  Package,
  Wrench,
  Lightbulb,
  Send,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  Check,
  SkipForward,
  Flag,
  StickyNote,
  X,
  Plus,
  CheckCircle2,
} from "lucide-react";
import Markdown from "react-markdown";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { updatePlanFields } from "../lib/plan-updates";
import { useDebouncedCallback } from "../lib/use-debounced";

function StepImage({ prompt, stepIndex, planName, stepText }: { prompt: string, stepIndex: number, planName: string, stepText: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setImageUrl(null);
    setError(false);

    if (prompt) {
      const autoGenerate = async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, planName, stepText })
          });
          if (!res.ok) throw new Error('Failed to generate');
          const data = await res.json();
          if (active && data.imageUrl) {
            setImageUrl(data.imageUrl);
          }
        } catch {
          if (active) setError(true);
        } finally {
          if (active) setIsLoading(false);
        }
      };
      autoGenerate();
    }

    return () => { active = false; };
  }, [prompt, planName, stepText]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, planName, stepText })
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (imageUrl) {
    return (
      <div className="rounded-none overflow-hidden border border-[#141414] bg-[#E4E3E0] aspect-video relative flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt={`Step ${stepIndex + 1} illustration`}
          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="rounded-none overflow-hidden border border-[#141414] bg-[#E4E3E0] aspect-video relative flex flex-col items-center justify-center p-4 text-center group">
      <ImageIcon size={24} className="text-[#141414]/30 mb-2 group-hover:text-[#141414] transition-colors" strokeWidth={1.5} />
      {error ? (
        <p className="text-[10px] text-red-600 mb-2 font-mono uppercase tracking-wider">Failed to generate</p>
      ) : (
        <p className="text-[10px] text-[#141414]/50 mb-2 font-mono uppercase tracking-wider">Illustration available</p>
      )}
      <button 
        onClick={handleGenerate}
        disabled={isLoading}
        className="px-3 py-1.5 bg-[#E4E3E0] border border-[#141414] rounded-none text-[10px] uppercase tracking-wider font-semibold text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
        {isLoading ? "Generating..." : "Generate Image"}
      </button>
    </div>
  );
}

interface PlanDetailsProps {
  plan: BuildPlan;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStepHover?: (parts: string[] | null) => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function PlanDetails({ plan, onSendMessage, isLoading, onStepHover }: PlanDetailsProps) {
  const [input, setInput] = useState("");

  // Author-private feedback state. Local copies let us render immediately and
  // debounce writes back to Firestore.
  const [notesDraft, setNotesDraft] = useState<string>(plan.authorNotes ?? "");
  const [reactions, setReactions] = useState<Record<string, StepReaction>>(plan.stepReactions ?? {});
  const [issueFlags, setIssueFlags] = useState<PlanIssueFlag[]>(plan.issueFlags ?? []);
  const [notesSaveState, setNotesSaveState] = useState<SaveState>("idle");
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSaving, setIssueSaving] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // When the plan switches (different id: undo/redo across versions, history
  // selection, new plan) reset local state from the incoming plan. We don't
  // depend on the feedback fields themselves so Firestore echoes from our own
  // saves don't clobber in-progress edits.
  useEffect(() => {
    setNotesDraft(plan.authorNotes ?? "");
    setReactions(plan.stepReactions ?? {});
    setIssueFlags(plan.issueFlags ?? []);
    setNotesSaveState("idle");
    setIsIssueOpen(false);
    setIssueText("");
    setIssueError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]);

  const canPersist = Boolean(plan.id);

  const saveNotes = useCallback(
    async (value: string) => {
      if (!plan.id) return;
      setNotesSaveState("saving");
      const err = await updatePlanFields(plan.id, { authorNotes: value || undefined });
      setNotesSaveState(err ? "error" : "saved");
    },
    [plan.id]
  );
  const debouncedSaveNotes = useDebouncedCallback((value: unknown) => {
    saveNotes(value as string);
  }, 700);

  const handleNotesChange = (value: string) => {
    setNotesDraft(value);
    setNotesSaveState("saving");
    debouncedSaveNotes(value);
  };

  const toggleReaction = useCallback(
    async (stepIndex: number, reaction: StepReaction) => {
      if (!plan.id) return;
      setReactions((prev) => {
        const key = String(stepIndex);
        const next = { ...prev };
        if (next[key] === reaction) {
          delete next[key];
        } else {
          next[key] = reaction;
        }
        // Fire-and-forget Firestore update. Errors surface via console; this is
        // author-private polish, not a blocking operation.
        updatePlanFields(plan.id!, {
          stepReactions: Object.keys(next).length ? next : undefined,
        });
        return next;
      });
    },
    [plan.id]
  );

  const submitIssue = useCallback(async () => {
    const trimmed = issueText.trim();
    if (!trimmed || !plan.id) return;
    setIssueSaving(true);
    setIssueError(null);
    const flag: PlanIssueFlag = { note: trimmed, createdAt: new Date().toISOString() };
    const nextFlags = [...issueFlags, flag];
    const err = await updatePlanFields(plan.id, { issueFlags: nextFlags });
    if (err) {
      setIssueError(err);
    } else {
      setIssueFlags(nextFlags);
      setIssueText("");
      setIsIssueOpen(false);
    }
    setIssueSaving(false);
  }, [issueText, issueFlags, plan.id]);

  const removeIssue = useCallback(
    async (createdAt: string) => {
      if (!plan.id) return;
      const nextFlags = issueFlags.filter((f) => f.createdAt !== createdAt);
      setIssueFlags(nextFlags);
      await updatePlanFields(plan.id, { issueFlags: nextFlags.length ? nextFlags : undefined });
    },
    [issueFlags, plan.id]
  );

  const doneCount = useMemo(
    () => Object.values(reactions).filter((r) => r === "done").length,
    [reactions]
  );
  const totalSteps = plan.instructions?.length ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const downloadCSV = (type: 'cutlist' | 'bom') => {
    let content: string;
    let filename: string;
    
    if (type === 'cutlist') {
      content = `Part,Quantity,Thickness (${plan.units}),Width (${plan.units}),Length (${plan.units}),Material\n` + 
        plan.cutList.map(item => `"${item.part}",${item.quantity},"${item.thickness}","${item.width}","${item.length}","${item.material}"`).join("\n");
      filename = `${plan.name.replace(/\s+/g, '_')}_cutlist.csv`;
    } else {
      content = "Item,Quantity,Unit,Estimated Cost\n" + 
        plan.bom.map(item => `"${item.item}",${item.quantity},"${item.unit}",${item.estimatedCost}`).join("\n");
      filename = `${plan.name.replace(/\s+/g, '_')}_bom.csv`;
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPlan = () => {
    const md = `# ${plan.name}

## Specifications
- **Style:** ${plan.designStyle || "N/A"}
- **Dimensions:** ${plan.dimensions}
- **Material:** ${plan.material}
- **Joinery:** ${plan.joinery}

## Description
${plan.description}

## Cut List
| Part | Quantity | Thickness | Width | Length | Material |
|---|---|---|---|---|---|
${plan.cutList.map(item => `| ${item.part} | ${item.quantity} | ${item.thickness} | ${item.width} | ${item.length} | ${item.material} |`).join('\n')}

## Bill of Materials
| Item | Quantity | Unit | Estimated Cost |
|---|---|---|---|
${plan.bom.map(item => `| ${item.item} | ${item.quantity} | ${item.unit} | $${item.estimatedCost.toFixed(2)} |`).join('\n')}

## Assembly Instructions
${plan.instructions.map((step, i) => {
  const text = typeof step === 'string' ? step : step.text;
  return `${i + 1}. ${text}`;
}).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.name.replace(/\s+/g, '_')}_plan.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-[#E4E3E0]"
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-16">
        {canPersist && (
          <details className="group border border-[#141414] bg-[#E4E3E0] p-4 transition-colors">
            <summary className="flex items-center gap-2 cursor-pointer font-mono text-xs uppercase tracking-widest text-[#141414] list-none">
              <StickyNote size={14} aria-hidden="true" />
              <span>My Notes</span>
              {notesDraft && <span className="text-[#141414]/50 normal-case tracking-normal">— {notesDraft.length} chars</span>}
              <span className="ml-auto text-[10px] opacity-60" aria-live="polite">
                {notesSaveState === "saving" && "Saving…"}
                {notesSaveState === "saved" && "Saved"}
                {notesSaveState === "error" && "Save failed"}
              </span>
            </summary>
            <div className="mt-4 border-t border-[#141414]/10 pt-4">
              <label htmlFor="author-notes" className="sr-only">
                Private notes about this plan
              </label>
              <textarea
                id="author-notes"
                value={notesDraft}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Private notes — measurements you adjusted, materials you swapped, things to remember…"
                className="w-full min-h-[120px] p-3 bg-[#E4E3E0] border border-[#141414] text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#141414] rounded-none resize-y placeholder:text-[#141414]/40"
                maxLength={5000}
              />
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#141414]/50 mt-2">
                Only visible to you. Auto-saves as you type.
              </p>
            </div>
          </details>
        )}

        {canPersist && (
          <div className="border border-[#141414] bg-[#E4E3E0] p-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#141414]">
                <Flag size={14} aria-hidden="true" />
                <span>Issue Flags ({issueFlags.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueOpen((v) => !v)}
                aria-expanded={isIssueOpen}
                aria-label={isIssueOpen ? "Close issue form" : "Report a plan issue"}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-[#141414] bg-[#E4E3E0] text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
              >
                {isIssueOpen ? <X size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
                {isIssueOpen ? "Cancel" : "Report issue"}
              </button>
            </div>
            {issueFlags.length > 0 && (
              <ul className="mt-4 border-t border-[#141414]/10 pt-4 space-y-2">
                {issueFlags.map((f) => (
                  <li key={f.createdAt} className="flex items-start gap-3 text-sm text-[#141414]/80">
                    <span className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-[#141414]/50 shrink-0">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                    <p className="flex-1 whitespace-pre-wrap break-words">{f.note}</p>
                    <button
                      type="button"
                      onClick={() => removeIssue(f.createdAt)}
                      aria-label="Remove issue"
                      className="p-1 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {isIssueOpen && (
              <div className="mt-4 border-t border-[#141414]/10 pt-4 space-y-2">
                <label htmlFor="issue-note" className="sr-only">
                  Describe the issue
                </label>
                <textarea
                  id="issue-note"
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="What's wrong? e.g. 'Leg height is 4 inches too tall for a dining chair.'"
                  className="w-full min-h-[80px] p-3 bg-[#E4E3E0] border border-[#141414] text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#141414] rounded-none resize-y placeholder:text-[#141414]/40"
                  maxLength={1000}
                />
                {issueError && (
                  <p role="alert" className="text-[10px] font-mono uppercase tracking-widest text-red-700">
                    {issueError}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={submitIssue}
                    disabled={!issueText.trim() || issueSaving}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-[#141414] bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 disabled:opacity-40 transition-colors"
                  >
                    {issueSaving ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Check size={12} aria-hidden="true" />}
                    Save issue
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#141414] pb-4 gap-4">
          <h2 className="text-4xl font-light serif italic text-[#141414] tracking-tight">Specifications</h2>
          <div className="flex flex-wrap gap-4">
            <button onClick={downloadPlan} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-[#141414]/60 hover:text-[#141414] transition-colors">
              <FileText size={14} strokeWidth={1.5} /> Export Plan
            </button>
            <button onClick={() => downloadCSV('cutlist')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-[#141414]/60 hover:text-[#141414] transition-colors">
              <Download size={14} strokeWidth={1.5} /> Export Cut List
            </button>
            <button onClick={() => downloadCSV('bom')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-[#141414]/60 hover:text-[#141414] transition-colors">
              <Download size={14} strokeWidth={1.5} /> Export BOM
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="border-l border-[#141414] pl-4">
            <p className="text-[10px] uppercase text-[#141414]/50 font-mono mb-1 tracking-widest">Style</p>
            <p className="font-mono text-sm text-[#141414]">{plan.designStyle || "N/A"}</p>
          </div>
          <div className="border-l border-[#141414] pl-4">
            <p className="text-[10px] uppercase text-[#141414]/50 font-mono mb-1 tracking-widest">Dimensions</p>
            <p className="font-mono text-sm text-[#141414]">{plan.dimensions}</p>
          </div>
          <div className="border-l border-[#141414] pl-4">
            <p className="text-[10px] uppercase text-[#141414]/50 font-mono mb-1 tracking-widest">Material</p>
            <p className="font-mono text-sm text-[#141414]">{plan.material}</p>
          </div>
          <div className="border-l border-[#141414] pl-4">
            <p className="text-[10px] uppercase text-[#141414]/50 font-mono mb-1 tracking-widest">Joinery</p>
            <p className="font-mono text-sm text-[#141414]">{plan.joinery}</p>
          </div>
          <div className="border-l border-[#141414] pl-4">
            <p className="text-[10px] uppercase text-[#141414]/50 font-mono mb-1 tracking-widest">Created</p>
            <p className="font-mono text-sm text-[#141414]">{new Date(plan.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      {plan.actionPlan && (
        <section className="space-y-4 bg-[#141414] text-[#E4E3E0] p-8 rounded-none border border-[#141414]">
          <div className="flex items-center gap-3 border-b border-[#E4E3E0]/20 pb-4">
            <Lightbulb className="text-[#E4E3E0]" size={20} strokeWidth={1.5} />
            <h3 className="text-xl font-medium serif italic tracking-wide">Research & Action Plan</h3>
          </div>
          <div className="text-sm text-[#E4E3E0]/80 leading-relaxed whitespace-pre-wrap markdown-body prose prose-sm prose-invert max-w-none pt-2">
            <Markdown>{plan.actionPlan}</Markdown>
          </div>
        </section>
      )}

      {plan.designNotes && (
        <section className="space-y-4 bg-[#E4E3E0] p-8 rounded-none border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center gap-3 border-b border-[#141414]/20 pb-4">
            <Lightbulb className="text-[#141414]" size={20} strokeWidth={1.5} />
            <h3 className="text-xl font-medium serif italic tracking-wide text-[#141414]">Why This Design Works</h3>
          </div>
          <div className="text-sm text-[#141414]/80 leading-relaxed whitespace-pre-wrap markdown-body prose prose-sm max-w-none pt-2">
            <Markdown>{plan.designNotes}</Markdown>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-[#141414]" size={20} strokeWidth={1.5} />
          <h3 className="text-2xl font-light serif italic text-[#141414]">Cut List ({plan.units})</h3>
        </div>
        <div className="border border-[#141414] rounded-none overflow-hidden bg-[#E4E3E0]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#141414]">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-[#141414]/60 tracking-widest">Part</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-[#141414]/60 tracking-widest">Qty</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-[#141414]/60 tracking-widest">T ({plan.units})</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-[#141414]/60 tracking-widest">W ({plan.units})</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-[#141414]/60 tracking-widest">L ({plan.units})</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-[#141414]/60 tracking-widest">Material</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/20" onMouseLeave={() => onStepHover?.(null)}>
              {plan.cutList.map((item, i) => (
                <tr 
                  key={i} 
                  className="hover:bg-[#141414]/5 transition-colors cursor-default"
                  onMouseEnter={() => onStepHover?.([item.part])}
                >
                  <td className="px-4 py-3 font-medium text-[#141414]">{item.part}</td>
                  <td className="px-4 py-3 font-mono text-[#141414]">{item.quantity}</td>
                  <td className="px-4 py-3 font-mono text-[#141414]">{item.thickness}</td>
                  <td className="px-4 py-3 font-mono text-[#141414]">{item.width}</td>
                  <td className="px-4 py-3 font-mono text-[#141414]">{item.length}</td>
                  <td className="px-4 py-3 text-[#141414]/60">{item.material}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Package className="text-[#141414]" size={20} strokeWidth={1.5} />
          <h3 className="text-2xl font-light serif italic text-[#141414]">Bill of Materials</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.bom.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-[#141414] rounded-none hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group">
              <div>
                <p className="font-medium">{item.item}</p>
                <p className="text-xs text-[#141414]/60 group-hover:text-[#E4E3E0]/60 font-mono mt-1">{item.quantity} {item.unit}</p>
              </div>
              <p className="font-mono text-sm">${item.estimatedCost.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wrench className="text-[#141414]" size={20} strokeWidth={1.5} aria-hidden="true" />
            <h3 className="text-2xl font-light serif italic text-[#141414]">Assembly Instructions</h3>
          </div>
          {canPersist && totalSteps > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#141414]/60">
              <CheckCircle2 size={12} aria-hidden="true" />
              <span aria-label={`${doneCount} of ${totalSteps} steps done`}>
                {doneCount} / {totalSteps} done
              </span>
            </div>
          )}
        </div>
        <div className="space-y-12" onMouseLeave={() => onStepHover?.(null)}>
          {plan.instructions.map((step, i) => {
            const isString = typeof step === 'string';
            const text = isString ? step : step.text;
            const activeParts = isString ? null : step.activeParts;
            const imagePrompt = isString ? null : step.imagePrompt;
            const reaction = reactions[String(i)];

            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col md:flex-row gap-8 group cursor-default border-t border-[#141414]/20 pt-8 first:border-0 first:pt-0",
                  reaction === "done" && "opacity-60",
                  reaction === "skip" && "opacity-40"
                )}
                onMouseEnter={() => onStepHover?.(activeParts || null)}
              >
                <div className="flex gap-6 flex-1">
                  <div className={cn(
                    "shrink-0 w-12 h-12 border border-[#141414] flex items-center justify-center text-lg font-serif italic text-[#141414] group-hover:bg-[#141414] group-hover:text-[#E4E3E0] transition-all",
                    reaction === "done" && "bg-[#141414] text-[#E4E3E0]",
                    reaction === "issue" && "bg-yellow-100 text-[#141414] border-yellow-700"
                  )}>
                    {reaction === "done" ? (
                      <Check size={18} strokeWidth={2} aria-hidden="true" />
                    ) : reaction === "issue" ? (
                      <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
                    ) : (
                      String(i + 1).padStart(2, '0')
                    )}
                  </div>
                  <div className="space-y-4 flex-1">
                    <p className={cn(
                      "text-[#141414]/80 leading-relaxed pt-1 group-hover:text-[#141414] transition-colors text-base",
                      reaction === "done" && "line-through decoration-[#141414]/50"
                    )}>
                      {text}
                    </p>
                    {activeParts && activeParts.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {activeParts.map((part, idx) => (
                          <span key={idx} className="px-2 py-1 bg-[#141414] text-[#E4E3E0] text-[10px] uppercase tracking-widest border border-[#141414] font-mono">
                            {part}
                          </span>
                        ))}
                      </div>
                    )}
                    {canPersist && (
                      <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label={`Mark step ${i + 1}`}>
                        {([
                          { key: "done", label: "Done", icon: Check },
                          { key: "skip", label: "Skip", icon: SkipForward },
                          { key: "issue", label: "Issue", icon: AlertTriangle },
                        ] as const).map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleReaction(i, key)}
                            aria-pressed={reaction === key}
                            aria-label={`Mark step ${i + 1} ${label.toLowerCase()}`}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors",
                              reaction === key
                                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                                : "bg-[#E4E3E0] text-[#141414]/70 border-[#141414]/40 hover:border-[#141414] hover:text-[#141414]"
                            )}
                          >
                            <Icon size={11} strokeWidth={1.8} aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {imagePrompt && (
                  <div className="md:w-1/3 shrink-0">
                    <StepImage prompt={imagePrompt} stepIndex={i} planName={plan.name} stepText={text} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      </div>
      <div className="p-4 border-t border-[#141414] bg-[#E4E3E0] shrink-0">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Request changes to this design..."
            className="w-full pl-4 pr-12 py-3 bg-[#E4E3E0] border border-[#141414] rounded-none focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all text-sm font-sans placeholder:text-[#141414]/40"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#141414] text-[#E4E3E0] rounded-none hover:bg-[#141414]/80 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={1.5} />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
