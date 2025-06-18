// External npm packages
import ExpressWs from 'express-ws';
import { readFileSync } from 'fs';
import { join } from 'path';

// Local imports
import { log } from '../lib/utils/logger';
import { TypedWs } from '../lib/types/websocket';
import { LLMService } from '../llm';
import { routeNames } from './routeNames';

// Store active conversations
export const activeConversations = new Map<
  string,
  { ws: TypedWs | null; llm: LLMService }
>();

export const setupConversationRelayRoute = (app: ExpressWs.Application) => {
  app.ws(`/${routeNames.conversationRelay}`, (ws) => {
    log.green('relay', 'initialized');
    const wss = new TypedWs(ws);
    let callerPhoneNumber = '';
    let llm: LLMService | null = null;

    // Handle user speaking
    wss.on('prompt', async (ev) => {
      if (!ev.last || !llm) return; // ignore partial speech or if llm not initialized
      log.cyan('relay.prompt', ev.voicePrompt);

      // Add user message to conversation history
      llm.addMessage({
        role: 'user',
        content: ev.voicePrompt,
      });

      // Process with LLM and get response
      await llm.run();
    });

    // Handle LLM responses
    wss.on('setup', async (ev) => {
      const { from } = ev;
      callerPhoneNumber = from;
      llm = new LLMService(callerPhoneNumber);

      // Store the active conversation
      activeConversations.set(callerPhoneNumber, { ws: wss, llm });

      // Read instructions and context directly and add to LLM
      try {
        const instructions = readFileSync(
          join(process.cwd(), 'src', 'lib', 'prompts', 'instructions.md'),
          'utf-8'
        );
        
        const context = readFileSync(
          join(process.cwd(), 'src', 'lib', 'prompts', 'context.md'),
          'utf-8'
        );
        
        llm.addMessage({
          role: 'system',
          content: instructions,
        });
        
        llm.addMessage({
          role: 'system',
          content: context,
        });
      } catch (error) {
        log.error('relay', 'Failed to read instructions or context file', error);
      }

      llm.addMessage({
        role: 'system',
        content: `The customer's phone number is ${ev.from} and the Twilio number you are calling from is ${ev.to}.  
        Your call SID is ${ev.callSid}.`,
      });

      // Set up LLM response handler
      llm.on('text', (text, last, transcript) => {
        if (last) {
          log.llm('relay.response', transcript);
        }
        // Send text token to Twilio for TTS
        wss.sendTextToken(text, last);
      });

      // Handle live agent handoff
      llm.on('handoff', (data) => {
        log.info('relay', 'Transferring to live agent', { data });
        wss.end(data); // This will trigger the Connect verb in the TwiML
      });

      // Send initial greeting
      llm.addMessage({
        role: 'system',
        content:
          'You are a helpful AI assistant. Keep responses concise and natural for voice conversation.',
      });
      llm.run();
    });

    // Handle user interruptions
    wss.on('interrupt', (ev) => {
      log.cyan('relay.interrupt', ev.utteranceUntilInterrupt);
    });

    // Handle DTMF input
    wss.on('dtmf', (ev) => {
      log.cyan('relay.dtmf', ev);
    });

    // Handle errors
    wss.on('error', (ev) => {
      log.error('relay.error', ev);
    });

    // Handle connection close
    ws.on('close', () => {
      log.green('relay', 'connection closed');
      if (callerPhoneNumber) {
        activeConversations.delete(callerPhoneNumber);
      }
    });
  });
};
