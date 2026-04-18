import { useState } from "react";
import { User } from "firebase/auth";
import { signIn, logOut } from "../lib/firebase";
import { LogIn, LogOut } from "lucide-react";

interface AuthProps {
  user: User | null;
}

export function Auth({ user }: AuthProps) {
  const [isError, setIsError] = useState(false);

  const handleSignIn = async () => {
    setIsError(false);
    try {
      await signIn();
    } catch (error: any) {
      console.error("Sign-in error suppressed:", error?.code || error);
      setIsError(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error: any) {
      console.error("Sign-out error suppressed:", error?.code || error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.photoURL && (
            <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 rounded-none border border-[#141414]" referrerPolicy="no-referrer" />
          )}
          <span className="text-xs font-mono text-[#141414] hidden md:inline-block">{user.displayName || user.email}</span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="p-1.5 text-[#141414] hover:bg-[#141414]/10 transition-colors border border-transparent hover:border-[#141414]"
          title="Sign Out"
        >
          <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isError && (
        <span className="text-[10px] text-red-500 font-mono tracking-wider">Auth Failed</span>
      )}
      <button
        type="button"
        onClick={handleSignIn}
        aria-label="Sign in with Google"
        className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] text-[#E4E3E0] text-xs font-mono uppercase tracking-wider hover:bg-[#141414]/90 transition-colors border border-[#141414]"
      >
        <LogIn size={16} strokeWidth={1.5} aria-hidden="true" />
        <span>Sign In</span>
      </button>
    </div>
  );
}
