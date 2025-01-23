import { z } from 'zod';

export const CancelOrderRequestDto = z.object({
  orderId: z.string(),
});
