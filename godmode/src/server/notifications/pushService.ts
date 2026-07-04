import { Buffer } from 'buffer';

export async function sendPushAlert(message: string) {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    
    if (telegramToken && telegramChatId) {
        try {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            console.log('[PUSH] Telegram alert sent successfully.');
        } catch (e) {
            console.error('[PUSH] Failed to send Telegram alert:', e);
        }
    }

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const targetPhoneNumber = process.env.TARGET_PHONE_NUMBER; // where to send the SMS

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && targetPhoneNumber) {
        try {
            const formData = new URLSearchParams();
            formData.append('To', targetPhoneNumber);
            formData.append('From', twilioPhoneNumber);
            formData.append('Body', message);

            const basicAuth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

            await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${basicAuth}`
                },
                body: formData.toString()
            });
            console.log('[PUSH] Twilio SMS sent successfully.');
        } catch (e) {
            console.error('[PUSH] Failed to send Twilio SMS:', e);
        }
    }
}
