
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  icon: JSX.Element;
  title: string;
  description: string;
}

const Features = () => {
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const featureItems: FeatureItem[] = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" />
          <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" />
        </svg>
      ),
      title: 'Multiple API Definition Formats',
      description: 'Support for OpenAPI 2.0, OpenAPI 3.0, RAML, and API Blueprint formats, ensuring compatibility with your existing API documentation.'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8Z" />
          <path d="M17 3h-1a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1Z" />
          <path d="M8 14h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h1Z" />
          <path d="M17 14h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h1Z" />
        </svg>
      ),
      title: 'Intelligent Endpoint Mapping',
      description: 'Advanced mapping of API endpoints to MCP capabilities based on HTTP methods, with automatic resource and tool identification.'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
          <path d="M17 7.82v6.36" />
          <path d="M12 5.5v10" />
          <path d="M7 9.59v4.32" />
          <rect width="18" height="12" x="3" y="5.5" rx="2" />
          <path d="M3 5.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />
          <path d="M3 17.5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2" />
        </svg>
      ),
      title: 'Customizable Code Generation',
      description: 'Generate server code in Python or TypeScript with clean, modular structure and comprehensive error handling mechanisms.'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v6l2.5 2.5" />
        </svg>
      ),
      title: 'One-Click Deployment',
      description: 'Seamless deployment to major cloud platforms including AWS, GCP, and Azure, with containerization for consistent environments.'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      title: 'Secure Authentication',
      description: 'Support for API keys, basic auth, and Bearer tokens with secure credential storage and management for your server.'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
      title: 'Comprehensive Monitoring',
      description: 'Real-time logs, performance metrics, and customizable alerts to ensure your MCP server is running optimally at all times.'
    }
  ];
  
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const index = sectionRefs.current.findIndex(ref => ref === entry.target);
        if (index !== -1) {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(index));
          }
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });
    
    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    
    return () => {
      sectionRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section id="features" className="py-24 bg-secondary/50 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-300/10 blur-3xl"></div>
      </div>
      
      <div className="content-container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-4 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
            Everything You Need to Build MCP Servers
          </h2>
          <p className="text-lg text-muted-foreground text-balance">
            Our platform provides all the tools and functionality required to create, deploy, and manage AI-ready MCP servers.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((feature, index) => (
            <div 
              key={index}
              ref={el => sectionRefs.current[index] = el}
              className={cn(
                "bg-white rounded-xl p-6 shadow-sm border border-border transition-all duration-700 ease-out fade-in-section",
                visibleSections.has(index) ? "is-visible" : ""
              )}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
