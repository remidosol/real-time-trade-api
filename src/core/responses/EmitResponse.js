import {
  OutgoingEventNames,
  ErrorEventNames,
} from '../../modules/events/index.js';

export class EmitResponse {
  /**
   * Constructs an EmitResponse instance.
   *
   * @param {{event:OutgoingEventNames|ErrorEventNames; success: boolean; message: string; data: any; error: any}} response
   * @property event - Indicates the relevant event name
   * @property success - Indicates if the operation was successful.
   * @property message - A descriptive message about the operation's result.
   * @property [data] - Optional data returned from the operation.
   * @property [error] - Optional error message if the operation failed.
   */
  constructor({
    event,
    success,
    message = undefined,
    data = undefined,
    error = undefined,
  }) {
    this.event = event;
    this.success = success;
    this.message = message;

    if (data !== null) {
      this.data = data;
    }

    if (error !== null) {
      this.error = error;
    }
  }

  /**
   * Creates a success EmitResponse.
   *
   * @param {{event:OutgoingEventNames|ErrorEventNames; message: string; data: any;}} response
   *
   * @returns {EmitResponse}
   */
  static Success({ event, message = undefined, data = undefined }) {
    return new EmitResponse({ event, success: true, message, data });
  }

  /**
   * Creates an error EmitResponse.
   *
   * @param {{event:OutgoingEventNames|ErrorEventNames; message: string; error: any}} response
   *
   * @returns {EmitResponse}
   */
  static Error({ event, message = undefined, error = null }) {
    return new EmitResponse({
      event,
      success: false,
      message,
      data: null,
      error,
    });
  }
}
