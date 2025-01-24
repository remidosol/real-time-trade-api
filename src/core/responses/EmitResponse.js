export class EmitResponse {
  /**
   * Constructs an EmitResponse instance.
   *
   * @param {{event: string; success: boolean; message: string; data: any; error: any}} response
   * @property payloadEventKey - Indicates the relevant event name
   * @property success - Indicates if the operation was successful.
   * @property message - A descriptive message about the operation's result.
   * @property [data] - Optional data returned from the operation.
   * @property [error] - Optional error message if the operation failed.
   */
  constructor({
    payloadEventKey,
    success,
    message = undefined,
    data = undefined,
    error = undefined,
  }) {
    this.payloadEventKey = payloadEventKey;
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
   * @param {{eventEmit: string; payloadEventKey: string; message: string; data: any;}} response
   *
   * @returns {[string, EmitResponse]}
   */
  static Success({
    eventEmit,
    payloadEventKey,
    message = undefined,
    data = undefined,
  }) {
    const resp = new EmitResponse({
      event: payloadEventKey,
      success: true,
      message,
      data,
    });

    return [eventEmit, resp];
  }

  /**
   * Creates an error EmitResponse.
   *
   * @param {{eventEmit: string; payloadEventKey: string; message: string; error: any}} response
   *
   * @returns {EmitResponse}
   */
  static Error({
    eventEmit,
    payloadEventKey,
    message = undefined,
    error = null,
  }) {
    const resp = new EmitResponse({
      payloadEventKey,
      success: false,
      message,
      data: null,
      error,
    });

    return [eventEmit, resp];
  }
}
