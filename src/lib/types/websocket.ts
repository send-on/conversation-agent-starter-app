// Node.js built-in modules
import { EventEmitter } from 'node:events';

// External npm packages
import { WebSocket } from 'ws';

// Local imports
import { TwilioAction } from './twilio';

// WebSocket Event Types
export interface TypedWsEvents {
  message: (ev: TwilioRelayMessage) => void;
  dtmf: (ev: DTMFMessage) => void;
  error: (ev: ErrorMessage) => void;
  info: (ev: InfoMessage) => void;
  interrupt: (ev: HumanInterrupt) => void;
  prompt: (ev: PromptMessage) => void;
  setup: (ev: SetupMessage) => void;
  tokensPlayed: (ev: TokensPlayedMessage) => void;
  close: () => void;
  wsError: (err: Error) => void;
}

// Typed Event Emitter
export class TypedEventEmitter<T> extends EventEmitter {
  override emit<K extends keyof T & (string | symbol)>(
    event: K,
    ...args: Parameters<T[K] extends (...args: any[]) => any ? T[K] : never>
  ): boolean {
    return super.emit(event, ...args);
  }

  override on<K extends keyof T & (string | symbol)>(
    event: K,
    listener: T[K] extends (...args: any[]) => any ? T[K] : never
  ): this {
    return super.on(event, listener);
  }
}

// WebSocket Messages
export type TwilioRelayMessage =
  | DTMFMessage
  | ErrorMessage
  | HumanInterrupt
  | PromptMessage
  | SetupMessage
  | TokensPlayedMessage
  | InfoMessage;

export type DTMFMessage = {
  type: 'dtmf';
  digit: string;
};

export type ErrorMessage = {
  type: 'error';
  description: string;
};

export type HumanInterrupt = {
  type: 'interrupt';
  durationUntilInterruptMs: string;
  utteranceUntilInterrupt: string;
};

export type PromptMessage = {
  type: 'prompt';
  voicePrompt: string;
  lang: 'en-US';
  last: boolean;
};

export type SetupMessage = {
  type: 'setup';
  accountSid: string;
  applicationSid: string | null;
  callerName: string;
  callSid: string;
  callStatus: string;
  callType: 'PSTN';
  customParameters?: Record<string, string> & {
    context?: string;
    greeting?: string;
  };
  direction: 'inbound';
  forwardedFrom: string;
  from: string;
  parentCallSid: string;
  sessionId: string;
  to: string;
  context?: Record<string, any>;
  greeting?: string;
};

export type TokensPlayedMessage = {
  type: 'info';
  name: 'tokensPlayed';
  value: string;
};

export interface InfoMessage {
  type: 'info';
  [key: string]: any;
}

// Handoff Data Type
export type HandoffData<T extends { reasonCode: string } = any> = T;

// Typed WebSocket Class
export class TypedWs {
  private emitter = new TypedEventEmitter<TypedWsEvents>();

  constructor(private ws: WebSocket) {
    ws.on('message', this.parse);
    ws.on('close', () => this.emitter.emit('close'));
    ws.on('error', (err) => this.emitter.emit('wsError', err));
  }

  // Event emitter methods
  on: (typeof this.emitter)['on'] = (...args) => this.emitter.on(...args);

  // Send actions to Twilio
  send = (action: TwilioAction) => this.ws.send(JSON.stringify(action));

  // Send text token for TTS
  sendTextToken = (token: string, last: boolean) =>
    this.send({ type: 'text', token, last });

  // End the session
  end = (handoffData?: Record<string, any>) =>
    this.send({ type: 'end', handoffData: JSON.stringify(handoffData ?? {}) });

  // Send DTMF tones
  sendDTMF = (digits: string) => this.send({ type: 'sendDigits', digits });

  // Parse incoming messages
  private parse = (data: any) => {
    try {
      const msg: TwilioRelayMessage = JSON.parse(data);
      this.emitter.emit(msg.type as keyof TypedWsEvents, msg as any);
    } catch (error) {
      this.emitter.emit('error', {
        type: 'error',
        description: 'Failed to parse message',
      });
    }
  };
}
