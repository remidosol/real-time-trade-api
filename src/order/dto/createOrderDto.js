import { z } from 'zod';
import { SupportedPairs, Sides } from '../../core/globalConstants.js';

export const CreateOrderDto = z.object({
  orderId: z.string().optional(),
  pair: z.enum(Object.values(SupportedPairs), {
    message: `pair property should be one of these values: ${Object.values(SupportedPairs)}`,
  }),
  side: z.enum(Object.values(Sides), {
    message: `side property should be one of these values: ${Object.values(Sides)}`,
  }),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
});
