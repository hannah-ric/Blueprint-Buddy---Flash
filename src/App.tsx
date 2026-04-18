import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { ChatInterface } from "./components/ChatInterface";
import { ThreeDViewer } from "./components/ThreeDViewer";
import { PlanDetails } from "./components/PlanDetails";
import { Auth } from "./components/Auth";
import { ProjectHistory } from "./components/ProjectHistory";
import { EmptyState } from "./components/EmptyState";
import { Banner } from "./components/Banner";
import { BuildPlan, ChatMessage } from "./types";
import { generateBuildPlan } from "./services/gemini";
import { Hammer, Layout, Boxes, History, ChevronLeft, PanelLeftClose, PanelLeftOpen, Undo2, Redo2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { handleFirestoreError, OperationType } from "./lib/firestore-errors";
import { prepareMessagesForServer } from "./lib/chat-context";
import { loadSession, saveSession, clearSession } from "./lib/storage";

const MAX_HISTORY = 20;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<BuildPlan | null>(null);
  const [planVersions, setPlanVersions] = useState<{ stack: BuildPlan[]; index: number }>({ stack: [], index: -1 });
  const [history, setHistory] = useState<BuildPlan[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"design" | "history">("design");
  const [mobileView, setMobileView] = useState<"chat" | "plan">("chat");
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [activeStepParts, setActiveStepParts] = useState<string[] | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  const [designStyle, setDesignStyle] = useState<string>("Mid-Century Modern");
  const [banner, setBanner] = useState<string | null>(null);

  const hasHydrated = useRef(false);

  // Hydrate from localStorage exactly once.
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    const saved = loadSession();
    if (!saved) return;
    if (saved.messages?.length) setMessages(saved.messages);
    if (saved.currentPlan) {
      setCurrentPlan(saved.currentPlan);
      setPlanVersions({ stack: [saved.currentPlan], index: 0 });
    }
    if (saved.experienceLevel) setExperienceLevel(saved.experienceLevel);
    if (saved.designStyle) setDesignStyle(saved.designStyle);
  }, []);

  // Auth subscription.
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  // Autosave session. Debounced via microtask-less simple write; localStorage
  // writes are synchronous but cheap for this payload size.
  useEffect(() => {
    if (!hasHydrated.current) return;
    saveSession({
      userId: user?.uid ?? null,
      currentPlan,
      messages,
      experienceLevel,
      designStyle,
    });
  }, [user, currentPlan, messages, experienceLevel, designStyle]);

  // Firestore subscription for the user's saved plans.
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    const q = query(
      collection(db, "plans"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plans = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || new Date().toISOString(),
          } as BuildPlan;
        });
        setHistory(plans);
        setIsHistoryLoading(false);
      },
      (err) => {
        const msg = handleFirestoreError(err, OperationType.LIST, "plans");
        setBanner(msg);
        setIsHistoryLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const pushPlanVersion = useCallback((plan: BuildPlan) => {
    setCurrentPlan(plan);
    setPlanVersions((prev) => {
      const trimmed = prev.stack.slice(0, prev.index + 1);
      const stack = [...trimmed, plan].slice(-MAX_HISTORY);
      return { stack, index: stack.length - 1 };
    });
  }, []);

  const canUndo = planVersions.index > 0;
  const canRedo = planVersions.index >= 0 && planVersions.index < planVersions.stack.length - 1;

  const handleUndo = useCallback(() => {
    setPlanVersions((prev) => {
      if (prev.index <= 0) return prev;
      const nextIndex = prev.index - 1;
      setCurrentPlan(prev.stack[nextIndex]);
      return { ...prev, index: nextIndex };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setPlanVersions((prev) => {
      if (prev.index < 0 || prev.index >= prev.stack.length - 1) return prev;
      const nextIndex = prev.index + 1;
      setCurrentPlan(prev.stack[nextIndex]);
      return { ...prev, index: nextIndex };
    });
  }, []);

  const resetWorkspace = useCallback(() => {
    setActiveTab("design");
    setCurrentPlan(null);
    setMessages([]);
    setPlanVersions({ stack: [], index: -1 });
    setActiveStepParts(null);
    clearSession();
  }, []);

  const handleSendMessage = async (content: string, imageData?: string, imageMimeType?: string) => {
    setMobileView("chat");
    if (!user) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content },
        { role: "model", content: "Please sign in to generate build plans." },
      ]);
      return;
    }

    const newMessages: ChatMessage[] = [...messages, { role: "user", content, imageData, imageMimeType }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const payload = prepareMessagesForServer(newMessages);
      const response = await generateBuildPlan(payload, experienceLevel, designStyle);

      if (response.isClarifying) {
        setMessages((prev) => [...prev, { role: "model", content: response.message }]);
      } else {
        const plan = response.plan as BuildPlan;
        pushPlanVersion(plan);
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: `I've generated a build plan for your ${plan.name}. You can see the details and 3D preview now.`,
            hasPlan: true,
            planData: JSON.stringify(plan),
          },
        ]);

        // Persist to Firestore. Failures are non-fatal — the plan is still
        // usable locally and the user sees a banner.
        try {
          await addDoc(collection(db, "plans"), {
            ...plan,
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
        } catch (dbError) {
          const msg = handleFirestoreError(dbError, OperationType.CREATE, "plans");
          setBanner(msg);
        }
      }
    } catch (error) {
      console.error("Plan generation failed:", error);
      const friendly =
        error instanceof Error && error.message
          ? error.message
          : "Sorry, I encountered an error generating your plan. Please try again.";
      setMessages((prev) => [...prev, { role: "model", content: friendly }]);
    } finally {
      setIsLoading(false);
    }
  };

  const workspaceTitle = useMemo(
    () => (currentPlan ? `Workspace / ${currentPlan.name}` : "Workspace / New Project"),
    [currentPlan]
  );

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <aside className="w-16 bg-[#141414] flex flex-col items-center py-6 gap-8 shrink-0 border-r border-[#141414]">
        <div className="w-10 h-10 bg-[#E4E3E0] rounded-none flex items-center justify-center text-[#141414] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
          <Hammer size={20} strokeWidth={1.5} aria-hidden="true" />
        </div>

        <nav className="flex flex-col gap-6 mt-4">
          <button
            type="button"
            onClick={resetWorkspace}
            aria-label="New project"
            className="p-2 transition-all relative group text-gray-500 hover:text-[#E4E3E0]"
            title="New Project"
          >
            <Boxes size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("design")}
            aria-label="Design workspace"
            aria-current={activeTab === "design" ? "page" : undefined}
            className={cn(
              "p-2 transition-all relative group",
              activeTab === "design" ? "text-[#E4E3E0]" : "text-gray-500 hover:text-gray-300"
            )}
            title="Design"
          >
            <Layout size={20} strokeWidth={1.5} aria-hidden="true" />
            {activeTab === "design" && (
              <motion.div layoutId="activeTab" className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#E4E3E0]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            aria-label="Project history"
            aria-current={activeTab === "history" ? "page" : undefined}
            className={cn(
              "p-2 transition-all relative group",
              activeTab === "history" ? "text-[#E4E3E0]" : "text-gray-500 hover:text-gray-300"
            )}
            title="History"
          >
            <History size={20} strokeWidth={1.5} aria-hidden="true" />
            {activeTab === "history" && (
              <motion.div layoutId="activeTab" className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#E4E3E0]" />
            )}
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Banner message={banner} onDismiss={() => setBanner(null)} />
        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "design" ? (
              <motion.div
                key="design"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex overflow-hidden"
              >
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  onViewPlan={() => setMobileView("plan")}
                  hasPlan={!!currentPlan}
                  className={cn(
                    mobileView === "chat" ? "flex" : "hidden",
                    isChatCollapsed ? "md:hidden" : "md:flex",
                    "border-r border-[#141414]"
                  )}
                  experienceLevel={experienceLevel}
                  setExperienceLevel={setExperienceLevel}
                  designStyle={designStyle}
                  setDesignStyle={setDesignStyle}
                />

                <div
                  className={cn(
                    "flex-1 flex-col overflow-hidden bg-[#E4E3E0]",
                    mobileView === "plan" || currentPlan ? "flex" : "hidden md:flex"
                  )}
                >
                  <header className="h-14 bg-[#E4E3E0] border-b border-[#141414] flex items-center justify-between px-4 md:px-6 shrink-0">
                    <div className="flex items-center gap-2 md:gap-4 min-w-0">
                      <button
                        type="button"
                        onClick={() => setMobileView("chat")}
                        aria-label="Back to chat"
                        className="md:hidden p-2 -ml-2 text-[#141414] hover:bg-[#141414]/10 rounded-none"
                      >
                        <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                        aria-label={isChatCollapsed ? "Expand chat panel" : "Collapse chat panel"}
                        aria-pressed={isChatCollapsed}
                        className="hidden md:flex p-2 -ml-2 text-[#141414] hover:bg-[#141414]/10 rounded-none"
                        title={isChatCollapsed ? "Expand Chat" : "Collapse Chat"}
                      >
                        {isChatCollapsed ? (
                          <PanelLeftOpen size={20} strokeWidth={1.5} aria-hidden="true" />
                        ) : (
                          <PanelLeftClose size={20} strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </button>
                      <h1 className="text-xs font-mono uppercase tracking-[0.1em] text-[#141414] truncate font-semibold">
                        {workspaceTitle}
                      </h1>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentPlan && (planVersions.stack.length > 1 || canRedo) && (
                        <div className="hidden md:flex items-center gap-1 mr-2">
                          <button
                            type="button"
                            onClick={handleUndo}
                            disabled={!canUndo}
                            aria-label="Undo last plan change"
                            title="Undo"
                            className="p-2 text-[#141414] hover:bg-[#141414]/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-none transition-colors"
                          >
                            <Undo2 size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRedo}
                            disabled={!canRedo}
                            aria-label="Redo plan change"
                            title="Redo"
                            className="p-2 text-[#141414] hover:bg-[#141414]/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-none transition-colors"
                          >
                            <Redo2 size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                      <Auth user={user} />
                    </div>
                  </header>

                  <div className="flex-1 flex overflow-hidden">
                    {currentPlan ? (
                      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-[#141414] relative">
                          <ThreeDViewer name={currentPlan.name} parts={currentPlan.modelParts} activeParts={activeStepParts} />
                        </div>
                        <PlanDetails
                          plan={currentPlan}
                          onSendMessage={handleSendMessage}
                          isLoading={isLoading}
                          onStepHover={setActiveStepParts}
                        />
                      </div>
                    ) : (
                      <EmptyState />
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden bg-[#E4E3E0]"
              >
                <header className="h-14 bg-[#E4E3E0] border-b border-[#141414] flex items-center justify-between px-6 shrink-0">
                  <h1 className="text-xs font-mono uppercase tracking-[0.1em] text-[#141414] font-semibold">Project History</h1>
                  <Auth user={user} />
                </header>

                <ProjectHistory
                  user={user}
                  history={history}
                  isLoading={isHistoryLoading}
                  onError={setBanner}
                  onSelectPlan={(plan) => {
                    pushPlanVersion(plan);
                    setMessages([
                      {
                        role: "model",
                        content: `I've loaded the build plan for your ${plan.name}. You can see the details and 3D preview now.`,
                        hasPlan: true,
                        planData: JSON.stringify(plan),
                      },
                    ]);
                    setActiveTab("design");
                    setMobileView("plan");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
