// External npm packages
import Airtable from 'airtable';

// Local imports
import { ToolResult, UpsertAirtableRecordParams } from '../types';
import { log } from '../../lib/utils/logger';

export async function upsertAirtableDataExecutor(
  args: Record<string, any>
): Promise<ToolResult> {
  const {
    AIRTABLE_API_KEY: apiKeyEnv,
    AIRTABLE_BASE_ID: baseIdEnv,
    AIRTABLE_BASE_NAME: baseNameEnv,
  } = process.env;

  const { baseName, queryField, queryValue, data } =
    args as UpsertAirtableRecordParams;

  try {
    if (!apiKeyEnv || !baseIdEnv) {
      throw new Error(
        `Missing ${!apiKeyEnv ? 'AIRTABLE_API_KEY' : 'AIRTABLE_BASE_ID'}`
      );
    }

    if (!baseNameEnv && !baseName) {
      throw new Error('Airtable base name is not set anywhere');
    }

    const airtableBase = new Airtable({ apiKey: apiKeyEnv }).base(baseIdEnv);
    const tableName = (baseName ?? baseNameEnv) as string;

    const records = await airtableBase(tableName)
      .select({
        filterByFormula: `{${queryField}} = '${queryValue}'`,
        maxRecords: 1,
      })
      .firstPage();

    const record = records[0] ?? null;

    if (record) {
      log.info(
        'airtable',
        `Updating existing record for ${queryField} = ${queryValue}`
      );
      const updatedRecord = await airtableBase(tableName).update([
        { id: record.id, fields: data },
      ]);
      return {
        success: true,
        data: {
          message: `Updated record for ${queryField} = ${queryValue}`,
          content: updatedRecord,
        },
      };
    } else {
      log.info(
        'airtable',
        `Creating new record for ${queryField} = ${queryValue}`
      );
      const newRecord = await airtableBase(tableName).create([
        { fields: { [queryField]: queryValue, ...data } },
      ]);
      return {
        success: true,
        data: {
          message: `Created new record for ${queryField} = ${queryValue}`,
          content: newRecord,
        },
      };
    }
  } catch (err) {
    let errorMessage = 'Failed to upsert Airtable record';
    errorMessage =
      err instanceof Error ? err.message : JSON.stringify(err) || errorMessage;

    return {
      success: false,
      error: errorMessage,
    };
  }
}
