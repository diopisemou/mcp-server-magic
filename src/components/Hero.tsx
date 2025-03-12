
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Hero = () => {
  return (
    <section className="pt-28 pb-24 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-300/20 blur-3xl animate-pulse-subtle"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-400/10 blur-3xl animate-pulse-subtle"></div>
      </div>
      
      <div className="content-container">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
            Introducing MCP Server Generator
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="block text-balance">Generate AI-Ready Servers</span>
            <span className="block text-balance mt-2">in <span className="text-primary">Minutes</span>, Not Months</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance leading-relaxed max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Transform your API definitions into production-ready MCP servers that AI models can interact with. Streamline AI integration and focus on your core business.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" className="rounded-full px-8 py-6 text-base font-medium">
              Start Building
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-base font-medium">
              View Demo
            </Button>
          </div>
        </div>
        
        <div className="mt-16 md:mt-24 max-w-5xl mx-auto relative animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-black/5">
            <div className="absolute top-0 left-0 right-0 h-8 bg-[#f6f6f6] flex items-center px-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
            </div>
            <div className="pt-8 bg-[#f6f6f6]">
              <div className="bg-white shadow-sm rounded-t-lg p-6 h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="32" 
                      height="32" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="text-primary"
                    >
                      <path d="M12 3v14" />
                      <path d="M5 10l7 7 7-7" />
                      <path d="M5 21h14" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload Your API Definition</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Drag and drop your OpenAPI, RAML, or API Blueprint files, or provide a URL
                  </p>
                  <Button className="rounded-full">Browse Files</Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -right-12 -top-12 w-24 h-24 rounded-lg rotate-12 bg-blue-500/10 backdrop-blur-sm border border-white/20 shadow-xl animate-float"></div>
          <div className="absolute -left-8 top-1/3 w-16 h-16 rounded-lg -rotate-12 bg-purple-500/10 backdrop-blur-sm border border-white/20 shadow-xl animate-float" style={{ animationDelay: "1.5s" }}></div>
          <div className="absolute right-20 -bottom-10 w-20 h-20 rounded-lg rotate-45 bg-pink-500/10 backdrop-blur-sm border border-white/20 shadow-xl animate-float" style={{ animationDelay: "1s" }}></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
