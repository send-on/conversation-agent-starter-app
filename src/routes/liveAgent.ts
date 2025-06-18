// External npm packages
import { Router } from 'express';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';

// Local imports
import { log } from '../lib/utils/logger';
import { routeNames } from './routeNames';
import { LiveAgentRequestQuery } from '../lib/types/twilio';

const router = Router();

router.post(`/${routeNames.liveAgent}`, async (req, res) => {
  const {
    AccountSid: accountSid,
    CallSid: callSid,
    From: from,
    To: to,
    Direction: direction,
    SessionId: sessionId,
    SessionStatus: sessionStatus,
    SessionDuration: sessionDuration,
  } = req.query as LiveAgentRequestQuery;

  log.info(routeNames.liveAgent, 'Received request body:', req.body);
  log.info(routeNames.liveAgent, 'Received query params:', req.query);

  // Get and parse handoff data from request body or query parameters
  let handoffData: Record<string, unknown> = {};
  try {
    // First try to get from request body
    const rawHandoffData = req.body?.handoffData || req.body?.HandoffData;
    if (rawHandoffData) {
      if (typeof rawHandoffData === 'string') {
        handoffData = JSON.parse(rawHandoffData);
      } else {
        handoffData = rawHandoffData;
      }
    }
    log.info(routeNames.liveAgent, 'Parsed handoff data:', handoffData);
  } catch (error) {
    log.error(routeNames.liveAgent, 'Failed to parse handoff data:', error);
  }

  const customerNumber = direction?.includes('outbound') ? to : from;
  const agentNumber = direction?.includes('outbound') ? from : to;

  const taskAttributes = {
    accountSid,
    callSid,
    from: agentNumber,
    to: customerNumber,
    sessionId,
    sessionStatus,
    sessionDuration,
    handoffReason: handoffData.reason || 'No reason provided',
    reasonCode: handoffData.reasonCode || 'No reason code',
    conversationSummary:
      handoffData.conversationSummary || 'No conversation summary',
  };

  log.info('live-agent', 'Enqueuing call with attributes', taskAttributes);

  const twiml = new VoiceResponse();
  twiml
    .enqueue({
      workflowSid: process.env.TWILIO_WORKFLOW_SID,
    })
    .task({ priority: 1000 }, JSON.stringify(taskAttributes));

  log.info(routeNames.liveAgent, 'Generated TwiML', twiml.toString());

  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;
