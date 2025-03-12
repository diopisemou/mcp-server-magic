
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LandingPageAlt() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startVoiceRecording();
    } else {
      stopVoiceRecording();
    }
    setIsRecording(!isRecording);
  };

  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setVoiceInput(transcript);
        setInputValue(transcript);
      };
      
      recognition.start();
      
      // Store recognition instance to stop it later
      window.recognition = recognition;
    } else {
      alert('Voice recognition is not supported in your browser.');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (window.recognition) {
      window.recognition.stop();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-medium text-lg">MCP Server Generator</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/docs')}>Docs</Button>
            <Button variant="ghost" onClick={() => navigate('/about')}>About</Button>
            <Button onClick={handleGetStarted}>Get Started</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Create MCP Servers from Your API Definitions
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Upload your OpenAPI, Swagger, RAML or API Blueprint definitions and generate 
              production-ready MCP servers that AI models can interact with.
            </p>
            
            <div className="mb-8 flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2 w-full max-w-lg">
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  BETA
                </Badge>
                <Input 
                  placeholder="Describe the MCP server you want to generate..." 
                  className="flex-1"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleRecording}
                  className={isRecording ? "bg-red-100 text-red-600 border-red-300" : ""}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleGetStarted} className="px-8" disabled={!inputValue.trim()}>
                Generate MCP Server <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-center space-x-4 mb-10">
              <Button variant="outline" onClick={handleGetStarted}>Upload API Definition</Button>
              <Button variant="outline" onClick={() => navigate('/templates')}>Browse Templates</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                    <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Define Once</h3>
                <p className="text-muted-foreground">Upload your existing API definitions or create new ones with our intuitive editor.</p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 11a9 9 0 0 1 9 9"></path>
                    <path d="M4 4a16 16 0 0 1 16 16"></path>
                    <circle cx="5" cy="19" r="2"></circle>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Deploy Anywhere</h3>
                <p className="text-muted-foreground">Generate MCP servers that can be deployed to any cloud provider or your own infrastructure.</p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <path d="M3.29 7 12 12l8.71-5"></path>
                    <path d="M12 22V12"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">AI-Ready</h3>
                <p className="text-muted-foreground">Your MCP servers are instantly compatible with LLMs and other AI models.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-primary mb-6">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-medium mb-3">Upload API Definition</h3>
                <p className="text-muted-foreground">Upload your OpenAPI, Swagger, RAML or API Blueprint definition.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-primary mb-6">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-medium mb-3">Configure Server</h3>
                <p className="text-muted-foreground">Configure your MCP server settings and customize endpoints.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-primary mb-6">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-medium mb-3">Generate & Deploy</h3>
                <p className="text-muted-foreground">Generate your MCP server code and deploy it to your infrastructure.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-secondary/50">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="font-medium text-lg">MCP Server Generator</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                Transform your API definitions into production-ready MCP servers that AI models can interact with.
                Streamline AI integration and focus on your core business.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 sm:mb-0">© {new Date().getFullYear()} MCP Server Generator. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
