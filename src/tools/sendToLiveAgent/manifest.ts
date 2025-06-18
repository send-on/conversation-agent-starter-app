import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const sendToLiveAgentManifest: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'sendToLiveAgent',
    description: `Hands the call to a live agent with optional reason and conversation summary. 
       Make sure to notify the customer before transferring to a live agent by saying: 
       "Let me get you over to a live agent to discuss this more" before using this tool`,
    parameters: {
      type: 'object',
      properties: {
        callSid: {
          type: 'string',
          description: 'The unique identifier of the call to be transferred',
        },
        reason: {
          type: 'string',
          description: 'The reason for transferring to a live agent',
        },
        reasonCode: {
          type: 'string',
          description:
            'A code indicating the reason for transfer (e.g., CUSTOMER_REQUEST, COMPLEX_ISSUE)',
        },
        conversationSummary: {
          type: 'string',
          description: 'A summary of the conversation with the AI assistant',
        },
      },
      required: ['callSid'],
    },
  },
};
