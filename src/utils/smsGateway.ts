import axios from 'axios';

/**
 * Autonomous SMS Gateway Helper
 * Bridges CODEDUMMY notifications to an Android-based local SMS relay or a Raspberry Pi LTE HAT.
 * Bypasses corporate SMS limiters (Twilio, token caps, per-text fees) by executing through
 * local cellular nodes with unlimited carrier text plans.
 */
export interface SMSRelayPayload {
    phoneNumber: string;
    message: string;
    gatewayUrl?: string;
    authKey?: string;
}

export async function sendRelayedSMS(payload: SMSRelayPayload): Promise<{ success: boolean; error?: string }> {
    const gatewayUrl = payload.gatewayUrl || process.env.SMS_GATEWAY_URL || 'http://192.168.1.150:8080/send';
    const authKey = payload.authKey || process.env.SMS_GATEWAY_AUTH_KEY;
    const cleanMessage = `[CODEDUMMY Autopilot Alert]\n${payload.message}`;

    console.log(`📡 [SMS Gateway] Routing alert to local cellular antenna relay at: ${gatewayUrl}`);

    try {
        const response = await axios.post(gatewayUrl, {
            to: payload.phoneNumber,
            message: cleanMessage,
            device_id: 'sovereign_node_alpha'
        }, {
            headers: authKey ? { 'Authorization': `Bearer ${authKey}` } : {},
            timeout: 5000 // 5 seconds timeout before triggering local simulation log fallback
        });

        if (response.status === 200 || response.status === 201) {
            console.log(`✔ [SMS Gateway] Push message relayed onto raw cellular SIM network with 0 limits.`);
            return { success: true };
        } else {
            throw new Error(`Gateway returned status code ${response.status}`);
        }
    } catch (err: any) {
        console.warn(`⚠️ [SMS Gateway] Target relay device at ${gatewayUrl} is offline or unreachable.`);
        console.warn(`📝 [Local Simulator Log Fallback] [SIMULATOR RELAY TO ${payload.phoneNumber}]: "${cleanMessage}"`);
        return { 
            success: false, 
            error: `Gateway unreachable (${err.message}). Notification logged to server simulator frame.` 
        };
    }
}
