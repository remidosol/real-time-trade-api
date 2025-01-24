import httpStatus from 'http-status';
import env from '../../config/env.js';
import { ApiError } from '../exceptions/index.js';
import logger from '../logger/Logger.js';

export const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode
      ? httpStatus.BAD_REQUEST
      : httpStatus.INTERNAL_SERVER_ERROR;

    const message = error.message || httpStatus[statusCode];

    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (env.env === 'prod' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(env.env === 'dev' && { stack: err.stack }),
  };

  if (config.env === 'dev') {
    logger.error({
      ...err,
      context: '[ErrorHandler]',
      err,
    });
  }

  res.status(statusCode).send(response);
};
