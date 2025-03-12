
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logger';

interface LogContextType {
  logError: (message: string, context?: Record<string, any>) => void;
  logWarning: (message: string, context?: Record<string, any>) => void;
  logInfo: (message: string, context?: Record<string, any>) => void;
  logDebug: (message: string, context?: Record<string, any>) => void;
}

const defaultLogContext: LogContextType = {
  logError: () => {},
  logWarning: () => {},
  logInfo: () => {},
  logDebug: () => {},
};

const LogContext = createContext<LogContextType>(defaultLogContext);

export const useLogging = () => useContext(LogContext);

interface LogProviderProps {
  children: ReactNode;
}

export const LogProvider: React.FC<LogProviderProps> = ({ children }) => {
  // Set up global error handler
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const { message, filename, lineno, colno, error } = event;
      clientLogger.error('Uncaught error', {
        message,
        source: filename,
        line: lineno,
        column: colno,
        stack: error?.stack,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      clientLogger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? {
          message: reason.message,
          stack: reason.stack,
        } : reason,
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const logError = (message: string, context?: Record<string, any>) => {
    clientLogger.error(message, context);
  };

  const logWarning = (message: string, context?: Record<string, any>) => {
    clientLogger.warn(message, context);
  };

  const logInfo = (message: string, context?: Record<string, any>) => {
    clientLogger.info(message, context);
  };

  const logDebug = (message: string, context?: Record<string, any>) => {
    clientLogger.debug(message, context);
  };

  return (
    <LogContext.Provider
      value={{
        logError,
        logWarning,
        logInfo,
        logDebug,
      }}
    >
      {children}
    </LogContext.Provider>
  );
};
