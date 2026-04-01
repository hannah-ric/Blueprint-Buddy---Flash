import { BuildPlan } from "../types";
import { Download, FileText, Package, Wrench, Lightbulb, Send, Loader2, Image as ImageIcon } from "lucide-react";
import Markdown from "react-markdown";
import { motion } from "motion/react";
import { useState } from "react";

interface PlanDetailsProps {
  plan: BuildPlan;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStepHover?: (parts: string[] | null) => void;
}

export function PlanDetails({ plan, onSendMessage, isLoading, onStepHover }: PlanDetailsProps) {
  const [input, setInput] = useState("");

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
        plan.cutList.map(item => `${item.part},${item.quantity},${item.thickness},${item.width},${item.length},${item.material}`).join("\n");
      filename = `${plan.name.replace(/\s+/g, '_')}_cutlist.csv`;
    } else {
      content = "Item,Quantity,Unit,Estimated Cost\n" + 
        plan.bom.map(item => `${item.item},${item.quantity},${item.unit},${item.estimatedCost}`).join("\n");
      filename = `${plan.name.replace(/\s+/g, '_')}_bom.csv`;
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-white"
    >
      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-3xl font-light serif italic">Specifications</h2>
          <div className="flex gap-4">
            <button onClick={() => downloadCSV('cutlist')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-orange-600 transition-colors">
              <Download size={14} /> Export Cut List
            </button>
            <button onClick={() => downloadCSV('bom')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-orange-600 transition-colors">
              <Download size={14} /> Export BOM
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-mono mb-1">Style</p>
            <p className="font-mono text-sm">{plan.designStyle || "N/A"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-mono mb-1">Dimensions</p>
            <p className="font-mono text-sm">{plan.dimensions}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-mono mb-1">Material</p>
            <p className="font-mono text-sm">{plan.material}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-mono mb-1">Joinery</p>
            <p className="font-mono text-sm">{plan.joinery}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-400 font-mono mb-1">Created</p>
            <p className="font-mono text-sm">{new Date(plan.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      {plan.designNotes && (
        <section className="space-y-4 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
          <div className="flex items-center gap-3">
            <Lightbulb className="text-orange-600" size={20} />
            <h3 className="text-xl font-medium text-orange-900">Why This Design Works</h3>
          </div>
          <div className="text-sm text-orange-800 leading-relaxed whitespace-pre-wrap markdown-body prose prose-sm prose-orange max-w-none">
            <Markdown>{plan.designNotes}</Markdown>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-orange-600" size={20} />
          <h3 className="text-xl font-medium">Cut List ({plan.units})</h3>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-gray-500">Part</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-gray-500">Qty</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-gray-500">T ({plan.units})</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-gray-500">W ({plan.units})</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-gray-500">L ({plan.units})</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-gray-500">Material</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plan.cutList.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.part}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{item.thickness}</td>
                  <td className="px-4 py-3">{item.width}</td>
                  <td className="px-4 py-3">{item.length}</td>
                  <td className="px-4 py-3 text-gray-500">{item.material}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Package className="text-orange-600" size={20} />
          <h3 className="text-xl font-medium">Bill of Materials</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.bom.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-orange-200 transition-all">
              <div>
                <p className="font-medium">{item.item}</p>
                <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
              </div>
              <p className="font-mono text-sm text-gray-600">${item.estimatedCost.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Wrench className="text-orange-600" size={20} />
          <h3 className="text-xl font-medium">Assembly Instructions</h3>
        </div>
        <div className="space-y-8" onMouseLeave={() => onStepHover?.(null)}>
          {plan.instructions.map((step, i) => {
            const isString = typeof step === 'string';
            const text = isString ? step : step.text;
            const activeParts = isString ? null : step.activeParts;
            const imageUrl = isString ? null : step.imageUrl;
            
            return (
              <div 
                key={i} 
                className="flex flex-col md:flex-row gap-6 group cursor-default"
                onMouseEnter={() => onStepHover?.(activeParts || null)}
              >
                <div className="flex gap-6 flex-1">
                  <div className="shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-xs font-mono text-gray-400 group-hover:border-orange-500 group-hover:text-orange-600 transition-all">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="space-y-4 flex-1">
                    <p className="text-gray-700 leading-relaxed pt-1 group-hover:text-gray-900 transition-colors">{text}</p>
                    {activeParts && activeParts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {activeParts.map((part, idx) => (
                          <span key={idx} className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] uppercase tracking-wider rounded border border-orange-100 font-mono">
                            {part}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {imageUrl && (
                  <div className="md:w-1/3 shrink-0">
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video relative flex items-center justify-center">
                      <img 
                        src={imageUrl} 
                        alt={`Step ${i + 1} illustration`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('fallback-icon');
                        }}
                      />
                      <div className="absolute inset-0 items-center justify-center text-gray-300 hidden [.fallback-icon_&]:flex">
                        <ImageIcon size={32} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Request changes to this design..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:hover:bg-orange-600 transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
