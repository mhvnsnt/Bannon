import { Router } from 'express';
import { StripeController } from './stripeController.js';
import { EconomicLedger } from './economicLedger.js';
import { memoryVault } from './db.js';

export function createFinanceRouter() {
  const router = Router();
  const db = memoryVault;
  const stripeCtrl = new StripeController(db);
  const ledger = new EconomicLedger(db);

  // Economic Stats
  router.get('/economic/stats', (req, res) => {
    try {
      const stats = ledger.getEconomicStats('God Mode OS');
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/economic/ledger', (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const transactions = ledger.getRecentTransactions('God Mode OS', limit);
      res.json(transactions);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/economic/pl', (req, res) => {
    try {
      const timeframe = (req.query.timeframe as string) || 'DAILY';
      const plData = ledger.getPLReport(timeframe as any, 'God Mode OS');
      res.json(plData);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stripe Payment Endpoints
  router.post('/payment/session', async (req, res) => {
    try {
      const { email, tier } = req.body;
      const result = await stripeCtrl.createPaymentIntent(email, tier);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/payment/subscribe', async (req, res) => {
    try {
      const { email, successUrl, cancelUrl } = req.body;
      const result = await stripeCtrl.createSubscriptionSession(email, successUrl, cancelUrl);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/payment/success', (req, res) => {
    try {
      const { email, tier, amount, stripeId } = req.body;
      stripeCtrl.recordSuccessfulPayment(email, tier, amount, stripeId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
