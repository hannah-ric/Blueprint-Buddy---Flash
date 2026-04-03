import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Download,
  Check,
  ChevronRight,
  Star,
  Package,
  Wrench,
  Megaphone,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { SkillBundle, InstalledBundle } from "../types";

interface MarketplaceProps {
  user: User | null;
}

const BUNDLE_ICONS: Record<string, React.ReactNode> = {
  Wrench: <Wrench size={24} />,
  Megaphone: <Megaphone size={24} />,
  Briefcase: <Briefcase size={24} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  engineering: "from-blue-500 to-cyan-500",
  marketing: "from-pink-500 to-rose-500",
  leadership: "from-amber-500 to-orange-500",
  design: "from-violet-500 to-purple-500",
  general: "from-gray-500 to-slate-500",
};

export function Marketplace({ user }: MarketplaceProps) {
  const [bundles, setBundles] = useState<SkillBundle[]>([]);
  const [installed, setInstalled] = useState<InstalledBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<SkillBundle | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"browse" | "installed">("browse");

  const fetchBundles = useCallback(async () => {
    try {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/marketplace/bundles${params}`);
      const data = await res.json();
      setBundles(data.bundles);
    } catch (err) {
      console.error("Failed to fetch bundles:", err);
    }
  }, [searchQuery]);

  const fetchInstalled = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/marketplace/installed?userId=${user.uid}`);
      const data = await res.json();
      setInstalled(data.installed);
    } catch (err) {
      console.error("Failed to fetch installed:", err);
    }
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchBundles(), fetchInstalled()]).finally(() => setIsLoading(false));
  }, [fetchBundles, fetchInstalled]);

  const handleInstall = async (bundleId: string) => {
    if (!user) return;
    setInstallingId(bundleId);
    try {
      await fetch("/api/marketplace/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId, userId: user.uid }),
      });
      await fetchInstalled();
    } catch (err) {
      console.error("Install failed:", err);
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = async (bundleId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/marketplace/install/${bundleId}?userId=${user.uid}`, {
        method: "DELETE",
      });
      await fetchInstalled();
    } catch (err) {
      console.error("Uninstall failed:", err);
    }
  };

  const handleToggle = async (bundleId: string, enabled: boolean) => {
    if (!user) return;
    try {
      await fetch(`/api/marketplace/install/${bundleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, enabled }),
      });
      await fetchInstalled();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const isInstalled = (bundleId: string) => installed.some((b) => b.bundleId === bundleId);
  const getInstalledEntry = (bundleId: string) => installed.find((b) => b.bundleId === bundleId);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500">Sign in to access the Skills Marketplace.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Marketplace Header */}
      <div className="px-8 pt-6 pb-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {selectedBundle && (
              <button
                onClick={() => setSelectedBundle(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedBundle ? selectedBundle.displayName : "Skills Marketplace"}
            </h2>
          </div>
          {!selectedBundle && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView("browse")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeView === "browse"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveView("installed")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeView === "installed"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Installed ({installed.length})
              </button>
            </div>
          )}
        </div>

        {!selectedBundle && activeView === "browse" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skill bundles..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {selectedBundle ? (
            <BundleDetail
              key="detail"
              bundle={selectedBundle}
              isInstalled={isInstalled(selectedBundle.id)}
              installedEntry={getInstalledEntry(selectedBundle.id)}
              installingId={installingId}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
              onToggle={handleToggle}
            />
          ) : activeView === "browse" ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {bundles.map((bundle, index) => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  index={index}
                  isInstalled={isInstalled(bundle.id)}
                  installingId={installingId}
                  onInstall={handleInstall}
                  onSelect={() => setSelectedBundle(bundle)}
                />
              ))}
              {bundles.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-400 text-sm">No skill bundles found matching your search.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="installed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InstalledList
                installed={installed}
                bundles={bundles}
                onUninstall={handleUninstall}
                onToggle={handleToggle}
                onSelect={(b) => setSelectedBundle(b)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function BundleCard({
  bundle,
  index,
  isInstalled,
  installingId,
  onInstall,
  onSelect,
}: {
  bundle: SkillBundle;
  index: number;
  isInstalled: boolean;
  installingId: string | null;
  onInstall: (id: string) => void;
  onSelect: () => void;
}) {
  const isInstalling = installingId === bundle.id;
  const gradientClass = CATEGORY_COLORS[bundle.category] || CATEGORY_COLORS.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-400 transition-all shadow-sm hover:shadow-md"
    >
      {/* Gradient Header */}
      <div className={cn("h-24 bg-gradient-to-br flex items-center justify-center text-white", gradientClass)}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          {BUNDLE_ICONS[bundle.icon] || <Package size={24} />}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3
            onClick={onSelect}
            className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors cursor-pointer"
          >
            {bundle.displayName}
          </h3>
          <div className="flex items-center gap-1 text-amber-500 text-xs shrink-0 ml-2">
            <Star size={12} fill="currentColor" />
            <span>{bundle.rating}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{bundle.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {bundle.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-50 rounded-full text-[10px] font-mono text-gray-500">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>{bundle.skills.length} skills</span>
            <span>{bundle.installCount.toLocaleString()} installs</span>
          </div>

          {isInstalled ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <Check size={14} /> Installed
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInstall(bundle.id);
              }}
              disabled={isInstalling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isInstalling ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Install
            </button>
          )}
        </div>
      </div>

      {/* Click target for details */}
      <button onClick={onSelect} className="absolute inset-0 opacity-0" aria-label={`View ${bundle.displayName} details`} />
      <div className="relative">
        <button
          onClick={onSelect}
          className="w-full flex items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-gray-400 hover:text-orange-600 transition-colors border-t border-gray-100"
        >
          View Details <ChevronRight size={10} />
        </button>
      </div>
    </motion.div>
  );
}

function BundleDetail({
  bundle,
  isInstalled,
  installedEntry,
  installingId,
  onInstall,
  onUninstall,
  onToggle,
}: {
  bundle: SkillBundle;
  isInstalled: boolean;
  installedEntry: InstalledBundle | undefined;
  installingId: string | null;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const isInstalling = installingId === bundle.id;
  const gradientClass = CATEGORY_COLORS[bundle.category] || CATEGORY_COLORS.general;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Hero */}
      <div className={cn("rounded-2xl bg-gradient-to-br p-8 text-white mb-8", gradientClass)}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                {BUNDLE_ICONS[bundle.icon] || <Package size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{bundle.displayName}</h2>
                <p className="text-sm text-white/70">by {bundle.author} &middot; v{bundle.version}</p>
              </div>
            </div>
            <p className="text-sm text-white/80 max-w-xl">{bundle.description}</p>
          </div>

          <div className="text-right shrink-0 ml-6">
            <div className="flex items-center gap-1 text-amber-200 mb-1">
              <Star size={16} fill="currentColor" />
              <span className="text-lg font-bold">{bundle.rating}</span>
            </div>
            <p className="text-xs text-white/60">{bundle.installCount.toLocaleString()} installs</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          {isInstalled ? (
            <>
              <button
                onClick={() => onToggle(bundle.id, !installedEntry?.enabled)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  installedEntry?.enabled
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                )}
              >
                {installedEntry?.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {installedEntry?.enabled ? "Enabled" : "Disabled"}
              </button>
              <button
                onClick={() => onUninstall(bundle.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-100 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 size={14} /> Uninstall
              </button>
            </>
          ) : (
            <button
              onClick={() => onInstall(bundle.id)}
              disabled={isInstalling}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isInstalling ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Install Bundle
            </button>
          )}
        </div>
      </div>

      {/* Skills List */}
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Included Skills ({bundle.skills.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bundle.skills.map((skill) => (
          <div
            key={skill.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                <Package size={16} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">{skill.name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{skill.description}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-gray-50 rounded text-[10px] font-mono text-gray-400 uppercase">
                  {skill.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {bundle.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function InstalledList({
  installed,
  bundles,
  onUninstall,
  onToggle,
  onSelect,
}: {
  installed: InstalledBundle[];
  bundles: SkillBundle[];
  onUninstall: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onSelect: (bundle: SkillBundle) => void;
}) {
  if (installed.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="mx-auto mb-4 text-gray-300" size={48} />
        <p className="text-gray-500 mb-2">No skill bundles installed yet.</p>
        <p className="text-gray-400 text-sm">Browse the marketplace to find skills that enhance your designs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {installed.map((entry) => {
        const bundle = bundles.find((b) => b.id === entry.bundleId);
        if (!bundle) return null;
        const gradientClass = CATEGORY_COLORS[bundle.category] || CATEGORY_COLORS.general;

        return (
          <motion.div
            key={entry.bundleId}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-5"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                gradientClass
              )}
            >
              {BUNDLE_ICONS[bundle.icon] || <Package size={20} />}
            </div>

            <div className="flex-1 min-w-0">
              <button onClick={() => onSelect(bundle)} className="text-left">
                <h3 className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                  {bundle.displayName}
                </h3>
              </button>
              <p className="text-xs text-gray-500 mt-0.5">
                {bundle.skills.length} skills &middot; v{entry.version} &middot; Installed{" "}
                {new Date(entry.installedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggle(entry.bundleId, !entry.enabled)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  entry.enabled
                    ? "text-green-600 hover:bg-green-50"
                    : "text-gray-400 hover:bg-gray-100"
                )}
                title={entry.enabled ? "Disable" : "Enable"}
              >
                {entry.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
              <button
                onClick={() => onUninstall(entry.bundleId)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Uninstall"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
