import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const sendRCSManifest: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'sendRCS',
    description: `Sends a RCS message to the users phone number.`,
    parameters: {
      type: 'object',
      properties: {
        contentSid: {
          type: 'string',
          description:
            'The content sid of the message to be sent - only include if instructed to do so, do not guess.',
        },
        messagingServiceSid: {
          type: 'string',
          description:
            'The messaging service sid of the actual RCS service - only include if instructed to do so, do not guess.',
        },
        to: {
          type: 'string',
          description: 'The phone number of the customer (caller)',
        },
        contentVariables: {
          type: 'object',
          description:
            'The variables to be passed to the message. For example {content: "Hello there"} - you must pass this object otherwise it wont know what to send!',
        },
      },
      required: ['to', 'contentVariables'],
    },
  },
};
