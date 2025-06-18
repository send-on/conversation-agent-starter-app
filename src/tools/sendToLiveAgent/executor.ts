// Local imports
import { ToolResult } from '../types';

export async function sendToLiveAgentExecutor(
  args: Record<string, any>
): Promise<ToolResult> {
  try {
    const { callSid, reason, reasonCode, conversationSummary } = args;
    if (!callSid) {
      return {
        success: false,
        error: 'Call SID is required for live agent handoff',
      };
    }

    // Return the handoff data that will be used by the WebSocket to trigger the handoff
    return {
      success: true,
      data: {
        callSid,
        reason: reason || 'Customer requested live agent',
        reasonCode: reasonCode || 'CUSTOMER_REQUEST',
        conversationSummary: conversationSummary || 'No summary provided',
      },
    };
  } catch (err) {
    let errorMessage = 'Failed to transfer to live agent';
    errorMessage =
      err instanceof Error ? err.message : JSON.stringify(err) || errorMessage;

    return {
      success: false,
      error: errorMessage,
    };
  }
}
