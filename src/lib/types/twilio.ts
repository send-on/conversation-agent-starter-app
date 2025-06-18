import VoiceResponse = require('twilio/lib/twiml/VoiceResponse.js');

export type ConversationRelayParams = VoiceResponse.ConversationRelayAttributes;

// Twilio Call Information
export interface IncomingCallPayload {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  ApiVersion: string;
  Direction: 'inbound' | 'outbound-api';
  CallStatus:
    | 'queued'
    | 'ringing'
    | 'in-progress'
    | 'completed'
    | 'busy'
    | 'failed'
    | 'no-answer';
  CallCost?: string;
  CallerId?: string;
  CallerName?: string;
  Duration?: string;
  ForwardedFrom?: string;
  FromCity?: string;
  FromCountry?: string;
  FromState?: string;
  FromZip?: string;
  RecordingSid?: string;
  RecordingUrl?: string;
  StartTime?: string;
  ToCity?: string;
  ToCountry?: string;
  ToState?: string;
  ToZip?: string;
}

// Twilio Context and Initial Call Info
export interface TwilioContext {
  [key: string]: any;
}

export interface InitialCallInfo {
  twilioNumber: string;
  customerNumber: string;
  callSid: string;
  direction: 'inbound' | 'outbound-api';
  callReason: 'loan' | 'banking' | 'unknown';
}

// Twilio Actions
export type TwilioAction =
  | EndSession
  | PlayMedia
  | SendDigits
  | SendTextToken;

export type EndSession = {
  type: 'end';
  handoffData: string;
};

export type PlayMedia = {
  type: 'play';
  loop: number;
  preemptible?: boolean;
  source: string;
};

export type SendDigits = {
  type: 'sendDigits';
  digits: string;
};

export type SendTextToken = {
  type: 'text';
  last: boolean;
  token: string;
};

// Live Agent Request Query Parameters
export interface LiveAgentRequestQuery {
  AccountSid?: string;
  CallSid?: string;
  From?: string;
  To?: string;
  Direction?: string;
  SessionId?: string;
  SessionStatus?: string;
  SessionDuration?: string;
}
