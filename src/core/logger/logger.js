import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';
import { loggerLevels } from './constants.js';

dotenv.config({});

class Logger {
  #logger;

  constructor() {
    this.#logger = createLogger({
      level: process.env.NODE_ENV === 'dev' ? 'debug' : 'info',
      silent: false,
      handleExceptions: true,
      transports: [new transports.Console()],
      format: format.combine(
        format.colorize({
          level: true,
          colors: {
            info: 'bgBrightGreen',
            error: 'bgBrightRed',
            debug: 'bgBrightBlue',
            warn: 'bgBrightYellow',
          },
        }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message, context, timestamp, error }) => {
          const manipulateError =
            error && typeof error === 'object'
              ? JSON.stringify(error, null, 2)
              : error && typeof error === 'string'
                ? error
                : ' ';

          return `${timestamp} ${level}${context ? ' ' + context + ' ' : ' '}${message} ${manipulateError}`;
        }),
      ),
    });
  }

  /**
   * Log a message
   *
   * @param {"debug"|"info"|"warn"|"error"} level
   * @param {string | Error} message
   * @param {object?} data
   * @param {string?} profile
   */
  #log(level, message, data, profile) {
    try {
      const logData = this.#getLogData(level, message, data);

      if (profile) {
        this.#logger.profile(profile);
      } else {
        this.#logger.log(logData);
      }
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Log a debug message
   *
   * @param {string | Error} message
   * @param {object?} data
   * @param {string?} profile
   */
  debug(message, data, profile) {
    this.#log(loggerLevels.debug, message, data, profile);
  }

  /**
   * Log a info message
   *
   * @param {string | Error} message
   * @param {object?} data
   * @param {string?} profile
   */
  info(message, data, profile) {
    this.#log(loggerLevels.info, message, data, profile);
  }

  /**
   * Log a warn message
   *
   * @param {string | Error} message
   * @param {object?} data
   * @param {string?} profile
   */
  warn(message, data, profile) {
    this.#log(loggerLevels.warn, message, data, profile);
  }

  /**
   * Log a error message
   *
   * @param {string | Error} message
   * @param {object?} data
   * @param {string?} profile
   */
  error(message, data, profile) {
    this.#log(loggerLevels.error, message, data, profile);
  }

  /**
   * To get log data properly
   *
   * @param {"debug"|"info"|"warn"|"error"} level
   * @param {string | Error} message
   * @param {object?} data
   * @returns
   */
  #getLogData(level, message, data) {
    return {
      level,
      message: message instanceof Error ? message.message : message,
      error: message instanceof Error ? message : undefined,
      ...data,
    };
  }
}

const logger = new Logger();

export default logger;
