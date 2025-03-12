
import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import ApiUploader from '@/components/ApiUploader';
import EndpointMapper from '@/components/EndpointMapper';
import Footer from '@/components/Footer';
import { ApiDefinition, Endpoint } from '@/types';

const Index = () => {
  const [apiDefinition, setApiDefinition] = useState<ApiDefinition | null>(null);
  const [mappedEndpoints, setMappedEndpoints] = useState<Endpoint[] | null>(null);
  
  const handleApiUpload = (definition: ApiDefinition) => {
    setApiDefinition(definition);
    // Scroll to the mapping section with a smooth animation
    const element = document.getElementById('mapping-section');
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };
  
  const handleEndpointMapping = (endpoints: Endpoint[]) => {
    setMappedEndpoints(endpoints);
    // In a real app, this would navigate to the server configuration page
    console.log('Mapped endpoints:', endpoints);
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        <Hero />
        <Features />
        <ApiUploader onUploadComplete={handleApiUpload} />
        
        {apiDefinition && (
          <div id="mapping-section" className="scroll-mt-20">
            <EndpointMapper 
              apiDefinition={apiDefinition} 
              onContinue={handleEndpointMapping} 
            />
          </div>
        )}
        
        {/* Pricing section would go here */}
        <section id="pricing" className="py-24 relative overflow-hidden">
          <div className="content-container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-block px-4 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Pricing
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
                Choose the Plan That's Right for You
              </h2>
              <p className="text-lg text-muted-foreground text-balance">
                Transparent pricing with no hidden fees. All plans include core features.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { 
                  name: 'Starter', 
                  price: '$29', 
                  description: 'Perfect for individual developers and small projects.',
                  features: [
                    '3 MCP Servers',
                    'Basic monitoring',
                    'Community support',
                    'Standard hosting'
                  ],
                  highlight: false
                },
                { 
                  name: 'Pro', 
                  price: '$79', 
                  description: 'Ideal for growing teams with multiple projects.',
                  features: [
                    '10 MCP Servers',
                    'Advanced monitoring',
                    'Priority support',
                    'Enhanced hosting',
                    'Custom deployment'
                  ],
                  highlight: true
                },
                { 
                  name: 'Enterprise', 
                  price: 'Custom', 
                  description: 'For organizations with advanced requirements.',
                  features: [
                    'Unlimited MCP Servers',
                    'Premium monitoring',
                    'Dedicated support',
                    'Premium hosting',
                    'Custom deployment',
                    'SLA guarantees'
                  ],
                  highlight: false
                }
              ].map((plan, index) => (
                <div 
                  key={index} 
                  className={`rounded-xl overflow-hidden transition-transform hover:-translate-y-1 ${
                    plan.highlight 
                      ? 'bg-primary text-primary-foreground shadow-xl border-2 border-primary' 
                      : 'bg-white text-foreground shadow-lg border border-border'
                  }`}
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-sm opacity-80">/month</span>}
                    </div>
                    <p className={`text-sm mb-6 ${plan.highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                    <Button 
                      className={`w-full rounded-lg ${
                        plan.highlight ? 'bg-white text-primary hover:bg-white/90' : ''
                      }`}
                      variant={plan.highlight ? 'outline' : 'default'}
                    >
                      Get Started
                    </Button>
                  </div>
                  
                  <div className={`px-6 pt-4 pb-6 ${plan.highlight ? 'border-t border-primary-foreground/20' : 'border-t border-border'}`}>
                    <p className={`text-sm font-medium mb-3 ${plan.highlight ? 'text-primary-foreground' : ''}`}>
                      What's included:
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-sm flex items-start">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className={`mr-2 mt-0.5 ${plan.highlight ? 'text-primary-foreground' : 'text-primary'}`}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
