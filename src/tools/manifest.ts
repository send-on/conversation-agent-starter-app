import { getSegmentProfileManifest } from './getSegmentProfile/manifest';
import { sendTextManifest } from './sendText/manifest';
import { sendRCSManifest } from './sendRCS/manifest';
import { getAirtableDataManifest } from './getAirtableData/manifest';
import { sendToLiveAgentManifest } from './sendToLiveAgent/manifest';
import { upsertAirtableDataManifest } from './upsertAirtableData/manifest';
import { TemplateData } from '../lib/types';

// Tool Definitions
export const tools: TemplateData['toolData'] = {
  getSegmentProfile: {
    manifest: getSegmentProfileManifest,
  },
  sendText: {
    manifest: sendTextManifest,
  },
  sendRCS: {
    manifest: sendRCSManifest,
  },
  getAirtableData: {
    manifest: getAirtableDataManifest,
  },
  upsertAirtableData: {
    manifest: upsertAirtableDataManifest,
  },
  sendToLiveAgent: {
    manifest: sendToLiveAgentManifest,
  },
};
