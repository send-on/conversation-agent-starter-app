// External npm packages
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import OpenAI from 'openai';

// Local imports
import { InitialCallInfo } from './twilio';

// LLM Service Types
export interface Store {
  context?: Record<string, any>;
  msgs: ChatCompletionMessageParam[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// GPT Tool Types
export type GptToolManifest = {
  tools: ChatCompletionTool[];
};

export type GptServiceConstructorProps = {
  promptContext: string;
  toolManifest: GptToolManifest;
  initialCallInfo: InitialCallInfo;
};

export type GptGenerateResponse = {
  role: OpenAI.Chat.Completions.ChatCompletionMessageParam['role'];
  prompt: string;
  externalMessage?: IncomingExternalMessage;
};

export type GptReturnResponse = {
  type: string;
  handoffData?: string;
  last?: boolean;
  token?: string;
};

export type GptMessageHandlerInput =
  | {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }
  | {
      role: 'tool';
      content: string;
      toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall;
    };

// External Message Types
export type IncomingExternalMessage = {
  body: string;
  from: string;
};

export interface LLMEvents {
  text: (text: string, last: boolean, fullText?: string) => void;
  handoff: (data: any) => void;
  language: (data: any) => void;
}

export type TemplateData = {
  prompt: string;
  instructions: string;
  toolData: Record<string, { manifest: ChatCompletionTool }>;
};
