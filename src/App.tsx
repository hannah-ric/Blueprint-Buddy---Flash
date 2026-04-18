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
import { Hammer, Layout, Boxes, History, ChevronLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { handleFirestoreError, OperationType } from "./lib/firestore-errors";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<BuildPlan | null>(null);
  const [history, setHistory] = useState<BuildPlan[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"design" | "history">("design");
  const [mobileView, setMobileView] = useState<"chat" | "plan">("chat");
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [activeStepParts, setActiveStepParts] = useState<string[] | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  const [designStyle, setDesignStyle] = useState<string>("Mid-Century Modern");
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error;
  }

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
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, "plans");
      } catch (e) {
        setError(e as Error);
      }
      setIsHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (content: string, imageData?: string, imageMimeType?: string) => {
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
      const response = await generateBuildPlan(newMessages, experienceLevel, designStyle);
      
      if (response.isClarifying) {
        setMessages(prev => [...prev, { role: "model", content: response.message }]);
      } else {
        const plan = response.plan;
        try {
          await addDoc(collection(db, "plans"), {
            ...plan,
            userId: user.uid,
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          try {
            handleFirestoreError(dbError, OperationType.CREATE, "plans");
          } catch (e) {
            setError(e as Error);
          }
        }
        setCurrentPlan(plan);
        setMessages(prev => [...prev, { role: "model", content: `I've generated a build plan for your ${plan.name}. You can see the details and 3D preview now.`, hasPlan: true, planData: JSON.stringify(plan) }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "model", content: "Sorry, I encountered an error generating your plan. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar Navigation */}
      <aside className="w-16 bg-[#141414] flex flex-col items-center py-6 gap-8 shrink-0 border-r border-[#141414]">
        <div className="w-10 h-10 bg-[#E4E3E0] rounded-none flex items-center justify-center text-[#141414] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
          <Hammer size={20} strokeWidth={1.5} />
        </div>
        
        <nav className="flex flex-col gap-6 mt-4">
          <button 
            onClick={() => {
              setActiveTab("design");
              setCurrentPlan(null);
              setMessages([]);
            }}
            className="p-2 transition-all relative group text-gray-500 hover:text-[#E4E3E0]"
            title="New Project"
          >
            <Boxes size={20} strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => setActiveTab("design")}
            className={cn("p-2 transition-all relative group", activeTab === "design" ? "text-[#E4E3E0]" : "text-gray-500 hover:text-gray-300")}
            title="Design"
          >
            <Layout size={20} strokeWidth={1.5} />
            {activeTab === "design" && (
              <motion.div layoutId="activeTab" className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#E4E3E0]" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn("p-2 transition-all relative group", activeTab === "history" ? "text-[#E4E3E0]" : "text-gray-500 hover:text-gray-300")}
            title="History"
          >
            <History size={20} strokeWidth={1.5} />
            {activeTab === "history" && (
              <motion.div layoutId="activeTab" className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#E4E3E0]" />
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
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
                className={cn(mobileView === "chat" ? "flex" : "hidden", isChatCollapsed ? "md:hidden" : "md:flex", "border-r border-[#141414]")}
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                designStyle={designStyle}
                setDesignStyle={setDesignStyle}
              />
              
              <div className={cn("flex-1 flex-col overflow-hidden bg-[#E4E3E0]", mobileView === "plan" ? "flex" : "hidden md:flex")}>
                <header className="h-14 bg-[#E4E3E0] border-b border-[#141414] flex items-center justify-between px-4 md:px-6 shrink-0">
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      onClick={() => setMobileView("chat")}
                      className="md:hidden p-2 -ml-2 text-[#141414] hover:bg-[#141414]/10 rounded-none"
                    >
                      <ChevronLeft size={20} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                      className="hidden md:flex p-2 -ml-2 text-[#141414] hover:bg-[#141414]/10 rounded-none"
                      title={isChatCollapsed ? "Expand Chat" : "Collapse Chat"}
                    >
                      {isChatCollapsed ? <PanelLeftOpen size={20} strokeWidth={1.5} /> : <PanelLeftClose size={20} strokeWidth={1.5} />}
                    </button>
                    <h1 className="text-xs font-mono uppercase tracking-[0.1em] text-[#141414] truncate font-semibold">
                      {currentPlan ? `Workspace / ${currentPlan.name}` : "Workspace / New Project"}
                    </h1>
                  </div>
                  <Auth user={user} />
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
