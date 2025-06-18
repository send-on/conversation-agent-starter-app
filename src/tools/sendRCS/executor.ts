// External npm packages
import twilio from 'twilio';

// Local imports
import { SendRCSParams, ToolResult } from '../types';
import { log } from '../../lib/utils/logger';

export async function sendRCSExecutor(
  args: Record<string, any>
): Promise<ToolResult> {
  const {
    TWILIO_CONTENT_SID: contentSidEnv,
    TWILIO_MESSAGING_SERVICE_SID: messagingServiceSidEnv,
    TWILIO_ACCOUNT_SID: accountSidEnv,
    TWILIO_AUTH_TOKEN: authTokenEnv,
  } = process.env;

  const { contentSid, messagingServiceSid, to, contentVariables } =
    args as SendRCSParams;

  try {
    if (!messagingServiceSid && !messagingServiceSidEnv) {
      throw new Error(
        `Missing Messaging Service SID.  Please provide in either env or by passing it to fn args`
      );
    }

    if (!contentSid && !contentSidEnv) {
      throw new Error(
        `Missing RCS Template Service SID.  Please provide in either env or by passing it to fn args`
      );
    }

    if (!accountSidEnv || !authTokenEnv) {
      throw new Error(
        `Missing ${!accountSidEnv ? 'TWILIO_ACCOUNT_SID' : 'TWILIO_AUTH_TOKEN'}`
      );
    }

    const twilioClient = twilio(accountSidEnv, authTokenEnv);

    const messageData = await twilioClient.messages.create({
      to,
      contentSid: contentSid ?? contentSidEnv,
      messagingServiceSid: messagingServiceSid ?? messagingServiceSidEnv,
      ...(contentVariables && {
        contentVariables: JSON.stringify(contentVariables),
      }),
    });
    return {
      success: true,
      data: { message: 'Message sent successfully', content: messageData },
    };
  } catch (err) {
    let errorMessage = 'Failed to send RCS';
    errorMessage =
      err instanceof Error ? err.message : JSON.stringify(err) || errorMessage;

    return {
      success: false,
      error: errorMessage,
    };
  }
}
