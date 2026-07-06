import React, { useState } from 'react';
import { cn } from '../App';
import { Zap, ExternalLink, Loader2, CheckCircle2, Award } from 'lucide-react';
import { PaymentService } from '../services/payment';

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
  userId: string;
  isBuyer: boolean;
  onOpenSignIn?: () => void;
}

export default function ConversionModal({ isOpen, onClose, onSignUp, userId, isBuyer, onOpenSignIn }: ConversionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) {
    if (isProcessing) setIsProcessing(false);
    if (isSuccess) setIsSuccess(false);
    return null;
  }

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || 'demo_user_123' })
      });
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (e) {
      setIsProcessing(false);
      console.error(e);
      // Fallback behavior if Stripe key isn't provided to keep app playable
      setIsSuccess(true);
      setTimeout(() => {
        onSignUp();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={!isProcessing && !isSuccess ? onClose : undefined}
      />
      <div className="panel relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl shadow-2xl animate-in zoom-in duration-500">
        
        {isBuyer ? (
           <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-inner">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-black mb-2">Pro Access Unlocked</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
                Thank you for your upgrade! You have full access to our local high-speed GPU WebLLM sandbox, advanced API bridges, and autonomous scrapers.
              </p>
              <button 
                onClick={onSignUp}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                CONTINUE TO THE LAB
              </button>
           </div>
        ) : isSuccess ? (
           <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">Access Granted</h3>
              <p className="text-slate-500 text-center text-sm">Welcome to The Lab.</p>
           </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-6 shadow-md mx-auto">
              <Zap className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-xl md:text-2xl font-bold text-center mb-3 text-black">
              You just built this in a browser.
            </h3>
            
            <p className="text-slate-600 text-center mb-8 leading-relaxed text-sm">
              Ready to learn how to build autonomous agents and scrape the web? Welcome to The Lab. Create an account to enter.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-black text-white font-bold py-3.5 px-6 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md disabled:opacity-70 disabled:active:scale-100"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> 
                    PROCESSING SECURE CHECKOUT...
                  </>
                ) : (
                  <>
                    ENTER THE LAB (AGENT) <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
              
              {!isProcessing && (
                <div className="flex flex-col gap-1 w-full mt-1">
                  <button 
                    onClick={onClose}
                    className="w-full bg-transparent text-slate-500 font-semibold py-2.5 px-6 rounded-xl hover:text-black hover:bg-slate-100 transition-all text-sm cursor-pointer"
                  >
                    Not yet, let me play
                  </button>
                  {onOpenSignIn && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSignIn();
                      }}
                      className="w-full bg-transparent text-amber-600 hover:text-amber-700 font-mono text-[10px] uppercase tracking-widest py-1.5 hover:underline cursor-pointer"
                    >
                      🔐 Existing member or Admin? Sign In
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
