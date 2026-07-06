import { supabase, isSupabaseConfigured } from './supabaseClient';

export const PaymentService = {
  /**
   * Simulates a payment flow (e.g. Stripe/Coinbase) and upgrades
   * the user's role to 'buyer'. 
   */
  async simulatePayment(userId: string): Promise<{ success: boolean; status?: string }> {
    console.log(`[PaymentService] Initiating simulated payment for user: ${userId}`);
    
    // Simulate network delay for processing payment
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`[PaymentService] Payment successful. Upgrading user...`);
    
    // Note: In production this should be handled by a secure backend Webhook
    // For MVP frontend prototyping we trigger it directly if the user is authenticated.
    if (isSupabaseConfigured) {
      try {
        // 1. Upgrade user profile to buyer
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ status: 'buyer' })
          .eq('id', userId);
          
        if (profileError) {
          console.warn('Profile update warning (expected if no DB):', profileError);
        }

        // 2. Insert transaction metadata
        const { error: txError } = await supabase
          .from('transactions')
          .insert([{ 
            user_id: userId, 
            status: 'success', 
            amount: 4900, 
            currency: 'usd',
            processor: 'stripe_simulated',
            created_at: new Date().toISOString()
          }]);

        if (txError) {
          console.warn('Transaction logging warning (expected if no DB):', txError);
        }

      } catch (err) {
        console.warn('Supabase not fully configured yet:', err);
      }
    }
    
    return { success: true, status: 'buyer' };
  }
};
