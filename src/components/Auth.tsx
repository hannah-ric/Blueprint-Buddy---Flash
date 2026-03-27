import { signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { LogIn, LogOut } from "lucide-react";
interface AuthProps {
  user: User | null;
}

export function Auth({ user }: AuthProps) {
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      console.error("Sign-in failed:", error);
    });
  };

  const handleLogout = () => signOut(auth);

  if (user) {
    return (
      <div className="flex items-center gap-3">
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
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium shadow-sm shadow-orange-200"
    >
      <LogIn size={16} />
      Sign In
    </button>
  );
}
