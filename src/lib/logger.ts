
import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logFile: string = path.join(process.cwd(), 'app.log');
  private inMemoryLogs: LogEntry[] = [];
  private consoleEnabled: boolean = true;
  private fileEnabled: boolean = true;

  private constructor() {
    // Ensure log directory exists
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

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

  private writeToFile(message: string): void {
    if (!this.fileEnabled) return;
    
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
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
    
    // Store in memory for access by client
    this.inMemoryLogs.push(logEntry);
    if (this.inMemoryLogs.length > 1000) {
      this.inMemoryLogs.shift(); // Keep the last 1000 logs
    }
    
    // Log to console
    this.logToConsole(level, formattedMessage);
    
    // Write to file
    this.writeToFile(formattedMessage);
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

  public setFileLogging(enabled: boolean): void {
    this.fileEnabled = enabled;
  }
}

export const logger = Logger.getInstance();

// Create a browser-compatible logger for client-side code
class BrowserLogger {
  private static instance: BrowserLogger;
  private inMemoryLogs: LogEntry[] = [];
  private consoleEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): BrowserLogger {
    if (!BrowserLogger.instance) {
      BrowserLogger.instance = new BrowserLogger();
    }
    return BrowserLogger.instance;
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

// Export the appropriate logger based on environment
export const clientLogger = typeof window !== 'undefined' 
  ? BrowserLogger.getInstance() 
  : logger;
