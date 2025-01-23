import {
  CreateOrderRequestDto,
  CancelOrderRequestDto,
} from '../order/index.js';
import { SubscriptionPairRequestDto } from '../subscription/index.js';
import { TradePairRequestDto } from '../trade/index.js';
import { IncomingEventNames } from './constants.js';

export const EventSchemas = {
  [IncomingEventNames.CREATE_ORDER]: CreateOrderRequestDto,
  [IncomingEventNames.CANCEL_ORDER]: CancelOrderRequestDto,
  [IncomingEventNames.SUBSCRIBE_PAIR]: SubscriptionPairRequestDto,
  [IncomingEventNames.UNSUBSCRIBE_PAIR]: SubscriptionPairRequestDto,
  [IncomingEventNames.MATCH_TOP_ORDERS]: TradePairRequestDto,
  [IncomingEventNames.GET_RECENT_TRADES]: TradePairRequestDto,
  [IncomingEventNames.GET_TOP_ORDER_BOOK]: TradePairRequestDto,
};

/**
 * To get the validation result of data
 *
 * @param {keyof EventSchemas} event
 * @param {object} data
 * @returns
 */
export const isValidationSuccess = (event, data) => {
  return EventSchemas[event]
    ? EventSchemas[event].safeParse(data).success
    : true;
};
