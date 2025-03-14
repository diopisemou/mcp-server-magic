
import React, { useState } from 'react';
import { ServerFile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ServerFilesProps {
  files: ServerFile[];
}

const ServerFiles: React.FC<ServerFilesProps> = ({ files }) => {
  const [activeTab, setActiveTab] = useState('code');
  
  const filteredFiles = files.filter(file => file.type === activeTab);
  
  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };
  
  const handleDownloadFile = (file: ServerFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="code" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="code">
            Code Files
          </TabsTrigger>
          <TabsTrigger value="config">
            Config Files
          </TabsTrigger>
          <TabsTrigger value="documentation">
            Documentation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {filteredFiles.length > 0 ? (
            <div className="grid gap-4">
              {filteredFiles.map((file, index) => (
                <Card key={index}>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm flex justify-between items-center">
                      <span>{file.path}</span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleCopyContent(file.content)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                      <code>{file.content}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No {activeTab} files available.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServerFiles;
