import {
  createOrderRequestDto,
  cancelOrderRequestDto,
} from '../order/index.js';
import {
  subscriptionPairRequestDto,
  topOrderRequestDto,
} from '../subscription/index.js';
import { tradePairRequestDto } from '../trade/index.js';
import { IncomingEventNames } from './constants.js';

export const EventSchemas = {
  [IncomingEventNames.CREATE_ORDER]: createOrderRequestDto,
  [IncomingEventNames.CANCEL_ORDER]: cancelOrderRequestDto,
  [IncomingEventNames.SUBSCRIBE_PAIR]: subscriptionPairRequestDto,
  [IncomingEventNames.UNSUBSCRIBE_PAIR]: subscriptionPairRequestDto,
  [IncomingEventNames.GET_TOP_ORDER_BOOK]: topOrderRequestDto,
  [IncomingEventNames.MATCH_TOP_ORDERS]: tradePairRequestDto,
  [IncomingEventNames.GET_RECENT_TRADES]: tradePairRequestDto,
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
