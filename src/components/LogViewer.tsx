
import React, { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  useEffect(() => {
    // Update logs every second
    const interval = setInterval(() => {
      const currentLogs = clientLogger.getLogs();
      setLogs(currentLogs);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = selectedLevel === 'all'
    ? logs
    : logs.filter(log => log.level === selectedLevel);

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'info': return 'bg-blue-500';
      case 'warn': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'debug': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Application Logs</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant={selectedLevel === 'all' ? 'default' : 'outline'} 
            onClick={() => setSelectedLevel('all')}
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={selectedLevel === 'info' ? 'default' : 'outline'} 
            onClick={() => setSelectedLevel('info')}
            size="sm"
          >
            Info
          </Button>
          <Button 
            variant={selectedLevel === 'warn' ? 'default' : 'outline'} 
            onClick={() => setSelectedLevel('warn')}
            size="sm"
          >
            Warn
          </Button>
          <Button 
            variant={selectedLevel === 'error' ? 'default' : 'outline'} 
            onClick={() => setSelectedLevel('error')}
            size="sm"
          >
            Error
          </Button>
          <Button 
            variant={selectedLevel === 'debug' ? 'default' : 'outline'} 
            onClick={() => setSelectedLevel('debug')}
            size="sm"
          >
            Debug
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded border p-4">
          {filteredLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No logs available
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div key={index} className="rounded border p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">{log.message}</p>
                    {log.context && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          Context details
                        </summary>
                        <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LogViewer;
