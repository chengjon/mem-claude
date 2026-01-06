interface LogMessage {
  (component: string, message: string, ...args: unknown[]): void;
}

interface LogError {
  (component: string, message: string, error?: unknown): void;
}

interface HookLogger {
  log: LogMessage;
  error: LogError;
  warn: LogMessage;
  info: LogMessage;
}

function formatMessage(component: string, message: string): string {
  return `[${component}] ${message}`;
}

function isDevelopment(): boolean {
  return typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'development';
}

export const hookLogger: HookLogger = {
  log: (component: string, message: string, ...args: unknown[]) => {
    if (isDevelopment()) {
      console.log(formatMessage(component, message), ...args);
    }
  },
  error: (component: string, message: string, error?: unknown) => {
    console.error(formatMessage(component, message), error || '');
  },
  warn: (component: string, message: string, ...args: unknown[]) => {
    console.warn(formatMessage(component, message), ...args);
  },
  info: (component: string, message: string, ...args: unknown[]) => {
    if (isDevelopment()) {
      console.info(formatMessage(component, message), ...args);
    }
  }
};

export function logError(component: string, message: string, error?: unknown): void {
  hookLogger.error(component, message, error);
}

export function logWarn(component: string, message: string, ...args: unknown[]): void {
  hookLogger.warn(component, message, ...args);
}

export function logInfo(component: string, message: string, ...args: unknown[]): void {
  hookLogger.info(component, message, ...args);
}
