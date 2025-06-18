// External npm packages
import { Router } from 'express';
import twilio from 'twilio';
import { readFileSync } from 'fs';
import { join } from 'path';

// Local imports
import { log } from '../lib/utils/logger';
import { activeConversations } from './conversationRelay';
import { LLMService } from '../llm';
import { routeNames } from './routeNames';

const router = Router();

router.post(`/${routeNames.sms}`, async (req, res) => {
  try {
    const { From: from, Body: body } = req.body;
    log.cyan('sms', `Received message from ${from}: ${body}`);

    // Check if there's an active conversation for this number
    const conversation = activeConversations.get(from);
    if (conversation) {
      const { llm } = conversation;

      // Add message to conversation history
      llm.addMessage({
        role: 'user',
        content: body,
      });

      // Process with LLM
      await llm.run();
    } else {
      // Create new conversation for this number
      const llm = new LLMService(from);

      // Read instructions directly and add to LLM
      try {
        const instructions = readFileSync(
          join(process.cwd(), 'src', 'lib', 'prompts', 'instructions.md'),
          'utf-8'
        );
        
        llm.addMessage({
          role: 'system',
          content: instructions,
        });
      } catch (error) {
        log.error('sms', 'Failed to read instructions file', error);
      }

      // Store the conversation
      activeConversations.set(from, {
        ws: null, // No WebSocket for SMS-only conversations
        llm,
      });

      llm.addMessage({
        role: 'system',
        content: `The customer's phone number is ${from}. This is an SMS conversation.`,
      });

      // Set up LLM response handler
      llm.on('text', async (_text, last, transcript) => {
        if (last) {
          log.llm('sms.response', transcript);

          // Send SMS response using Twilio
          const twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
          );

          await twilioClient.messages.create({
            body: transcript,
            to: from,
            from: process.env.TWILIO_CONVERSATION_NUMBER,
          });
        }
      });

      // Add user's message and start conversation
      llm.addMessage({
        role: 'user',
        content: body,
      });

      await llm.run();
    }

    // Send TwiML response
    const twiml = new twilio.twiml.MessagingResponse();
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    log.error('sms', 'Error processing SMS', error);
    res.status(500).send('Error processing message');
  }
});

export default router;
