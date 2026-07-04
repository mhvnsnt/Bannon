import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shield, CreditCard, Sparkles, Cpu, Check, 
  HelpCircle, DollarSign, Loader2, AlertCircle, Zap, Globe 
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, tier: 'ONCE' | 'PRO') => void;
  complexity: 'QUICK' | 'STANDARD' | 'DEEP';
  projectId?: string;
}

export default function PaywallModal({ isOpen, onClose, onSuccess, complexity, projectId }: PaywallModalProps) {
  const [email, setEmail] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [activeTab, setActiveTab] = useState<'ONCE' | 'PRO'>('ONCE');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const pricing = { QUICK: 2.99, STANDARD: 7.99, DEEP: 19.99 };
  const basePrice = pricing[complexity] || 7.99;

  // Clear states on opening/closing
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSuccess(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleValidation = (): boolean => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please provide a valid operator email address.');
      return false;
    }
    if (activeTab === 'ONCE') {
      if (!cardName) {
        setErrorMessage('Name on card is required.');
        return false;
      }
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setErrorMessage('Please check your card number.');
        return false;
      }
    }
    return true;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!handleValidation()) return;

    setIsLoading(true);
    try {
      if (activeTab === 'ONCE') {
        // 1. Get payment session / intent from backend
        const sessionRes = await fetch('/api/payment/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, complexity })
        });

        if (!sessionRes.ok) {
          const errData = await sessionRes.json();
          throw new Error(errData.error || 'Failed to instantiate Stripe session.');
        }

        const intent = await sessionRes.json();
        
        // 2. Perform payment completion (sandbox simulate or genuine check)
        const fulfillRes = await fetch('/api/payment/success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            tier: 'ONCE',
            amount: basePrice,
            stripeId: intent.id || 'pi_sim_' + Math.random().toString(36).substring(2, 10)
          })
        });

        if (!fulfillRes.ok) {
          throw new Error('Transaction was authorized but backend provisioning failed.');
        }

        setIsSuccess(true);
        setTimeout(() => {
          onSuccess(email, 'ONCE');
          onClose();
        }, 1500);

      } else {
        // PRO monthly sub subscription setup
        const subRes = await fetch('/api/payment/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            successUrl: window.location.origin + '/payment/success',
            cancelUrl: window.location.origin
          })
        });

        if (!subRes.ok) {
          const errData = await subRes.json();
          throw new Error(errData.error || 'Failed to initialize subscription checkout portal.');
        }

        const data = await subRes.json();
        
        if (data.isMock) {
          // Simulated subscription checkout redirect
          console.log('[PaywallModal] Mock simulation mode, fulfilling checkout trigger directly...');
          const fulfillRes = await fetch('/api/payment/success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              tier: 'PRO',
              amount: 49.00,
              stripeId: data.id
            })
          });

          if (!fulfillRes.ok) {
            throw new Error('Frictionless subscription provisioning failed.');
          }

          setIsSuccess(true);
          setTimeout(() => {
            onSuccess(email, 'PRO');
            onClose();
          }, 1500);
        } else {
          // If real checkout URL exists, redirect the client
          window.location.href = data.url;
        }
      }
    } catch (err: any) {
      console.error('[Checkout Error]', err);
      setErrorMessage(err.message || 'An unexpected payment error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val.substring(0, 5));
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <div 
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-200 z-10"
          >
            {/* Top Close Button */}
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-all p-1 hover:bg-slate-800/40 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Price Estimator Header Banner */}
            <div className="bg-slate-950/40 p-6 border-b border-slate-800/60 text-center relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />
              
              <div className="inline-flex p-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full mb-3 text-emerald-400 text-xs font-mono items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Living Forge Multi-Model Compiling
              </div>

              <h3 className="text-xl font-bold font-sans text-white">Unlock Your Development Vector</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Authorizing secure execution for <strong>{complexity} complexity</strong> build pipeline.
              </p>
            </div>

            {/* Inner Content Tabs */}
            <div className="p-6">
              {isSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
                    <Check className="w-8 h-8 animate-bounce" />
                  </div>
                  <h4 className="text-lg font-bold text-white uppercase font-mono tracking-wider">Access Granted</h4>
                  <p className="text-slate-400 text-xs mt-1">Transaction approved. Preparing container parameters...</p>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  {/* Mode Plan Selection Tabs */}
                  <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-lg border border-slate-850">
                    <button
                      type="button"
                      onClick={() => { setActiveTab('ONCE'); setErrorMessage(null); }}
                      className={`py-1.5 rounded text-xs font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        activeTab === 'ONCE' 
                          ? 'bg-slate-800 text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      24h Pass: ${basePrice}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('PRO'); setErrorMessage(null); }}
                      className={`py-1.5 rounded text-xs font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        activeTab === 'PRO' 
                          ? 'bg-slate-800 text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Pro License: $49/mo
                    </button>
                  </div>

                  {/* Pricing descriptions */}
                  <div className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-850/50">
                      <span className="text-slate-400">Build Complexity Estimate</span>
                      <span className="font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-2 py-0.5 rounded uppercase text-[10px]">{complexity} Tier</span>
                    </div>

                    {activeTab === 'ONCE' ? (
                      <div className="text-slate-400 space-y-1.5">
                        <p className="flex items-center gap-1.5 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>24 hours of infinite revisions/compiles on this codebase.</span>
                        </p>
                        <p className="flex items-center gap-1.5 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>Parliament voting engine automatically critiques proposals.</span>
                        </p>
                      </div>
                    ) : (
                      <div className="text-slate-400 space-y-1.5">
                        <p className="flex items-center gap-1.5 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-white">Sovereign Unrestricted:</span> unlimited builds on all projects.
                        </p>
                        <p className="flex items-center gap-1.5 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>Priority queued compute, zero platform throttling.</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Warning Error Console */}
                  {errorMessage && (
                    <div className="text-xs font-mono text-rose-400 bg-rose-950/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Form Details Area */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1">Owner Email</label>
                      <input 
                        type="email" 
                        placeholder="operator@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono transition-all"
                        required
                      />
                    </div>

                    {activeTab === 'ONCE' && (
                      <>
                        <div className="h-[1px] bg-slate-800/40 my-2" />
                        
                        {/* Sandboxed billing alert warning */}
                        <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-500/25 p-2 rounded flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            Stripe sandbox test mode active
                          </span>
                          <span>Fill with mock details</span>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1">Cardholder Name</label>
                          <input 
                            type="text" 
                            placeholder="M. Heavensent"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono transition-all"
                          />
                        </div>

                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1">Card Number</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="4242 4242 4242 4242"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono tracking-wider transition-all"
                              />
                              <CreditCard className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1">Expiration</label>
                              <input 
                                type="text" 
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={handleExpiryChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono tracking-wider transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1">Security CVC</label>
                              <input 
                                type="text" 
                                placeholder="321"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono tracking-wider transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Submission Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium py-2.5 px-4 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authorizing payment transit...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Checkout: {activeTab === 'ONCE' ? `Authorize $${basePrice}` : 'Subscribe $49/mo'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Shield Footer */}
            <div className="bg-slate-950/30 p-4 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-center gap-1.5 font-mono">
              <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
              Secure encrypted payments compiled via Stripe Systems.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
