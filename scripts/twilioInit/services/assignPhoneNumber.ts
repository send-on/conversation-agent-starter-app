// External npm packages
import { Twilio } from 'twilio';
import dotenv from 'dotenv';

// Local imports
import { log } from '../../../src/lib/utils/logger';
import { updateEnvFile } from '../helpers/updateEnvFile';
import { routeNames } from '../../../src/routes/routeNames';

export async function assignPhoneNumber(client: Twilio) {
  dotenv.config();
  const env = process.env.NODE_ENV;
  const isProduction = env === 'production';
  let functionsDomain = process.env.NGROK_URL;
  if (isProduction && process.env.LIVE_HOST_URL) {
    functionsDomain = process.env.LIVE_HOST_URL;
  }

  const voiceUrl = `https://${functionsDomain}/${routeNames.call}`;
  const smsUrl = `https://${functionsDomain}/${routeNames.sms}`;

  const phoneConfig = {
    voiceMethod: 'GET',
    voiceUrl,
    smsMethod: 'POST',
    smsUrl,
  };

  let conversationNumber = process.env.TWILIO_CONVERSATION_NUMBER;

  try {
    // Check if we need to purchase a new number or use the existing one
    if (!conversationNumber) {
      log.info(
        'No TWILIO_CONVERSATION_NUMBER found. Searching for toll-free number...'
      );

      // Get available toll-free numbers and purchase one if available
      const availableNumbers = await client
        .availablePhoneNumbers('US')
        .tollFree.list({ limit: 1 });
      if (!availableNumbers.length)
        throw new Error('No toll-free numbers available.');

      const newNumber = availableNumbers[0].phoneNumber;
      log.info(`Purchasing toll-free number: ${newNumber}`);

      const purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: newNumber,
        ...phoneConfig,
      });

      log.green('Purchased number and configured:', purchased.phoneNumber);
      conversationNumber = purchased.phoneNumber;
    } else {
      log.info(`Existing number found: ${conversationNumber}`);

      // Ensure the number exists in Twilio account
      const incomingNumbers = await client.incomingPhoneNumbers.list({
        phoneNumber: conversationNumber,
      });
      if (!incomingNumbers.length) {
        throw new Error(
          `Could not find configured number ${conversationNumber} in your Twilio account.`
        );
      }

      // Update the existing number's voice URL and method
      const numberSid = incomingNumbers[0].sid;
      await client.incomingPhoneNumbers(numberSid).update({
        ...phoneConfig,
      });

      log.green(`Updated ${conversationNumber} to use voiceUrl ${voiceUrl}`);
      log.yellow(
        `Don't forget to ensure the number is Toll Free Verified in the Console - SMS wont work until then!`
      );

      // If you try to deploy the Twilio assets first,
      // you'll need to make sure to update the phone numbers webhook url to point to the hosted route.
      // You should deploy the app first then run this but we are safeguarding for those who ignore the readme
      // or are wanting to test locally with a deployed phone number.
      if (functionsDomain === process.env.NGROK_URL) {
        log.yellow(`It looks like you are using ngrok on your deployed phone number - 
          don't forget to update the connection in the console when you want to go live:
          https://console.twilio.com/us1/develop/phone-numbers/manage/incoming/${numberSid}/configure
        `);
      }
      if (!process.env.NGROK_URL) {
        log.yellow(
          `Once app is deployed, update LIVE_HOST_URL env var in local and deployed files.`
        );
      }
    }

    // Save the assigned phone number to the .env file
    await updateEnvFile('TWILIO_CONVERSATION_NUMBER', conversationNumber);
    return {
      conversationNumber,
    };
  } catch (error) {
    log.error('Error assigning phone number:', error);
    throw error;
  }
}
