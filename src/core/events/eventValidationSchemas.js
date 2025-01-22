import { CreateOrderDto, CancelOrderDto } from '../../order/index.js';
import { SubscriptionPairDto } from '../../subscription/index.js';
import { TradePairDto } from '../../trade/index.js';
import { IncomingEventNames } from './eventConstants.js';

export const EventSchemas = {
  [IncomingEventNames.CREATE_ORDER]: CreateOrderDto,
  [IncomingEventNames.CANCEL_ORDER]: CancelOrderDto,
  [IncomingEventNames.SUBSCRIBE_PAIR]: SubscriptionPairDto,
  [IncomingEventNames.UNSUBSCRIBE_PAIR]: SubscriptionPairDto,
  [IncomingEventNames.MATCH_TOP_ORDERS]: TradePairDto,
  [IncomingEventNames.GET_RECENT_TRADES]: TradePairDto,
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
