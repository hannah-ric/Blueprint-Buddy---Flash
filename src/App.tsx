import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocFromServer, doc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { ChatInterface } from "./components/ChatInterface";
import { ThreeDViewer } from "./components/ThreeDViewer";
import { PlanDetails } from "./components/PlanDetails";
import { Auth } from "./components/Auth";
import { ProjectHistory } from "./components/ProjectHistory";
import { EmptyState } from "./components/EmptyState";
import { BuildPlan, ChatMessage } from "./types";
import { generateBuildPlan } from "./services/gemini";
import { Hammer, Layout, Boxes, History, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { handleFirestoreError, OperationType } from "./lib/firestore-errors";
import { generateViewsDXF, generatePartsDXF, downloadDXF } from "./lib/dxf-export";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<BuildPlan | null>(null);
  const [history, setHistory] = useState<BuildPlan[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"design" | "history">("design");
  const [mobileView, setMobileView] = useState<"chat" | "plan">("chat");
  const [activeStepParts, setActiveStepParts] = useState<string[] | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  const [designStyle, setDesignStyle] = useState<string>("Mid-Century Modern");

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();

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
    if (isLoading) return;
    setMobileView("chat");
    if (!user) {
      setMessages(prev => [...prev, 
        { role: "user", content },
        { role: "model", content: "Please sign in to generate build plans." }
      ]);
      return;
    }

    const newMessages: ChatMessage[] = [...messages, { role: "user", content, imageData, imageMimeType }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await generateBuildPlan(newMessages, user.uid, experienceLevel, designStyle);
      
      if (response.isClarifying) {
        setMessages(prev => [...prev, { role: "model", content: response.message }]);
      } else {
        const plan = response.plan;
        let saveWarning = "";
        try {
          await addDoc(collection(db, "plans"), {
            ...plan,
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          console.error("Failed to save plan to database:", dbError);
          saveWarning = "\n\n⚠️ Note: The plan was generated but could not be saved to your history. You may want to try again later.";
        }
        setCurrentPlan(plan);
        setMessages(prev => [...prev, { role: "model", content: `I've generated a build plan for your ${plan.name}. You can see the details and 3D preview now.${saveWarning}`, hasPlan: true, planData: JSON.stringify(plan) }]);
      }
    } catch (error) {
      console.error(error);
      let errorMsg = "Sorry, something went wrong generating your plan. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("timed out") || error.name === "AbortError") {
          errorMsg = "The request timed out — the design is taking longer than expected. Please try a simpler description or try again.";
        } else if (error.message.includes("Too many requests") || (error as Error & { statusCode?: number }).statusCode === 429) {
          errorMsg = "You've made too many requests. Please wait a few minutes and try again.";
        } else if (error.message.includes("Not authenticated")) {
          errorMsg = "You need to sign in before generating plans. Please sign in and try again.";
        } else if (error.message.includes("Failed to generate") || error.message.includes("Internal server error")) {
          errorMsg = "The AI service encountered an issue. Please try again in a moment.";
        } else if (!navigator.onLine) {
          errorMsg = "You appear to be offline. Please check your internet connection and try again.";
        }
      }
      setMessages(prev => [...prev, { role: "model", content: errorMsg }]);
    } finally {
      setIsLoading(false);
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
                        <ThreeDViewer name={currentPlan.name} parts={currentPlan.modelParts} activeParts={activeStepParts} primaryMaterial={currentPlan.material} />
                      </div>
                      <PlanDetails
                        plan={currentPlan}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        onStepHover={setActiveStepParts}
                        onExportDXF={(type) => {
                          if (!currentPlan) return;
                          const filename = currentPlan.name.replace(/\s+/g, '_');
                          if (type === 'views') {
                            const content = generateViewsDXF(currentPlan);
                            if (content) downloadDXF(content, `${filename}_views.dxf`);
                          } else {
                            const content = generatePartsDXF(currentPlan);
                            if (content) downloadDXF(content, `${filename}_parts.dxf`);
                          }
                        }}
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
                  setCurrentPlan(plan);
                  setMessages([{ role: "model", content: `I've loaded the build plan for your ${plan.name}. You can see the details and 3D preview now.`, hasPlan: true, planData: JSON.stringify(plan) }]);
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
