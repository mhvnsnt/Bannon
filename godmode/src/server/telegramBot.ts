import fetch from "node-fetch";

export async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[TELEGRAM] Missing TELEGRAM_BOT_TOKEN environment variable.");
    return false;
  }
  
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    });
    
    if (!res.ok) {
      console.error(`[TELEGRAM] Failed to send message: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[TELEGRAM] Error sending message:", err);
    return false;
  }
}

export async function setTelegramWebhook(webhookUrl: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  
  const url = `https://api.telegram.org/bot${token}/setWebhook`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl })
    });
    const data = await res.json() as any;
    console.log("[TELEGRAM] Set webhook response:", data);
    return data.ok;
  } catch (err) {
    console.error("[TELEGRAM] Error setting webhook:", err);
    return false;
  }
}
