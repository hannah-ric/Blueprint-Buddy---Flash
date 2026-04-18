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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMessage = "We encountered an unexpected error while processing your request. Please try refreshing the page or starting a new project.";

      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Hammer className="text-red-500" size={28} />
            </div>
            <h2 className="text-2xl font-serif italic text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
