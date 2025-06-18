// External npm packages
import 'dotenv/config';
import twilio, { Twilio } from 'twilio';

// Local imports
import { assignPhoneNumber } from './services/assignPhoneNumber';
import createConversationalIntelligence from './services/createConversationalIntelligence';
import { createMessagingService } from './services/createMessagingService';
import { createTaskRouterService } from './services/createTaskRouter';
import { log } from '../../src/lib/utils/logger';

// Main deployment script that orchestrates the creation of services needed.
async function twilioInit() {
  // Validate environment variables
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error(
      'Missing required environment variables. Please check .env file.'
    );
  }

  log.lightPurple('=== Deployment Started 🚀 ===');

  const client: Twilio = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    log.brightCyan('Step 1: Deploy Task Router Service...');
    const taskRouterService = await createTaskRouterService(client);

    log.brightCyan('\nStep 2: Assign Phone Number...');
    const phoneNumberData = await assignPhoneNumber(client);

    log.brightCyan('\nStep 3: Create Messaging Service...');
    const messagingService = await createMessagingService(
      client,
      phoneNumberData.conversationNumber
    );

    // Step 4: Create the Voice Intelligence Service
    log.brightCyan('\nStep 4: Create Conversational Intelligence Service...');
    const conversationIntelligenceService =
      await createConversationalIntelligence(client);

    // Deployment summary
    log.lightPurple('\n=== Deployment Summary  🎉 ===');
    log.lightBlue(
      'TaskRouter Workspace SID: ',
      taskRouterService.workspace.sid
    );
    log.lightBlue(
      'TaskRouter TaskQueue SID: ',
      taskRouterService.taskQueue.sid
    );
    log.lightBlue('TaskRouter Workflow SID: ', taskRouterService.workflow.sid);
    log.lightBlue(
      'Conversation Phone Number: ',
      phoneNumberData.conversationNumber
    );
    log.lightBlue('Messaging Service SID: ', messagingService.accountSid);
    log.lightBlue('Messaging Service Name: ', messagingService.friendlyName);
    log.lightBlue(
      'Conversational Intelligence Service SID: ',
      conversationIntelligenceService.serviceSid
    );
  } catch (error: any) {
    console.error('\n❌ Deployment failed:');
    console.error('Error:', error.message);

    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.status) {
      console.error('Status Code:', error.status);
    }

    console.log('\nTroubleshooting suggestions:');
    console.log('1. Check your Twilio credentials');
    console.log('2. Verify your account has AI Assistant access');
    console.log('3. Ensure all webhook URLs are valid');
    console.log('4. Check for any duplicate resource names');

    // Close readline interface
    throw error;
  }
}

// Add cleanup function for handling interruptions
process.on('SIGINT', async () => {
  console.log('\n\nReceived interrupt signal. Cleaning up...');
  process.exit(0);
});

// Run the deployment if this script is executed directly
if (require.main === module) {
  twilioInit()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nDeployment failed. See error details above.');
      process.exit(1);
    });
}

export default twilioInit;
