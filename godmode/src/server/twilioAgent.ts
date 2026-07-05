import express from 'express';
import twilio from 'twilio';
import { modelRouter } from './modelRouter';

export const twilioRouter = express.Router();

twilioRouter.post('/sms', async (req, res) => {
  const incomingMsg = req.body.Body;
  const fromNum = req.body.From;

  console.log(`[TwilioAgent] Received SMS from ${fromNum}: ${incomingMsg}`);
  
  const messagingResponse = new twilio.twiml.MessagingResponse();

  try {
    const response = await modelRouter.route({
      prompt: incomingMsg,
      taskType: 'CHAT',
      context: { source: 'twilio_sms', phone: fromNum },
      taskId: 'twilio_' + Date.now()
    });

    if (response) {
      // Twilio SMS limit is 1600 characters usually per message part, but Twilio splits it.
      // We will truncate it slightly so it doesn't fail if extremely long.
      const truncResponse = response.length > 1500 ? response.substring(0, 1500) + '...' : response;
      messagingResponse.message(truncResponse);
    } else {
      messagingResponse.message('[NexusMind] Failed to process request.');
    }
  } catch (error: any) {
    console.error('[TwilioAgent] Routing Error:', error);
    messagingResponse.message('[System Error] NexusMind overload or failure.');
  }

  res.type('text/xml').send(messagingResponse.toString());
});

twilioRouter.post('/voice', async (req, res) => {
  // Simple voice endpoint that speaks
  const voiceResponse = new twilio.twiml.VoiceResponse();
  voiceResponse.say('You have reached the God Mode Nexus Mind. The system is online and autonomous.');
  res.type('text/xml').send(voiceResponse.toString());
});
