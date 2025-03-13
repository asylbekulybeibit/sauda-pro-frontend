import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

export class ApiErrorHandler {
  static handle(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      const response = error.response;
      if (response?.data) {
        return {
          message: response.data.message || 'Unknown error occurred',
          code: response.data.code || 'UNKNOWN_ERROR',
          status: response.status,
          details: response.data.details,
        };
      }
      return {
        message: error.message,
        code: 'NETWORK_ERROR',
        status: 0,
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        status: 500,
      };
    }

    return {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
    };
  }

  static isNetworkError(error: ApiError): boolean {
    return error.code === 'NETWORK_ERROR';
  }

  static isAuthenticationError(error: ApiError): boolean {
    return error.status === 401;
  }

  static isValidationError(error: ApiError): boolean {
    return error.status === 400;
  }

  static isForbiddenError(error: ApiError): boolean {
    return error.status === 403;
  }

  static isNotFoundError(error: ApiError): boolean {
    return error.status === 404;
  }
}
