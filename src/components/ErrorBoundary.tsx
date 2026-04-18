import React, { Component, ErrorInfo, ReactNode } from "react";
import { Hammer } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#E4E3E0] text-[#141414] font-sans p-6">
          <div className="max-w-md w-full border border-[#141414] bg-[#E4E3E0] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="w-14 h-14 border border-[#141414] bg-[#141414] text-[#E4E3E0] flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.3)]">
              <Hammer size={22} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#141414]/60 mb-2">Error</p>
            <h2 className="text-2xl font-light serif italic text-[#141414] mb-4">Something went wrong</h2>
            <p className="text-sm text-[#141414]/70 leading-relaxed mb-6">
              The app hit an unexpected error. Reload the page to continue. Your saved projects are safe.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-[0.15em] border border-[#141414] hover:bg-[#141414]/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
