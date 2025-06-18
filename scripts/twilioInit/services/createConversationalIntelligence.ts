// External npm packages
import { Twilio } from 'twilio';
import dotenv from 'dotenv';

// Local imports
import { log } from '../../../src/lib/utils/logger';
import { updateEnvFile } from '../helpers/updateEnvFile';
import { kebab } from '../helpers/kebab';
import { ServiceInstance } from 'twilio/lib/rest/intelligence/v2/service';

const OPERATOR_CONFIGS = {
  callScoring: {
    config: {
      prompt: `Use the following parameters to evaluate the phone call between the agent and the customer. 
      Assign scores (1 to 5) to each KPI and provide comments to justify the score. 
      Each KPI assesses the agent's performance in various aspects of the call.
      1. Greeting & Professionalism: Was the agent friendly, clear, and professional? (1–5)
      2. Listening & Empathy: Did the agent actively listen and show empathy? (1–5)
      3. Communication & Clarity: Was the information clear and easy to understand? (1–5)
      4. Problem-Solving: Did the agent resolve the issue efficiently? (1–5)
      5. Overall Experience: Was the customer satisfied, and was the call handled well? (1–5)`,
      json_result_schema: {
        type: 'object',
        properties: {
          greeting_professionalism: { type: 'integer' },
          listening_empathy: { type: 'integer' },
          communication_clarity: { type: 'integer' },
          problem_solving: { type: 'integer' },
          overall_experience: { type: 'integer' },
        },
      },
      examples: [],
    },
    friendlyName: 'CallScoring',
    operatorType: 'GenerativeJSON' as const,
  },
  competitiveEscalation: {
    config: {
      prompt: `Use the following parameters to evaluate the phone call between the agent and the customer. 
      Answer following questions based on the transcript. 
      1. Competitor Mentions: Did the customer mention any competitors during the call? (Yes/No)
      2. Objections Raised: Did the customer express dissatisfaction, concerns, or objections related to the product/service or pricing? (Yes/No)
      3. Agent's Response to Objections: How effectively did the agent address the customer's objections or concerns? (1–5)
      4. Escalation Need: Does the call indicate a need for escalation (e.g., customer dissatisfaction, unresolved issue)? (Yes/No)
      5. Next Best Action: Based on the call, what is the recommended next step for the agent (e.g., follow-up call, transfer to sales, offer a discount)? (String)`,
      json_result_schema: {
        type: 'object',
        properties: {
          competitor_mentions: { type: 'boolean' },
          objections_raised: { type: 'boolean' },
          agent_response_to_objections_score: { type: 'integer' },
          escalation_needed: { type: 'boolean' },
          next_best_action: { type: 'string' },
        },
      },
      examples: [],
    },
    friendlyName: 'CompetitiveEscalation',
    operatorType: 'GenerativeJSON' as const,
  },
} as const;

/**
 * Creates a Conversational Intelligence Service and attaches custom operators
 * @param {Client} Twilio - Twilio client instance
 */
async function createConversationalIntelligence(client: Twilio): Promise<{
  serviceSid: string;
  callScoringOperatorSid: string;
  competitiveEscalationOperatorSid: string;
}> {
  dotenv.config();
  try {
    const serviceUniqueName = `conversational-intelligence-${kebab(
      process.env.SERVICE_NAME ?? 'default'
    )}`;

    // Check if service already exists
    const existingServices = await client.intelligence.v2.services.list();
    const existingService = existingServices.find(
      (s) => s.uniqueName === serviceUniqueName
    );

    let service: ServiceInstance;
    if (existingService) {
      log.info(
        'Existing Conversational Intelligence Service found:',
        existingService.sid
      );
      service = existingService;
    } else {
      log.info('Creating new Conversational Intelligence Service...');
      // Create the service
      service = await client.intelligence.v2.services.create({
        uniqueName: serviceUniqueName,
      });
      log.green(
        'Conversational Intelligence Service created successfully:',
        service.sid
      );
    }

    // Check for existing operators
    const existingOperators =
      await client.intelligence.v2.customOperators.list();
    let callScoringOperator = existingOperators.find(
      (op) => op.friendlyName === OPERATOR_CONFIGS.callScoring.friendlyName
    );
    let competitiveEscalationOperator = existingOperators.find(
      (op) =>
        op.friendlyName === OPERATOR_CONFIGS.competitiveEscalation.friendlyName
    );

    // Create first custom operator for call scoring if it doesn't exist
    if (!callScoringOperator) {
      log.info('Creating Call Scoring operator...');
      callScoringOperator = await client.intelligence.v2.customOperators.create(
        OPERATOR_CONFIGS.callScoring
      );
      log.green(
        'Call Scoring operator created successfully:',
        callScoringOperator.sid
      );

      // Attach first operator to service
      await client.intelligence.v2
        .operatorAttachment(service.sid, callScoringOperator.sid)
        .create();
      log.green('Call Scoring operator attached successfully to service');
    } else {
      log.info(
        'Existing Call Scoring operator found:',
        callScoringOperator.sid
      );
    }

    // Create second custom operator for competitive escalation if it doesn't exist
    if (!competitiveEscalationOperator) {
      log.info('Creating Competitive Escalation operator...');
      competitiveEscalationOperator =
        await client.intelligence.v2.customOperators.create(
          OPERATOR_CONFIGS.competitiveEscalation
        );
      log.green(
        'Competitive Escalation operator created successfully:',
        competitiveEscalationOperator.sid
      );

      // Attach second operator to service
      await client.intelligence.v2
        .operatorAttachment(service.sid, competitiveEscalationOperator.sid)
        .create();
      log.green(
        'Competitive Escalation operator attached successfully to service'
      );
    } else {
      log.info(
        'Existing Competitive Escalation operator found:',
        competitiveEscalationOperator.sid
      );
    }

    // Save Conversational Intelligence Service SID to .env
    await updateEnvFile('TWILIO_CONVERSATIONAL_INTELLIGENCE_SID', service.sid);

    return {
      serviceSid: service.sid,
      callScoringOperatorSid: callScoringOperator.sid,
      competitiveEscalationOperatorSid: competitiveEscalationOperator.sid,
    };
  } catch (error) {
    log.error('Failed to create Conversational Intelligence Service:', error);
    throw error;
  }
}

export default createConversationalIntelligence;
