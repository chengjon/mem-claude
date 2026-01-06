type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface UILogger {
  debug: (component: string, message: string, ...args: unknown[]) => void;
  info: (component: string, message: string, ...args: unknown[]) => void;
  warn: (component: string, message: string, ...args: unknown[]) => void;
  error: (component: string, message: string, ...args: unknown[]) => void;
}

function formatMessage(component: string, message: string): string {
  return `[${component}] ${message}`;
}

function isDebugEnabled(): boolean {
  return typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'development';
}

export const uiLogger: UILogger = {
  debug: (component: string, message: string, ...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.debug(formatMessage(component, message), ...args);
    }
  },
  info: (component: string, message: string, ...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.log(formatMessage(component, message), ...args);
    }
  },
  warn: (component: string, message: string, ...args: unknown[]) => {
    console.warn(formatMessage(component, message), ...args);
  },
  error: (component: string, message: string, ...args: unknown[]) => {
    console.error(formatMessage(component, message), ...args);
  }
};

export function createLogger(component: string): Omit<UILogger, 'debug'> {
  return {
    info: (message: string, ...args: unknown[]) => uiLogger.info(component, message, ...args),
    warn: (message: string, ...args: unknown[]) => uiLogger.warn(component, message, ...args),
    error: (message: string, ...args: unknown[]) => uiLogger.error(component, message, ...args)
  };
}
