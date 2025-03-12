import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import ImportApi from "./pages/ImportApi";
import ConfigureServer from "./pages/ConfigureServer";
import GenerateServer from "./pages/GenerateServer";
import { AuthProvider } from "./contexts/AuthContext";
import { LogProvider } from "@/contexts/LogContext"; // Added import
import ErrorBoundary from "@/components/ErrorBoundary"; // Added import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LogProvider> {/* Added LogProvider */}
      <TooltipProvider>
        <ErrorBoundary> {/* Added ErrorBoundary */}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
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
        </ErrorBoundary> {/* Closing ErrorBoundary */}
      </TooltipProvider>
    </LogProvider> {/* Closing LogProvider */}
  </QueryClientProvider>
);

export default App;