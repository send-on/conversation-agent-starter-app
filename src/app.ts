// External npm packages
import express from 'express';
import ExpressWs from 'express-ws';
import 'dotenv/config';

// Local imports
import { log } from './lib/utils/logger';
import { setupConversationRelayRoute } from './routes/conversationRelay';
import callRouter from './routes/call';
import smsRouter from './routes/sms';
import liveAgentRouter from './routes/liveAgent';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const { app } = ExpressWs(express());
app.use(express.urlencoded({ extended: true })).use(express.json());

// Set up WebSocket route for conversation relay
setupConversationRelayRoute(app);

// Set up HTTP routes
app.use('/', callRouter);
app.use('/', smsRouter);
app.use('/', liveAgentRouter);

app.listen(PORT, () => {
  log.info('server', `listening on port ${PORT}`);
});
