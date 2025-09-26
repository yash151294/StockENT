// Simple logger utility for frontend
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  private log(level: string, message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(level, message, ...args);
      console.log(formattedMessage);
    }

    // In production, you might want to send logs to a service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., Sentry, LogRocket, etc.)
      this.sendToLoggingService(level, message, args);
    }
  }

  private sendToLoggingService(level: string, message: string, args: any[]): void {
    // Implement logging service integration here
    // For example, send to Sentry, LogRocket, or your own logging endpoint
  }

  error(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.ERROR, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.WARN, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.INFO, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.DEBUG, message, ...args);
  }
}

export const logger = new Logger();
