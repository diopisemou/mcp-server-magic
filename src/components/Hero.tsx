
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ExternalLink, PlayCircle } from "lucide-react";
import DemoModal from "./DemoModal";

export default function Hero() {
  const navigate = useNavigate();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-small-black/[0.2] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background -z-10" />
      
      <div className="content-container">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Model Context Protocol
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 lg:mb-8 text-balance">
            Connect AI to Your APIs with <br /> MCP Server Generator
          </h1>
          <p className="text-lg text-muted-foreground mb-12 md:text-xl max-w-3xl mx-auto text-balance">
            Create and deploy MCP servers from your API definitions in minutes, not days. Enable AI assistants to interact with your data and services effortlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/auth")} size="lg" className="rounded-full px-8">
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 gap-2"
              onClick={() => setIsDemoOpen(true)}
            >
              <PlayCircle className="h-5 w-5" />
              View Demo
            </Button>
          </div>
          
          <div className="mt-8 text-sm text-muted-foreground">
            <a 
              href="https://github.com/anthropics/anthropic-tools"
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-foreground transition-colors"
            >
              Learn about the Model Context Protocol
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
      
      <DemoModal open={isDemoOpen} onOpenChange={setIsDemoOpen} />
    </section>
  );
}
