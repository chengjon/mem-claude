/**
 * Unified Error Handling System for mem-claude
 * 
 * Provides standardized error types, handling patterns, and recovery strategies
 * to ensure consistent error management across the application.
 */

import { logger } from './logger.js';
import { Component } from './logger.js';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ErrorAction {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  ABORT = 'ABORT',
  LOG_ONLY = 'LOG_ONLY',
  USER_NOTIFICATION = 'USER_NOTIFICATION'
}

export interface StandardError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  action: ErrorAction;
  context?: Record<string, any>;
  originalError?: Error;
  isRecoverable: boolean;
  timestamp: Date;
}

/**
 * Create a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  options: {
    severity?: ErrorSeverity;
    action?: ErrorAction;
    context?: Record<string, any>;
    originalError?: Error;
    cause?: Error;
  } = {}
): StandardError {
  const {
    severity = ErrorSeverity.MEDIUM,
    action = ErrorAction.LOG_ONLY,
    context = {},
    originalError,
    cause
  } = options;

  const error = new Error(message) as StandardError;
  error.type = type;
  error.severity = severity;
  error.action = action;
  error.context = context;
  error.originalError = originalError;
  error.cause = cause;
  error.isRecoverable = [ErrorAction.RETRY, ErrorAction.FALLBACK].includes(action);
  error.timestamp = new Date();

  // Preserve stack trace
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createError);
  }

  return error;
}

/**
 * Error Handler class for centralized error management
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with standardized logging and recovery
   */
  handle(
    error: Error | StandardError,
    component: Component,
    context?: Record<string, any>
  ): StandardError {
    const standardError = this.standardizeError(error, context);

    // Log the error
    this.logError(standardError, component);

    // Execute recovery strategy
    this.executeRecovery(standardError, component);

    return standardError;
  }

  /**
   * Convert any error to standardized format
   */
  private standardizeError(error: Error | StandardError, context?: Record<string, any>): StandardError {
    // If already standardized, return as-is
    if ('type' in error && 'severity' in error) {
      return error as StandardError;
    }

    // Infer error type from error message and stack
    const type = this.inferErrorType(error);

    // Determine severity based on error type and context
    const severity = this.determineSeverity(error, type, context);

    // Determine recommended action
    const action = this.determineAction(error, type);

    const standardError = createError(type, error.message, {
      context,
      originalError: error,
      severity,
      action
    });

    // Copy stack trace
    if (error.stack) {
      standardError.stack = error.stack;
    }

    return standardError;
  }

  /**
   * Infer error type based on error characteristics
   */
  private inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Database errors
    if (message.includes('database') || message.includes('sqlite') || message.includes('sql')) {
      return ErrorType.DATABASE_ERROR;
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('http') || message.includes('timeout')) {
      return ErrorType.NETWORK_ERROR;
    }

    // File system errors
    if (message.includes('enoent') || message.includes('permission') || message.includes('file') || message.includes('directory')) {
      return ErrorType.FILE_SYSTEM_ERROR;
    }

    // Parsing errors
    if (message.includes('parse') || message.includes('json') || message.includes('syntax') || message.includes('invalid')) {
      return ErrorType.PARSING_ERROR;
    }

    // Configuration errors
    if (message.includes('config') || message.includes('setting') || message.includes('environment')) {
      return ErrorType.CONFIGURATION_ERROR;
    }

    // Authentication/Authorization
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) {
      return message.includes('permission') ? ErrorType.AUTHORIZATION_ERROR : ErrorType.AUTHENTICATION_ERROR;
    }

    // External service errors
    if (message.includes('api') || message.includes('service') || message.includes('external')) {
      return ErrorType.EXTERNAL_SERVICE_ERROR;
    }

    // Validation errors
    if (message.includes('validate') || message.includes('invalid') || message.includes('required')) {
      return ErrorType.VALIDATION_ERROR;
    }

    // Default to system error
    return ErrorType.SYSTEM_ERROR;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, type: ErrorType, context?: Record<string, any>): ErrorSeverity {
    // Critical errors
    if (type === ErrorType.DATABASE_ERROR || type === ErrorType.SYSTEM_ERROR) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity for authentication/authorization
    if (type === ErrorType.AUTHENTICATION_ERROR || type === ErrorType.AUTHORIZATION_ERROR) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity for most other errors
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Determine recommended action
   */
  private determineAction(error: Error, type: ErrorType): ErrorAction {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return ErrorAction.RETRY;
      case ErrorType.DATABASE_ERROR:
        return ErrorAction.FALLBACK;
      case ErrorType.FILE_SYSTEM_ERROR:
        return ErrorAction.FALLBACK;
      case ErrorType.PARSING_ERROR:
        return ErrorAction.LOG_ONLY;
      case ErrorType.CONFIGURATION_ERROR:
        return ErrorAction.ABORT;
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.AUTHORIZATION_ERROR:
        return ErrorAction.USER_NOTIFICATION;
      default:
        return ErrorAction.LOG_ONLY;
    }
  }

  /**
   * Log error with standardized format
   */
  private logError(error: StandardError, component: Component): void {
    const logData = {
      errorType: error.type,
      severity: error.severity,
      action: error.action,
      context: error.context,
      timestamp: error.timestamp,
      isRecoverable: error.isRecoverable
    };

    if (error.originalError) {
      logData.originalError = error.originalError.message;
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(component, `CRITICAL: ${error.message}`, error.context, logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error(component, `HIGH: ${error.message}`, error.context, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(component, `MEDIUM: ${error.message}`, error.context, logData);
        break;
      case ErrorSeverity.LOW:
        logger.info(component, `LOW: ${error.message}`, error.context, logData);
        break;
    }
  }

  /**
   * Execute recovery strategy
   */
  private executeRecovery(error: StandardError, component: Component): void {
    switch (error.action) {
      case ErrorAction.RETRY:
        logger.info(component, `Retrying operation after error: ${error.message}`, error.context);
        // In a real implementation, this would trigger a retry mechanism
        break;

      case ErrorAction.FALLBACK:
        logger.info(component, `Using fallback after error: ${error.message}`, error.context);
        // In a real implementation, this would trigger a fallback mechanism
        break;

      case ErrorAction.ABORT:
        logger.error(component, `Aborting operation due to critical error: ${error.message}`, error.context);
        // In a real implementation, this would trigger application shutdown or graceful termination
        break;

      case ErrorAction.USER_NOTIFICATION:
        logger.info(component, `User notification required: ${error.message}`, error.context);
        // In a real implementation, this would trigger user notification
        break;

      case ErrorAction.LOG_ONLY:
      default:
        // Just log, no additional action needed
        break;
    }
  }

  /**
   * Wrap async operations with standardized error handling
   */
  async wrapAsync<T>(
    operation: () => Promise<T>,
    component: Component,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error, component, { ...context, operationName });
      return null; // Return null for failed operations (caller can check null return)
    }
  }

  /**
   * Wrap sync operations with standardized error handling
   */
  wrapSync<T>(
    operation: () => T,
    component: Component,
    operationName: string,
    context?: Record<string, any>
  ): T | null {
    try {
      return operation();
    } catch (error) {
      this.handle(error, component, { ...context, operationName });
      return null; // Return null for failed operations (caller can check null return)
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

/**
 * Convenience function for quick error handling
 */
export function handleError(
  error: Error | StandardError,
  component: Component,
  context?: Record<string, any>
): StandardError {
  return errorHandler.handle(error, component, context);
}

/**
 * Decorator for automatic error handling on class methods
 */
export function handleErrors(component: Component) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        errorHandler.handle(error, component, { method: propertyName, args });
        throw error; // Re-throw to maintain original behavior
      }
    };
  };
}
