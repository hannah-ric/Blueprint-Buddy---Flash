import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Bot, Layout, ImagePlus, X } from "lucide-react";
import { motion } from "motion/react";
import Markdown from "react-markdown";
import { cn } from "../lib/utils";
import { ChatMessage } from "../types";

interface ChatInterfaceProps {
  onSendMessage: (message: string, imageData?: string, imageMimeType?: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onViewPlan?: () => void;
  className?: string;
  experienceLevel: string;
  setExperienceLevel: (level: string) => void;
  designStyle: string;
  setDesignStyle: (style: string) => void;
}

const STYLES = [
  "Mid-Century Modern",
  "Craftsman",
  "Shaker",
  "Industrial",
  "Farmhouse",
  "Contemporary",
  "Traditional",
  "Custom/Mixed"
];

export function ChatInterface({ onSendMessage, messages, isLoading, onViewPlan, className, experienceLevel, setExperienceLevel, designStyle, setDesignStyle }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      let imageData: string | undefined;
      let imageMimeType: string | undefined;

      if (selectedImage) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
        });
        reader.readAsDataURL(selectedImage);
        imageData = await base64Promise;
        imageMimeType = selectedImage.type;
      }

      onSendMessage(input, imageData, imageMimeType);
      setInput("");
      removeImage();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-gray-200 w-full md:max-w-md shrink-0", className)}>
      <div className="p-4 border-bottom border-gray-100 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800 italic serif">Blueprint Buddy</h2>
        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">AI Design Assistant</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Bot className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">Describe the furniture you want to build.</p>
            <p className="text-xs text-gray-400 mt-2 italic">"Walnut coffee table with tapered legs..."</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", 
              msg.role === "user" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600")}>
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn("max-w-[80%] p-3 rounded-2xl text-sm", 
              msg.role === "user" ? "bg-orange-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none")}>
              {msg.imageData && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                  <img src={`data:${msg.imageMimeType};base64,${msg.imageData}`} alt="Uploaded reference" className="w-full h-auto max-h-48 object-cover" />
                </div>
              )}
              <div className="markdown-body prose prose-sm prose-p:leading-relaxed max-w-none">
                <Markdown>{msg.content}</Markdown>
              </div>
              {msg.hasPlan && onViewPlan && (
                <button 
                  onClick={onViewPlan} 
                  className="mt-3 w-full bg-white text-orange-600 px-3 py-2 rounded-xl font-medium shadow-sm border border-orange-100 flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors md:hidden"
                >
                  <Layout size={16} />
                  View Plan & 3D Model
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white flex flex-col gap-3">
        <div className="flex flex-col gap-3 px-1 pb-1">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 shrink-0 w-16">Style:</span>
            <select
              value={designStyle}
              onChange={(e) => setDesignStyle(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500 w-full max-w-[200px]"
            >
              {STYLES.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 shrink-0 w-16">Skill:</span>
            {["Beginner", "Intermediate", "Advanced"].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setExperienceLevel(level)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full transition-colors border shrink-0",
                  experienceLevel === level 
                    ? "bg-orange-50 border-orange-200 text-orange-700 font-medium" 
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        
        {imagePreview && (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
            title="Upload reference image"
          >
            <ImagePlus size={20} />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your project..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
