
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
import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Log {
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'debug';
  message: string;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      // This would be replaced with a real API call
      // Mocking logs for demonstration
      const mockLogs: Log[] = [
        { timestamp: new Date().toISOString(), level: 'info', message: 'Server generation started' },
        { timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', message: 'Parsing API definition' },
        { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'info', message: 'Generating server code' },
        { timestamp: new Date(Date.now() - 15000).toISOString(), level: 'warning', message: 'Schema validation warning: missing description for endpoint /users' },
        { timestamp: new Date(Date.now() - 20000).toISOString(), level: 'info', message: 'Generating documentation' },
        { timestamp: new Date(Date.now() - 25000).toISOString(), level: 'info', message: 'Preparing deployment package' },
        { timestamp: new Date(Date.now() - 30000).toISOString(), level: 'info', message: 'Server generation completed' },
      ];
      
      setLogs(mockLogs);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'debug':
        return 'text-blue-500';
      default:
        return 'text-green-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <div className="flex items-center justify-between p-2 bg-muted">
        <div className="flex items-center">
          <Terminal className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Server Generation Logs</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={fetchLogs}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="bg-black text-white p-4 font-mono text-sm h-[400px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No logs available
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-400">[{formatTimestamp(log.timestamp)}]</span>{' '}
              <span className={getLogColor(log.level)}>[{log.level.toUpperCase()}]</span>{' '}
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogViewer;
