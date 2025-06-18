export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface SegmentProfile {
  traits: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
}

export interface AirtableData {
  accountNumber: string;
  accountType: string;
  balance: number;
  lastTransaction: string;
  [key: string]: any;
}

export interface UpsertAirtableRecordParams {
  baseName: string;
  queryField: 'phone' | 'email';
  queryValue: string;
  data: Record<string, string>;
}

export interface GetAirtableDataParams {
  phoneNumber: string;
  baseName?: string;
}

export interface SendRCSParams {
  to: string;
  contentSid?: string;
  messagingServiceSid?: string;
  contentVariables?: object;
}
