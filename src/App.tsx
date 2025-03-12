import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import ImportApi from "./pages/ImportApi";
import ConfigureServer from "./pages/ConfigureServer";
import GenerateServer from "./pages/GenerateServer";
import { AuthProvider } from "./contexts/AuthContext";
import { LogProvider } from "@/contexts/LogContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import LandingPageAlt from './pages/LandingPageAlt';
import { getUserVariant, trackPageView, Variant } from './utils/abTestingService';


const queryClient = new QueryClient();

// Component to handle A/B testing for the landing page
function LandingPageSelector() {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    // Get the user's variant
    const userVariant = getUserVariant();
    setVariant(userVariant);

    // Track the page view
    trackPageView();
  }, []);

  if (variant === null) {
    // Loading state while determining variant
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Render the appropriate landing page based on the variant
  return variant === 'A' ? <LandingPage /> : <LandingPageAlt />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LogProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<LandingPageSelector />} />
                <Route path="/landing-a" element={<LandingPage />} />
                <Route path="/landing-b" element={<LandingPageAlt />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/import-api" element={<ImportApi />} />
                <Route path="/configure-server/:projectId" element={<ConfigureServer />} />
                <Route path="/generate-server/:projectId/:configId" element={<GenerateServer />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </LogProvider>
  </QueryClientProvider>
);

export default App;