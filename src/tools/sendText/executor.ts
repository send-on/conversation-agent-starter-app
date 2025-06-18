// External npm packages
import twilio from 'twilio';

// Local imports
import { ToolResult } from '../types';

export async function sendTextExecutor(
  args: Record<string, any>
): Promise<ToolResult> {
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID || '',
    process.env.TWILIO_AUTH_TOKEN || ''
  );

  try {
    const { message, to } = args;
    if (!message || !to) {
      return {
        success: false,
        error: 'Message and phone number are required',
      };
    }

    const fromNumber = process.env.TWILIO_CONVERSATION_NUMBER;
    if (!fromNumber) {
      return {
        success: false,
        error: 'Missing Twilio phone number environment variable',
      };
    }

    // Send text message using Twilio
    await twilioClient.messages.create({
      body: message,
      to,
      from: fromNumber,
    });

    return {
      success: true,
      data: { message: 'Text message sent successfully' },
    };
  } catch (err) {
    let errorMessage = 'Failed to send SMS';
    errorMessage =
      err instanceof Error ? err.message : JSON.stringify(err) || errorMessage;

    return {
      success: false,
      error: errorMessage,
    };
  }
}
