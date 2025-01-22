import { z } from 'zod';
import { SupportedPairs } from '../../core/globalConstants.js';

export const TradePairDto = z.object({
  pair: z.enum(Object.values(SupportedPairs), {
    message: `pair property should be one of these values: ${Object.values(SupportedPairs)}`,
  }),
  limit: z
    .number({ message: 'limit must be number' })
    .positive('limit must be positive')
    .optional(),
});
