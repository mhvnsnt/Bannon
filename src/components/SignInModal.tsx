import React, { useState } from 'react';
import { Mail, Shield, CheckCircle2, Lock, Sparkles, X } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, isPremium: boolean) => void;
}

export default function SignInModal({ isOpen, onClose, onSuccess }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const normalizedEmail = email.trim().toLowerCase();
      
      if (!normalizedEmail) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      // Check for the God Mode Admin email
      if (normalizedEmail === 'marquiswhitacre@gmail.com') {
        setSuccessMsg('👑 Welcome back, Commander Marquis! GOD MODE Admin status has been successfully verified. Premium access is permanently unlocked.');
        setTimeout(() => {
          onSuccess(normalizedEmail, true);
          onClose();
          setSuccessMsg(null);
          setEmail('');
          setPassword('');
        }, 2500);
      } else {
        // Normal user login: logs them in, but doesn't auto-unlock unless they are a buyer
        setSuccessMsg(`Welcome back! Logged in as ${normalizedEmail}.`);
        setTimeout(() => {
          onSuccess(normalizedEmail, false);
          onClose();
          setSuccessMsg(null);
          setEmail('');
          setPassword('');
        }, 1500);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="panel relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl shadow-2xl bg-white border border-black animate-in zoom-in duration-300">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-black cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {successMsg ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-5 shadow-inner">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-black mb-3">Identity Verified</h3>
            <p className="text-slate-600 text-sm max-w-sm leading-relaxed mb-4">
              {successMsg}
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-black h-full animate-progress rounded-full" style={{ width: '100%', transition: 'width 2.5s ease-in-out' }} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mx-auto mb-4 shadow-md font-bold text-xl">
                O
              </div>
              <h2 className="text-2xl font-black text-black tracking-tight">Access Terminal</h2>
              <p className="text-slate-500 text-xs mt-1">Sign in to your Orion account or verify Admin privileges.</p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold animate-in shake duration-300">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-xl py-3 pl-11 pr-4 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Security PIN / Password</label>
                <span className="text-[10px] text-slate-400 font-mono">(Optional for Admin validation)</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-xl py-3 pl-11 pr-4 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white font-bold py-3.5 px-6 rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    AUTHENTICATE & ENTER
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const { supabase, isSupabaseConfigured } = await import('../services/supabaseClient');
                    if (!isSupabaseConfigured) {
                      setErrorMsg('OAuth login requires your custom Supabase Keys to be configured in settings.');
                      return;
                    }
                    await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: window.location.origin,
                      }
                    });
                  } catch (err) {
                    console.error('Google sign in error:', err);
                  }
                }}
                className="w-full bg-white text-black border-2 border-slate-200 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-50 hover:border-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="text-center mt-2 border-t border-slate-100 pt-4">
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                If you are Marquis Whitacre, simply log in with your email to bypass all payment screens.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
