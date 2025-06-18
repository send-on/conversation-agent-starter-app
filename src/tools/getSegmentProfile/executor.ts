// External npm packages
import axios from 'axios';

// Local imports
import { ToolResult, SegmentProfile } from '../types';

export async function getSegmentProfileExecutor(
  from: string
): Promise<ToolResult> {
  const SEGMENT_TOKEN = process.env.SEGMENT_TOKEN || '';
  const SEGMENT_SPACE = process.env.SEGMENT_SPACE || '';

  try {
    const encodedPhone = encodeURIComponent(from);
    const URL = `https://profiles.segment.com/v1/spaces/${SEGMENT_SPACE}/collections/users/profiles/phone:${encodedPhone}/traits?limit=200`;
    const response = await axios.get<{ traits: SegmentProfile['traits'] }>(
      URL,
      {
        auth: {
          username: SEGMENT_TOKEN,
          password: '',
        },
      }
    );

    const customerData = response.data.traits;

    return {
      success: true,
      data: customerData,
    };
  } catch (err) {
    let errorMessage = 'Failed to get Segment record';
    errorMessage =
      err instanceof Error ? err.message : JSON.stringify(err) || errorMessage;

    return {
      success: false,
      error: errorMessage,
    };
  }
}
