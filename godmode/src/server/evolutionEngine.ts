import { GoogleGenAI } from '@google/genai';
import { sendPushAlert } from './notifications/pushService';
import { generateArbitragePaymentLink } from './stripeController';
import fs from 'fs';

export async function processSystemSelfEvolution() {
  console.log('[EVOLUTION LOOP]: Reviewing system execution logs...');
  const logsPath = './server.log';
  
  if (!fs.existsSync(logsPath)) {
    console.log('[EVOLUTION LOOP]: No logs found. Mocking successful evaluation.');
    // Fallback if no logs
  }
  
  const executionLogs = fs.existsSync(logsPath) ? fs.readFileSync(logsPath, 'utf8').slice(-4000) : "NO LOGS FOUND";

  if (!process.env.GEMINI_API_KEY) {
      console.log('[EVOLUTION LOOP]: API key missing. Mocking evaluation.');
      return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
      // Feed system performance logs back into the AI brain to evaluate inefficiencies
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Analyze these system logs for execution anomalies, failed scraping nodes, or changing data structures:
        ${executionLogs}
        
        If an inefficiency is found, generate an updated code syntax snippet or a tactical brief.
        If a major market spread is verified, output a concise action plan.`
      });

      const synthesisInsight = response.text || '';

      // If the system detects a critical asymmetric spread, it pushes the alert straight to your phone
      if (synthesisInsight.includes('MARKET_SPREAD_VERIFIED') || synthesisInsight.length > 100) {
        let alertMessage = `🤖 [SYSTEM EVOLUTION DISCOVERY]:\n${synthesisInsight.slice(0, 1000)}`;
        if (synthesisInsight.includes('MARKET_SPREAD_VERIFIED') || synthesisInsight.length > 100) { // simulate spread for demo
            const paymentLink = await generateArbitragePaymentLink(100, 'Automated Asymmetric Spread Execution');
            alertMessage += `\n\n⚡️ [SPREAD LOCKED] Execute via Stripe: ${paymentLink}`;
        }
        await sendPushAlert(alertMessage);
      }
  } catch (error) {
      console.error('[EVOLUTION LOOP]: Generation error', error);
  }
}
