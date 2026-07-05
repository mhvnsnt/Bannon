import twilio from "twilio";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const twilioSid = process.env.TWILIO_SID || "dummy_sid";
const twilioAuth = process.env.TWILIO_AUTH_TOKEN || "dummy_auth";
const telegramToken = process.env.TELEGRAM_BOT_TOKEN || "8620527829:AAF2wpxQAGCaaHdtFYqoyYVkTF5c0JfEHA0";

const twilioClient = twilio(twilioSid, twilioAuth);
const telegramBot = new Telegraf(telegramToken);

const messagePayload = process.argv[2] || "Swarm node alert triggered";

async function runRealWorldExecution() {
  try {
    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER && process.env.YOUR_PERSONAL_MOBILE) {
      await twilioClient.messages.create({
        body: `[GOD MODE OS] ${messagePayload}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.YOUR_PERSONAL_MOBILE
      });
      console.log("Twilio real world mobile alert delivered");
    } else {
      console.log("Twilio credentials missing. Skipping SMS alert.");
    }

    if (process.env.YOUR_TELEGRAM_CHAT_ID || true) { // Attempt broadcast
      const chatId = process.env.YOUR_TELEGRAM_CHAT_ID || "123456789"; // Default test ID
      try {
        await telegramBot.telegram.sendMessage(chatId, `[SWARM CONVERGENCE] ${messagePayload}`);
        console.log("Telegram ecosystem broadcast complete");
      } catch (err) {
        console.error("Telegram error. (Chat ID may be wrong or bot not initialized for that user).", err);
      }
    }
  } catch (error) {
    console.error("External API execution failed", error);
  }
}

runRealWorldExecution();
