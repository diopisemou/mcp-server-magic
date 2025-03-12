import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Log {
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp?: string;
}

interface LogViewerProps {
  logs: Log[];
}

export const LogViewer = ({ logs }: LogViewerProps) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-gray-50 rounded-md p-8 text-center text-gray-500">
        No logs available. Generate or deploy your server to see logs.
      </div>
    );
  }

  const getIconForLogType = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTimeString = (timestamp?: string) => {
    if (timestamp) return new Date(timestamp).toLocaleTimeString();
    return new Date().toLocaleTimeString();
  };

  return (
    <div className="bg-gray-50 rounded-md p-4 max-h-[500px] overflow-y-auto">
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`flex items-start p-2 rounded-md ${
              log.type === 'error' ? 'bg-red-50' : 
              log.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
            }`}
          >
            <div className="mr-3 mt-0.5">
              {getIconForLogType(log.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm">{log.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {getTimeString(log.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogViewer;