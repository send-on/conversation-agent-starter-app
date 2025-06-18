// External npm packages
import { Twilio } from 'twilio';
import dotenv from 'dotenv';

// Local imports
import { log } from '../../../src/lib/utils/logger';
import { updateEnvFile } from '../helpers/updateEnvFile';

export async function createMessagingService(
  client: Twilio,
  phoneNumber?: string
) {
  dotenv.config();
  const serviceName = process.env.SERVICE_NAME;
  const conversationNumber =
    phoneNumber || process.env.TWILIO_CONVERSATION_NUMBER;

  try {
    if (!serviceName || !conversationNumber) {
      throw new Error(
        'SERVICE_NAME or TWILIO_CONVERSATION_NUMBER is not set in the environment variables.'
      );
    }
    const messagingServiceName = `${serviceName} Messaging Service`;
    // Step 1: Check if a Messaging Service already exists with the same name
    const services = await client.messaging.v1.services.list({ limit: 50 });

    let messagingService = services.find(
      (service) => service.friendlyName === messagingServiceName
    );

    // Step 2: Create a new Messaging Service using the v1 namespace
    if (!messagingService) {
      messagingService = await client.messaging.v1.services.create({
        friendlyName: messagingServiceName,
        ...({
          useInboundWebhookOnNumber: true,
        } as any),
      });
      log.green(
        `New messaging service created: ${messagingService.sid} - aka ${messagingService.friendlyName}`
      );
    } else {
      // Update existing service to use sender's webhook
      messagingService = await client.messaging.v1
        .services(messagingService.sid)
        .update({
          ...({
            useInboundWebhookOnNumber: true,
          } as any),
        });
      log.info(
        `Existing messaging service found: ${messagingService.sid} - aka ${messagingService.friendlyName}`
      );
    }
    if (messagingService) {
      // Save the assigned messaging to the .env file
      await updateEnvFile('TWILIO_MESSAGING_SERVICE_SID', messagingService.sid);
    }

    // Step 3: Attach conversation number to sender pool (if not already added)
    const phoneNumbers = await client.messaging.v1
      .services(messagingService.sid)
      .phoneNumbers.list();

    const isNumberAttached = phoneNumbers.some(
      (pn) => pn.phoneNumber === conversationNumber
    );

    if (!isNumberAttached) {
      const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
        phoneNumber: conversationNumber,
      });

      if (incomingPhoneNumbers.length === 0) {
        throw new Error(
          `Phone number ${conversationNumber} not found in your Twilio account.`
        );
      }

      await client.messaging.v1
        .services(messagingService.sid)
        .phoneNumbers.create({
          phoneNumberSid: incomingPhoneNumbers[0].sid,
        });

      log.green(
        `Attached phone number ${conversationNumber} to messaging service`
      );
    }

    // Step 4: Attach RCS to sender pool manually.
    log.yellow(`RCS isn't yet supported via API and requires manual enablement: 
      https://www.twilio.com/messaging/channels/rcs#request-access-form.`);
    log.yellow(`Use the Twilio Console to add the RCS sender to the service.`);

    const { accountSid, friendlyName } = messagingService;
    return { friendlyName, accountSid };
  } catch (error) {
    log.error('Error assigning phone number:', error);
    throw error;
  }
}
