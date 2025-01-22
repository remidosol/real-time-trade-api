import { z } from 'zod';

export const CancelOrderDto = z.object({
  orderId: z.string(),
});
