import { User } from "firebase/auth";
import { signIn, logOut } from "../lib/firebase";
import { LogIn, LogOut } from "lucide-react";

interface AuthProps {
  user: User | null;
}

export function Auth({ user }: AuthProps) {
  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out:", error);
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
          onClick={handleSignOut}
          className="p-1.5 text-[#141414] hover:bg-[#141414]/10 transition-colors border border-transparent hover:border-[#141414]"
          title="Sign Out"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] text-[#E4E3E0] text-xs font-mono uppercase tracking-wider hover:bg-[#141414]/90 transition-colors border border-[#141414]"
    >
      <LogIn size={16} strokeWidth={1.5} />
      <span>Sign In</span>
    </button>
  );
}
