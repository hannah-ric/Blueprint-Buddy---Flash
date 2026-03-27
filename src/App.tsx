import { useState, useEffect, lazy, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { ChatInterface } from "./components/ChatInterface";
import { PlanDetails } from "./components/PlanDetails";
import { Auth } from "./components/Auth";
import { ProjectHistory } from "./components/ProjectHistory";
import { EmptyState } from "./components/EmptyState";

const ThreeDViewer = lazy(() => import("./components/ThreeDViewer").then(m => ({ default: m.ThreeDViewer })));
import { BuildPlan, ChatMessage } from "./types";
import { generateBuildPlan } from "./services/gemini";
import { Hammer, Layout, Boxes, History, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { handleFirestoreError, OperationType } from "./lib/firestore-errors";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<BuildPlan | null>(null);
  const [planVersions, setPlanVersions] = useState<BuildPlan[]>([]);
  const [history, setHistory] = useState<BuildPlan[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"design" | "history">("design");
  const [mobileView, setMobileView] = useState<"chat" | "plan">("chat");
  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  const [designStyle, setDesignStyle] = useState<string>("Mid-Century Modern");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribeAuth();
  }, []);

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
        } as BuildPlan;
      });
      setHistory(plans);
      setIsHistoryLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "plans");
      setIsHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (content: string, imageData?: string, imageMimeType?: string) => {
    if (!user) {
      setMessages(prev => [...prev,
        { role: "user", content },
        { role: "model", content: "Please sign in to generate build plans." }
      ]);
      return;
    }

    const userMessage: ChatMessage = { role: "user", content, imageData, imageMimeType };
    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const plan = await generateBuildPlan(newMessages, user.uid, experienceLevel, designStyle);
      await addDoc(collection(db, "plans"), {
        ...plan,
        createdAt: serverTimestamp(),
      }).catch((dbError) => {
        handleFirestoreError(dbError, OperationType.CREATE, "plans");
      });
      const versionNumber = planVersions.length + 1;
      const versionedPlan = { ...plan, version: versionNumber };
      setPlanVersions(prev => [...prev, versionedPlan]);
      setCurrentPlan(versionedPlan);

      let chatContent = `I've generated a build plan for your ${plan.name}. You can see the details and 3D preview now.`;
      if (plan.changesSummary) {
        chatContent += `\n\n**Changes made:**\n${plan.changesSummary}`;
      }
      if (plan.warnings && plan.warnings.length > 0) {
        chatContent += `\n\n_Note: ${plan.warnings.length} warning(s) found — see plan details._`;
      }
      setMessages(prev => [...prev, { role: "model", content: chatContent, hasPlan: true }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "model", content: "Sorry, I encountered an error generating your plan. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVersion = (version: number) => {
    const selected = planVersions.find(v => v.version === version);
    if (selected) setCurrentPlan(selected);
  };

  const handleRevertToVersion = (version: number) => {
    const selected = planVersions.find(v => v.version === version);
    if (selected) {
      const revertedPlan = { ...selected, version: planVersions.length + 1 };
      setPlanVersions(prev => [...prev, revertedPlan]);
      setCurrentPlan(revertedPlan);
      setMessages(prev => [...prev, { role: "model", content: `Reverted to version ${version} of the plan.`, hasPlan: true }]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-16 bg-[#141414] flex flex-col items-center py-6 gap-8 shrink-0">
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white">
          <Hammer size={24} />
        </div>
        
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => setActiveTab("design")}
            className={cn("p-3 rounded-xl transition-all", activeTab === "design" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
          >
            <Layout size={20} />
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn("p-3 rounded-xl transition-all", activeTab === "history" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
          >
            <History size={20} />
          </button>
        </nav>

        <div className="mt-auto">
          <Boxes className="text-gray-700" size={20} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "design" ? (
            <motion.div 
              key="design"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex overflow-hidden"
            >
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                onViewPlan={() => setMobileView("plan")}
                className={cn(mobileView === "chat" ? "flex" : "hidden md:flex")}
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                designStyle={designStyle}
                setDesignStyle={setDesignStyle}
              />
              
              <div className={cn("flex-1 flex-col overflow-hidden bg-white", mobileView === "plan" ? "flex" : "hidden md:flex")}>
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      onClick={() => setMobileView("chat")}
                      className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-sm font-mono uppercase tracking-[0.2em] text-gray-400 truncate">Workspace / {currentPlan?.name || "New Project"}</h1>
                  </div>
                  <Auth user={user} />
                </header>

                <div className="flex-1 flex overflow-hidden">
                  {currentPlan ? (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      <div className="w-full md:w-1/2 h-1/2 md:h-full border-r border-gray-200">
                        <Suspense fallback={<div className="w-full h-full bg-[#E4E3E0] flex items-center justify-center text-gray-400 text-sm">Loading 3D viewer...</div>}>
                          <ThreeDViewer name={currentPlan.name} parts={currentPlan.modelParts} />
                        </Suspense>
                      </div>
                      <PlanDetails
                        plan={currentPlan}
                        planVersions={planVersions}
                        onSelectVersion={handleSelectVersion}
                        onRevertToVersion={handleRevertToVersion}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                <h1 className="text-sm font-mono uppercase tracking-[0.2em] text-gray-400">Project History</h1>
                <Auth user={user} />
              </header>
              
              <ProjectHistory 
                user={user} 
                history={history} 
                isLoading={isHistoryLoading}
                onSelectPlan={(plan) => {
                  const loadedPlan = { ...plan, version: 1 };
                  setCurrentPlan(loadedPlan);
                  setPlanVersions([loadedPlan]);
                  setActiveTab("design");
                  setMobileView("plan");
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
