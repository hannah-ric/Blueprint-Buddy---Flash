import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { LogIn, LogOut, Loader2, AlertCircle } from "lucide-react";

interface AuthProps {
  user: User | null;
}

export function Auth({ user }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      if (err instanceof Error && (err as { code?: string }).code !== 'auth/popup-closed-by-user') {
        console.error("Login error:", err);
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {error && (
          <div className="text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
            <AlertCircle size={12} />
            {error}
          </div>
        )}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-gray-900">{user.displayName}</p>
          <p className="text-[10px] text-gray-500 font-mono">{user.email}</p>
        </div>
        <img 
          src={user.photoURL || ""} 
          alt={user.displayName || ""} 
          className="w-8 h-8 rounded-full border border-gray-200"
          referrerPolicy="no-referrer"
        />
        <button 
          onClick={handleLogout}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
          title="Logout"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <div className="text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium shadow-sm shadow-orange-200 disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
        Sign In
      </button>
    </div>
  );
}
