
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink } from "lucide-react";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>MCP Server Generator Demo</DialogTitle>
          <DialogDescription>
            Learn how to create and deploy Model Context Protocol servers for your APIs
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="video">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="video">Video Tutorial</TabsTrigger>
            <TabsTrigger value="guide">Step-by-Step Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="video" className="space-y-4">
            <div className="aspect-video relative rounded-lg overflow-hidden border">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                title="MCP Server Generator Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="text-sm text-muted-foreground">
              This comprehensive video tutorial walks you through the entire process of creating and deploying MCP servers using our platform.
            </p>
          </TabsContent>
          
          <TabsContent value="guide" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5 flex-shrink-0">1</div>
                <div>
                  <h3 className="font-medium text-lg">Import your API definition</h3>
                  <p className="text-muted-foreground">
                    Upload your OpenAPI, RAML, or API Blueprint definition. Our platform supports multiple formats for maximum compatibility.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5 flex-shrink-0">2</div>
                <div>
                  <h3 className="font-medium text-lg">Map endpoints to MCP capabilities</h3>
                  <p className="text-muted-foreground">
                    Define which API endpoints will be exposed as MCP resources or tools. Customize parameters and responses as needed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5 flex-shrink-0">3</div>
                <div>
                  <h3 className="font-medium text-lg">Configure your server</h3>
                  <p className="text-muted-foreground">
                    Set up authentication, select your preferred programming language, and choose hosting options.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5 flex-shrink-0">4</div>
                <div>
                  <h3 className="font-medium text-lg">Generate and deploy</h3>
                  <p className="text-muted-foreground">
                    With one click, generate your server code and deploy it to your selected hosting provider.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5 flex-shrink-0">5</div>
                <div>
                  <h3 className="font-medium text-lg">Monitor and maintain</h3>
                  <p className="text-muted-foreground">
                    Use our dashboard to monitor server performance, update configurations, and manage your deployments.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Pro Tip
              </h4>
              <p className="text-sm">
                For best results, ensure your API definition is complete and up-to-date. The more detailed your API documentation, the better your MCP server will be.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="gap-2" onClick={() => window.open("https://github.com/anthropics/anthropic-tools", "_blank")}>
            Learn More <ExternalLink className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DemoModal;
