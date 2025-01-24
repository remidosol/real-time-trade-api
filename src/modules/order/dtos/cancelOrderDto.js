import { z } from 'zod';

export const cancelOrderRequestDto = z.object({
  orderId: z.string(),
});
