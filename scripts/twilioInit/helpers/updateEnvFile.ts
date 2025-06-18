import * as fs from 'fs/promises';
import * as dotenv from 'dotenv';
import { log } from '../../../src/lib/utils/logger';

// Initialize dotenv
dotenv.config();

export const updateEnvFile = async (
  key: string,
  value: string
): Promise<void> => {
  const envFilePath = '.env';
  const envContent = await fs.readFile(envFilePath, 'utf8');
  const envLines = envContent.split('\n');

  // Check if key already exists
  const keyIndex = envLines.findIndex((line) => line.startsWith(`${key}=`));

  if (keyIndex !== -1) {
    // Update existing key
    envLines[keyIndex] = `${key}=${value}`;
  } else {
    // Add new key
    envLines.push(`${key}=${value}`);
  }

  await fs.writeFile(envFilePath, envLines.join('\n'));
  log.lightBlue(`✓ Updated .env file ${key}:`, value);
};
