import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const getAirtableDataManifest: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getAirtableData',
    description:
      'Retrieves customer account information from Airtable using their phone number',
    parameters: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description:
            'The phone number of the customer to fetch account information for',
        },
        baseName: {
          type: 'string',
          description:
            'The name of the Airtable base to fetch account information from',
        },
      },
      required: ['phoneNumber'],
    },
  },
};
