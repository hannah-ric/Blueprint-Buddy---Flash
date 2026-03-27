import { BuildPlan } from "../types";
import { Download, FileText, Package, Wrench, Lightbulb } from "lucide-react";
import Markdown from "react-markdown";
import { motion } from "motion/react";

interface PlanDetailsProps {
  plan: BuildPlan;
}

export function PlanDetails({ plan }: PlanDetailsProps) {
  const downloadCSV = (type: 'cutlist' | 'bom') => {
    let content = "";
    let filename = "";
    
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
      className="flex-1 overflow-y-auto bg-white p-8 space-y-12"
    >
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
