
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerFile, ZipPackage } from '@/types';
import { Download, ChevronDown, ChevronUp, Copy, Check, FileCode, FileText, FileCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ServerFilesProps {
  files: ServerFile[];
  projectName: string;
}

export default function ServerFiles({ files, projectName }: ServerFilesProps) {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const getFileIcon = (file: ServerFile) => {
    switch (file.type) {
      case 'code':
        return <FileCode className="w-4 h-4 text-blue-500" />;
      case 'config':
        return <FileCog className="w-4 h-4 text-amber-500" />;
      case 'documentation':
        return <FileText className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  
  const handleCopyCode = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(fileName);
      toast.success(`Copied ${fileName} to clipboard`);
      
      setTimeout(() => {
        setCopiedFile(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };
  
  const downloadAllFiles = async () => {
    try {
      const zip = new JSZip();
      const zipPackageName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-mcp-server`;
      
      // Group files by their path
      const folderMap = new Map<string, JSZip>();
      
      // Create root folder with project name
      const rootFolder = zip.folder(zipPackageName);
      if (!rootFolder) {
        throw new Error('Failed to create root folder');
      }
      
      // Add files to ZIP
      files.forEach(file => {
        const filePath = file.path === '/' ? '' : file.path;
        const fullPath = `${filePath}${file.name}`;
        
        if (filePath && !folderMap.has(filePath)) {
          const folder = rootFolder.folder(filePath.substring(1)); // Remove leading slash
          if (folder) {
            folderMap.set(filePath, folder);
          }
        }
        
        const targetFolder = filePath ? folderMap.get(filePath) || rootFolder : rootFolder;
        targetFolder.file(file.name, file.content);
      });
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download ZIP file
      saveAs(zipBlob, `${zipPackageName}.zip`);
      
      toast.success('Server files downloaded successfully');
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      toast.error('Failed to download server files');
    }
  };
  
  const filterFilesByType = (type: string) => {
    if (type === 'all') {
      return files;
    }
    return files.filter(file => file.type === type);
  };
  
  const displayedFiles = filterFilesByType(activeTab);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Server Files</CardTitle>
            <CardDescription>Generated server files ready for download</CardDescription>
          </div>
          <Button onClick={downloadAllFiles} className="ml-auto">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          {displayedFiles.map((file, index) => (
            <AccordionItem key={index} value={`file-${index}`}>
              <AccordionTrigger className="hover:bg-muted/50 px-4 py-2 rounded-md">
                <div className="flex items-center">
                  {getFileIcon(file)}
                  <span className="ml-2 font-medium">{file.path}{file.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border bg-muted/30 rounded-md mt-2 overflow-hidden">
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 bg-background/80 backdrop-blur-sm"
                      onClick={() => handleCopyCode(file.content, file.name)}
                    >
                      {copiedFile === file.name ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="ml-1">{copiedFile === file.name ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm" style={{ maxHeight: '400px' }}>
                    <code>{file.content}</code>
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
