// External npm packages
import Airtable from 'airtable';

// Local imports
import { GetAirtableDataParams, ToolResult } from '../types';

export async function getAirtableDataExecutor(
  args: Record<string, any>
): Promise<ToolResult> {
  const { phoneNumber, baseName } = args as GetAirtableDataParams;

  const {
    AIRTABLE_API_KEY: apiKeyEnv,
    AIRTABLE_BASE_ID: baseIdEnv,
    AIRTABLE_BASE_NAME: baseNameEnv,
  } = process.env;

  try {
    if (!apiKeyEnv || !baseIdEnv) {
      throw new Error(
        `Missing ${!apiKeyEnv ? 'AIRTABLE_API_KEY' : 'AIRTABLE_BASE_ID'}`
      );
    }

    if (!baseNameEnv && !baseName) {
      throw new Error('Airtable base name is not set anywhere');
    }

    if (!phoneNumber) {
      throw new Error('Airtable base name is not set anywhere');
    }

    const airtableBase = new Airtable({ apiKey: apiKeyEnv }).base(baseIdEnv);

    const records = await airtableBase((baseName ?? baseNameEnv) as string)
      .select({
        filterByFormula: `{phone} = '${phoneNumber}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return {
        success: true,
        data: null,
      };
    }

    const record = records[0];
    const rawData = record.fields;

    return {
      success: true,
      data: rawData,
    };
  } catch (err) {
    let errorMessage = 'Failed to get Airtable record';
    errorMessage =
      err instanceof Error ? err.message : JSON.stringify(err) || errorMessage;

    return {
      success: false,
      error: errorMessage,
    };
  }
}
