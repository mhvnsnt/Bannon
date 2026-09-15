import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Gamepad2, AlertTriangle } from 'lucide-react';

export default function Auth() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setErrorMsg(null);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes('unauthorized-domain') || error?.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain unauthorized. The AI Studio environment has been updated. Please refresh or try opening the app in a new tab.');
      } else if (error?.message?.includes('popup') || error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was blocked or closed. Please open the app in a new tab to sign in.');
      } else {
        setErrorMsg(error?.message || 'Failed to sign in. Please try again or open in a new tab.');
      }
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-950 text-white p-4">
      <div className="max-w-md w-full p-8 bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl flex flex-col items-center">
        <Gamepad2 className="w-16 h-16 text-indigo-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2 text-center">Bannon Asset Manager</h1>
        <p className="text-neutral-400 text-center mb-8">Sign in to manage game assets and access AI tools.</p>
        
        {errorMsg && (
          <div className="w-full mb-6 p-4 bg-red-950/50 border border-red-900 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleSignIn}
          className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
        
        <p className="mt-6 text-xs text-neutral-500 text-center">
          Note: If sign-in doesn't work in the preview window, try opening the app in a new tab.
        </p>
      </div>
    </div>
  );
}
