
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6",
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className={cn(
              "font-medium text-lg transition-colors",
              isScrolled ? "text-foreground" : "text-foreground"
            )}>
              MCP Server Generator
            </span>
          </a>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          {['Features', 'Documentation', 'Pricing'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isScrolled ? "text-foreground/80" : "text-foreground/90"
              )}
            >
              {item}
            </a>
          ))}
          <Button variant="default" className="rounded-full px-6">
            Get Started
          </Button>
        </nav>
        
        <button 
          className="md:hidden flex items-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </>
            )}
          </svg>
        </button>
      </div>
      
      {/* Mobile menu */}
      <div className={cn(
        "md:hidden absolute left-0 right-0 transition-all duration-300 ease-in-out overflow-hidden bg-white shadow-md",
        mobileMenuOpen ? "max-h-60 py-4" : "max-h-0"
      )}>
        <div className="px-6 flex flex-col space-y-4">
          {['Features', 'Documentation', 'Pricing'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-foreground/80 hover:text-primary text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <Button variant="default" className="rounded-full">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
