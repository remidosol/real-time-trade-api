import { z } from 'zod';
import { SupportedPairs } from '../../../core/globalConstants.js';
import { Sides } from '../orderConstants.js';

export const CreateOrderRequestDto = z.object({
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
