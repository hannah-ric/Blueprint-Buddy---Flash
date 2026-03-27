import { BuildPlan } from "../types";
import { Download, FileText, Package, Wrench, Lightbulb, AlertTriangle, GitCompare, ChevronDown, RotateCcw } from "lucide-react";
import Markdown from "react-markdown";
import { motion } from "motion/react";

interface PlanDetailsProps {
  plan: BuildPlan;
  planVersions?: BuildPlan[];
  onSelectVersion?: (version: number) => void;
  onRevertToVersion?: (version: number) => void;
}

export function PlanDetails({ plan, planVersions, onSelectVersion, onRevertToVersion }: PlanDetailsProps) {
  const downloadCSV = (type: 'cutlist' | 'bom') => {
    let content = "";
    let filename = "";
    
    if (type === 'cutlist') {
      content = `Part,Quantity,Thickness (${plan.units}),Width (${plan.units}),Length (${plan.units}),Material\n` + 
        plan.cutList.map(item => `${item.part},${item.quantity},${item.thickness},${item.width},${item.length},${item.material}`).join("\n");
      filename = `${plan.name.replace(/\s+/g, '_')}_cutlist.csv`;
    } else {
      const totalCost = plan.bom.reduce((sum, item) => sum + item.estimatedCost * item.quantity, 0);
      content = "Item,Quantity,Unit,Estimated Cost\n" +
        plan.bom.map(item => `${item.item},${item.quantity},${item.unit},${item.estimatedCost}`).join("\n") +
        `\nTotal,,,${totalCost.toFixed(2)}`;
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto bg-white p-8 space-y-12"
    >
      {/* Version Selector */}
      {planVersions && planVersions.length > 1 && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-gray-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Version</span>
            <div className="relative">
              <select
                value={plan.version ?? planVersions.length}
                onChange={(e) => onSelectVersion?.(parseInt(e.target.value))}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 pr-6 appearance-none"
              >
                {planVersions.map((v, i) => (
                  <option key={i} value={v.version ?? i + 1}>
                    v{v.version ?? i + 1}{i === planVersions.length - 1 ? " (latest)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {plan.version !== undefined && plan.version < (planVersions.length) && onRevertToVersion && (
            <button
              onClick={() => onRevertToVersion(plan.version!)}
              className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              <RotateCcw size={12} />
              Revert to this version
            </button>
          )}
        </div>
      )}

      {/* Warnings */}
      {plan.warnings && plan.warnings.length > 0 && (
        <section className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Plan Warnings</span>
          </div>
          <ul className="text-xs text-amber-700 space-y-1">
            {plan.warnings.map((w, i) => (
              <li key={i} className="flex gap-2"><span className="shrink-0">-</span>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Change Summary */}
      {plan.changesSummary && (
        <section className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Changes from Previous Version</span>
          </div>
          <div className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">
            <Markdown>{plan.changesSummary}</Markdown>
          </div>
        </section>
      )}

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
            <h3 className="text-xl font-medium text-orange-900">Design Reasoning & Self-Correction</h3>
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
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200">
          <p className="font-medium text-orange-900">Estimated Total</p>
          <p className="font-mono text-lg font-semibold text-orange-700">
            ${plan.bom.reduce((sum, item) => sum + item.estimatedCost * item.quantity, 0).toFixed(2)}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Wrench className="text-orange-600" size={20} />
          <h3 className="text-xl font-medium">Assembly Instructions</h3>
        </div>
        <div className="space-y-4">
          {plan.instructions.map((step, i) => (
            <div key={i} className="flex gap-6 group">
              <div className="shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-xs font-mono text-gray-400 group-hover:border-orange-500 group-hover:text-orange-600 transition-all">
                {String(i + 1).padStart(2, '0')}
              </div>
              <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
