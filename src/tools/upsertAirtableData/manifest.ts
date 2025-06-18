import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const upsertAirtableDataManifest: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'upsertAirtableData',
    description: `Upserts details into database and is used when customer provides new information about their dataset.
      ALWAYS Make sure to pass the data object to the function otherwise it wont know what to update!
      Try to use the phone as the queryField and queryValue if you have it.`,
    parameters: {
      type: 'object',
      properties: {
        queryField: {
          type: 'string',
          description:
            'The field to query the database with. Can be phone, email.',
        },
        queryValue: {
          type: 'string',
          description:
            'The value to query the database with. This is the value of the field you are querying with.',
        },
        data: {
          type: 'object',
          description:
            'Object containing the data to be upserted where the key is the column name in the table and the value is the value to be upserted. It is required to pass this object otherwise it wont know what to update!',
        },
        baseName: {
          type: 'string',
          description:
            'The name of the Airtable base to upsert data to only include if instructed to do so, do not guess.',
        },
      },
      required: ['queryField', 'queryValue', 'data'],
    },
  },
};
