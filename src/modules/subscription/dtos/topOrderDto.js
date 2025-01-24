import { z } from 'zod';

export const topOrderRequestDto = z.object({
  limit: z
    .number({ message: 'limit must be number' })
    .positive('limit must be positive')
    .optional(),
});
