import { z } from 'zod';
import { SupportedPairs } from '../../../core/globalConstants.js';
import { Sides, OrderType } from '../orderConstants.js';

const requestDto = {
  orderType: z.enum(Object.values(OrderType), {
    message: `orderType property should be one of these values: ${Object.values(OrderType)}`,
  }),
  pair: z.enum(Object.values(SupportedPairs), {
    message: `pair property should be one of these values: ${Object.values(SupportedPairs)}`,
  }),
  side: z.enum(Object.values(Sides), {
    message: `side property should be one of these values: ${Object.values(Sides)}`,
  }),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
};

const orderTypeEnumSchema = z.enum(Object.values(OrderType), {
  message: `orderType property should be one of these values: ${Object.values(OrderType)}`,
});

const createLimitOrderRequestDto = z.object({
  orderType: z.literal(orderTypeEnumSchema.enum[OrderType.LIMIT]),
  pair: requestDto.pair,
  side: requestDto.side,
  price: requestDto.price,
  quantity: requestDto.quantity,
});

const createMarketOrderRequestDto = z.object({
  orderType: z.literal(orderTypeEnumSchema.enum[OrderType.MARKET]),
  pair: requestDto.pair,
  side: requestDto.side,
  quantity: requestDto.quantity,
});

export const createOrderRequestDto = z.discriminatedUnion('orderType', [
  createLimitOrderRequestDto,
  createMarketOrderRequestDto,
]);
