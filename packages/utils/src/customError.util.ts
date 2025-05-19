class CustomError extends Error {
  statusCode: number;
  data: null;
  message: string;
  success: boolean;
  errors: Array<Error | string | Record<string, any>>;
  stack?: string | undefined;
  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { CustomError };
