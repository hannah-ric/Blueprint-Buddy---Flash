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
  hasPlan?: boolean;
  className?: string;
  experienceLevel: string;
  setExperienceLevel: (level: string) => void;
  designStyle: string;
  setDesignStyle: (style: string) => void;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB — server limit is 10MB raw, leave headroom for base64 overhead
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

export function ChatInterface({ onSendMessage, messages, isLoading, onViewPlan, hasPlan, className, experienceLevel, setExperienceLevel, designStyle, setDesignStyle }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  // We store the already-read data URL so submission doesn't need a second FileReader pass.
  const [imagePreview, setImagePreview] = useState<{ dataUrl: string; mimeType: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Unsupported image type. Use JPG, PNG, WebP, or GIF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image is too large. Max 8MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview({ dataUrl: reader.result, mimeType: file.type });
      }
    };
    reader.onerror = () => setImageError("Failed to read image.");
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!input.trim() && !imagePreview) return;

    let imageData: string | undefined;
    let imageMimeType: string | undefined;
    if (imagePreview) {
      const commaIdx = imagePreview.dataUrl.indexOf(",");
      imageData = commaIdx >= 0 ? imagePreview.dataUrl.slice(commaIdx + 1) : imagePreview.dataUrl;
      imageMimeType = imagePreview.mimeType;
    }

    onSendMessage(input.trim(), imageData, imageMimeType);
    setInput("");
    removeImage();
    inputRef.current?.focus();
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#E4E3E0] w-full md:max-w-md shrink-0", className)}>
      <div className="p-4 border-b border-[#141414] bg-[#E4E3E0]">
        <h2 className="text-xl font-semibold text-[#141414] italic serif">Blueprint Buddy</h2>
        <p className="text-[10px] text-[#141414]/60 font-mono uppercase tracking-[0.1em] mt-1">AI Design Assistant</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6" aria-live="polite" aria-busy={isLoading}>
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 mx-auto text-[#141414]/30 mb-4" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-[#141414]/60 text-sm font-mono uppercase tracking-wider">Describe your project</p>
            <p className="text-xs text-[#141414]/40 mt-2 italic serif">"Walnut coffee table with tapered legs..."</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <div className={cn("w-8 h-8 rounded-none flex items-center justify-center shrink-0 border border-[#141414]", 
              msg.role === "user" ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#E4E3E0] text-[#141414]")}>
              {msg.role === "user" ? <User size={14} strokeWidth={2} /> : <Bot size={14} strokeWidth={2} />}
            </div>
            <div className={cn("max-w-[80%] p-3 text-sm border border-[#141414]", 
              msg.role === "user" ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#E4E3E0] text-[#141414]")}>
              {msg.imageData && (
                <div className="mb-3 border border-[#141414]/20 p-1 bg-white/5">
                  <img src={`data:${msg.imageMimeType};base64,${msg.imageData}`} alt="Uploaded reference" className="w-full h-auto max-h-48 object-cover grayscale hover:grayscale-0 transition-all" />
                </div>
              )}
              <div className={cn("markdown-body prose prose-sm max-w-none", msg.role === "user" ? "prose-invert" : "")}>
                <Markdown>{msg.content}</Markdown>
              </div>
              {msg.hasPlan && onViewPlan && (
                <button
                  type="button"
                  onClick={onViewPlan}
                  aria-label="View plan and 3D model"
                  className="mt-4 w-full bg-[#E4E3E0] text-[#141414] px-3 py-2 font-mono text-xs uppercase tracking-wider border border-[#141414] flex items-center justify-center gap-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors md:hidden"
                >
                  <Layout size={14} aria-hidden="true" />
                  View Plan &amp; 3D Model
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
            role="status"
            aria-label="Generating plan"
          >
            <div className="w-8 h-8 border border-[#141414] bg-[#E4E3E0] text-[#141414] flex items-center justify-center">
              <Bot size={14} strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="bg-[#E4E3E0] border border-[#141414] p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#141414]" aria-hidden="true" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#141414]/70">
                Thinking… this can take up to a minute
              </span>
            </div>
          </motion.div>
        )}
      </div>
      {hasPlan && onViewPlan && (
        <button
          type="button"
          onClick={onViewPlan}
          aria-label="View plan and 3D model"
          className="md:hidden mx-4 mb-2 bg-[#141414] text-[#E4E3E0] px-3 py-2 font-mono text-xs uppercase tracking-wider border border-[#141414] flex items-center justify-center gap-2 hover:bg-[#141414]/90 transition-colors"
        >
          <Layout size={14} aria-hidden="true" />
          View Plan &amp; 3D Model
        </button>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-[#141414] bg-[#E4E3E0] flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#141414]/60 shrink-0 w-12">Style</span>
            <select
              value={designStyle}
              onChange={(e) => setDesignStyle(e.target.value)}
              className="text-xs px-2 py-1.5 border border-[#141414] bg-[#E4E3E0] text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] w-full max-w-[200px] font-mono rounded-none"
            >
              {STYLES.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#141414]/60 shrink-0 w-12">Skill</span>
            {["Beginner", "Intermediate", "Advanced"].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setExperienceLevel(level)}
                className={cn(
                  "text-[10px] px-3 py-1.5 uppercase tracking-wider transition-colors border shrink-0 font-mono rounded-none",
                  experienceLevel === level 
                    ? "bg-[#141414] border-[#141414] text-[#E4E3E0]" 
                    : "bg-[#E4E3E0] border-[#141414] text-[#141414] hover:bg-[#141414]/10"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        
        {imageError && (
          <p role="alert" className="text-[10px] font-mono uppercase tracking-wider text-red-700">
            {imageError}
          </p>
        )}
        {imagePreview && (
          <div className="relative w-16 h-16 border border-[#141414] p-1 bg-white/5">
            <img src={imagePreview.dataUrl} alt="Selected reference" className="w-full h-full object-cover grayscale" />
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove reference image"
              className="absolute -top-2 -right-2 p-1 bg-[#141414] text-[#E4E3E0] border border-[#141414] hover:bg-red-600 hover:text-white transition-colors"
            >
              <X size={10} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload reference image"
            className="p-3 border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors rounded-none"
            title="Upload reference image"
          >
            <ImagePlus size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <div className="relative flex-1">
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your project..."
              disabled={isLoading}
              className="w-full pl-3 pr-10 py-3 bg-[#E4E3E0] border border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all text-sm font-sans rounded-none placeholder:text-[#141414]/40 disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={isLoading || (!input.trim() && !imagePreview)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#141414] transition-colors rounded-none"
            >
              {isLoading ? (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={16} strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
