// External npm packages
import { Router } from 'express';
import twilio from 'twilio';

// Local imports
import { log } from '../lib/utils/logger';
import { routeNames } from './routeNames';
import { ConversationRelayParams } from '../lib/types';

const router = Router();

router.get('/call', async (req, res) => {
  const env = process.env.NODE_ENV;
  const isProduction = env === 'production';

  const { From: callerNumber } = req.query as { From: string };
  log.cyan('call', `Received call from ${callerNumber}`);

  // action endpoint will be executed when action is dispatched to the ConversationRelay websocket
  // https://www.twilio.com/docs/voice/twiml/connect/conversationrelay#end-session-message
  // In this implementation, we use the action for transferring conversations to a human agent
  const baseActionUrl = isProduction
    ? `https://${process.env.LIVE_HOST_URL}/${routeNames.liveAgent}`
    : `https://${process.env.NGROK_URL}/${routeNames.liveAgent}`;

  const relayUrl = isProduction
    ? `wss://${process.env.LIVE_HOST_URL}/${routeNames.conversationRelay}`
    : `wss://${process.env.NGROK_URL}/${routeNames.conversationRelay}`;

  // Create TwiML response
  const response = new twilio.twiml.VoiceResponse();

  const connect = response.connect({
    action: `${baseActionUrl}?method=POST`,
  });

  const conversationIntelligenceServiceSid =
    process.env.TWILIO_CONVERSATIONAL_INTELLIGENCE_SID;

  // Define parameters for the ConversationRelay
  const relayParams: ConversationRelayParams = {
    voice: 'g6xIsTj2HwM6VR4iXFCw', // Twilio voice ID
    transcriptionProvider: 'Deepgram', // Transcription provider
    ttsProvider: 'ElevenLabs', // Text-to-Speech provider
    speechModel: 'nova-3-general', // Speech model
    dtmfDetection: true, // DTMF detection enabled
    interruptByDtmf: true, // Interrupt by DTMF enabled
    debug: true, // Debugging enabled
    url: relayUrl, // Your WebSocket URL
    ...(conversationIntelligenceServiceSid && {
      intelligenceService: conversationIntelligenceServiceSid, // conversation intelligence - transcript, scoring, etc.
    }),
  };

  console.log('relayParams', relayParams);

  const conversationRelay = connect.conversationRelay(relayParams);
  conversationRelay.language({
    code: 'es-ES',
    ttsProvider: 'Elevenlabs',
    voice: 'g6xIsTj2HwM6VR4iXFCw',
    transcriptionProvider: 'google',
    speechModel: 'long'
  });
  conversationRelay.language({
    code: 'en-US',
    ttsProvider: 'Elevenlabs',
    voice: 'g6xIsTj2HwM6VR4iXFCw',
    transcriptionProvider: 'deepgram',
    speechModel: 'nova-3-general'
  });

  // Send TwiML response
  res.type('text/xml');
  res.send(response.toString());
});

export default router;
