type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

/**
 * Browser-compatible logger class
 */
class Logger {
  private static instance: Logger;
  private inMemoryLogs: LogEntry[] = [];
  private consoleEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context } = entry;
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context) {
      logMessage += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    return logMessage;
  }

  private logToConsole(level: LogLevel, message: string): void {
    if (!this.consoleEnabled) return;

    switch (level) {
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
      case 'debug':
        console.debug(message);
        break;
    }
  }

  public log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context
    };

    const formattedMessage = this.formatLogEntry(logEntry);

    // Store in memory
    this.inMemoryLogs.push(logEntry);
    if (this.inMemoryLogs.length > 1000) {
      this.inMemoryLogs.shift(); // Keep the last 1000 logs
    }

    // Log to console
    this.logToConsole(level, formattedMessage);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  public getLogs(): LogEntry[] {
    return [...this.inMemoryLogs];
  }

  public clearLogs(): void {
    this.inMemoryLogs = [];
  }

  public setConsoleLogging(enabled: boolean): void {
    this.consoleEnabled = enabled;
  }
}

// Export the singleton logger instance
export const clientLogger = Logger.getInstance();