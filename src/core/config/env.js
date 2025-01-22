import { z } from 'zod';
import dotenv from 'dotenv';
import logger from '../logger/logger.js';

dotenv.config({});

const envVarsSchema = z.object({
  NODE_ENV: z.enum(['prod', 'dev', 'test']),
  PORT: z.string().default('3333'),
});

const { success, data, error } = envVarsSchema.safeParse(process.env);

if (!success && error) {
  logger.error('Config validation error', { error: error.issues });
}

export default {
  ...data,
};
