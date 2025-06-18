import { ToolResult } from './types';
import { getSegmentProfileExecutor } from './getSegmentProfile/executor';
import { sendTextExecutor } from './sendText/executor';
import { sendRCSExecutor } from './sendRCS/executor';
import { getAirtableDataExecutor } from './getAirtableData/executor';
import { sendToLiveAgentExecutor } from './sendToLiveAgent/executor';
import { upsertAirtableDataExecutor } from './upsertAirtableData/executor';

// Tool Executors
export async function executeTool(
  name: string,
  args: Record<string, any>
): Promise<ToolResult> {
  switch (name) {
    case 'getSegmentProfile':
      return getSegmentProfileExecutor(args.from);
    case 'sendText':
      return sendTextExecutor(args);
    case 'sendRCS':
      return sendRCSExecutor(args);
    case 'getAirtableData':
      return getAirtableDataExecutor(args);
    case 'upsertAirtableData':
      return upsertAirtableDataExecutor(args);
    case 'sendToLiveAgent':
      return sendToLiveAgentExecutor(args);
    default:
      return {
        success: false,
        error: `Unknown tool: ${name}`,
      };
  }
}
