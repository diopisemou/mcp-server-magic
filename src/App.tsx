import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import ImportApi from "./pages/ImportApi";
import ConfigureServer from "./pages/ConfigureServer";
import GenerateServer from "./pages/GenerateServer";
import GenerateServerV1 from "./pages/GenerateServerV1";
import Status from "./pages/Status"; // New Status page
import Marketplace from "./pages/Marketplace"; // New Marketplace page
import MarketplaceDetail from "./pages/MarketplaceDetail"; // New Marketplace Detail page
import { RefereeDashboard } from "./pages/RefereeDashboard"; // Referral Dashboard
import { RefereeAdminDashboard } from "./pages/RefereeAdminDashboard"; // Admin Dashboard for Referral System
import { AuthProvider } from "./contexts/AuthContext";
import { LogProvider } from "@/contexts/LogContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import LandingPageAlt from "./pages/LandingPageAlt";
import GoDemo from "./pages/GoDemo"; // Import the GoDemo page
import {
  getUserVariant,
  trackPageView,
  Variant,
} from "./utils/abTestingService";
import HeaderLayout from "./components/layouts/HeaderLayout";
import Docs from "./pages/Docs";

const queryClient = new QueryClient();

const LandingPageSelector = () => {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    // Get the user's assigned variant
    const userVariant = getUserVariant();
    setVariant(userVariant);

    // Track the page view
    trackPageView();
  }, []);

  // Show loading until we determine the variant
  if (!variant) return <div>Loading...</div>;

  // Render the appropriate landing page based on variant
  return variant === "A" ? <LandingPage /> : <LandingPageAlt />;
};

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
                {/* Routes with their own headers */}
                <Route path="/" element={<LandingPageSelector />} />
                <Route path="/landing-a" element={<LandingPage />} />
                <Route path="/landing-b" element={<LandingPageAlt />} />
                <Route path="/auth" element={<Auth />} />

                {/* Routes that need the common header */}

                <Route
                  path="/dashboard"
                  element={
                    <HeaderLayout>
                      <Dashboard />
                    </HeaderLayout>
                  }
                />
                <Route
                  path="/project/:projectId"
                  element={
                    <HeaderLayout>
                      <ProjectDetail />
                    </HeaderLayout>
                  }
                />
                <Route
                  path="/import-api"
                  element={
                    <HeaderLayout>
                      <ImportApi />
                    </HeaderLayout>
                  }
                />
                <Route
                  path="/configure-server/:projectId"
                  element={
                    <HeaderLayout>
                      <ConfigureServer />
                    </HeaderLayout>
                  }
                />
                <Route
                  path="/generate-server/:projectId/:configId"
                  element={
                    <HeaderLayout>
                      <GenerateServer />
                    </HeaderLayout>
                  }
                />
                <Route
                  path="/generate-server-v1/:projectId/:configId"
                  element={
                    <HeaderLayout>
                      <GenerateServerV1 />
                    </HeaderLayout>
                  }
                />
                <Route
                  path="/docs"
                  element={
                    <HeaderLayout>
                      <Docs />
                    </HeaderLayout>
                  }
                />
                
                {/* Go Demo Route */}
                <Route
                  path="/go-demo"
                  element={
                    <HeaderLayout>
                      <GoDemo />
                    </HeaderLayout>
                  }
                />

                {/* New routes */}
                <Route path="/status" element={<Status />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route
                  path="/marketplace/:id"
                  element={<MarketplaceDetail />}
                />
                
                {/* Referral System Routes */}
                <Route
                  path="/referrals"
                  element={
                    <HeaderLayout>
                      <RefereeDashboard />
                    </HeaderLayout>
                  }
                />
                <Route
                  path="/admin/referrals"
                  element={
                    <HeaderLayout>
                      <RefereeAdminDashboard />
                    </HeaderLayout>
                  }
                />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route
                  path="*"
                  element={
                    <HeaderLayout>
                      <NotFound />
                    </HeaderLayout>
                  }
                />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </LogProvider>
  </QueryClientProvider>
);

export default App;
