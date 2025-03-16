import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider,
  Navigate
} from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GenerateServer from './pages/GenerateServer';
import ConfigureServer from './pages/ConfigureServer';
import ServerConfiguration from './pages/ServerConfiguration';
import LandingPage from './pages/LandingPage';
import ImportApi from './pages/ImportApi';
import ProjectCreation from './pages/ProjectCreation';
import ProjectDetail from './pages/ProjectDetail';
import Marketplace from './pages/Marketplace';
import MarketplaceDetail from './pages/MarketplaceDetail';
import NotFound from './pages/NotFound';
import { RefereeDashboard } from './pages/RefereeDashboard';
import { RefereeAdminDashboard } from './pages/RefereeAdminDashboard';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// Protected route component
function ProtectedRoute({ element, isAdmin = false }: { element: JSX.Element, isAdmin?: boolean }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }
      
      setUser(session.user);
      
      // If admin check is required, verify user's role
      if (isAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        setIsAuthorized(profile?.role === 'admin');
      } else {
        setIsAuthorized(true);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [isAdmin]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/auth" replace />;
  }

  return element;
}

// Define the router
const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute element={<Dashboard />} />,
  },
  {
    path: '/generate',
    element: <ProtectedRoute element={<GenerateServer />} />,
  },
  {
    path: '/configure/:id',
    element: <ProtectedRoute element={<ConfigureServer />} />,
  },
  {
    path: '/server-configuration',
    element: <ProtectedRoute element={<ServerConfiguration />} />,
  },
  {
    path: '/import-api',
    element: <ProtectedRoute element={<ImportApi />} />,
  },
  {
    path: '/create-project',
    element: <ProtectedRoute element={<ProjectCreation />} />,
  },
  {
    path: '/projects/:id',
    element: <ProtectedRoute element={<ProjectDetail />} />,
  },
  {
    path: '/marketplace',
    element: <Marketplace />,
  },
  {
    path: '/marketplace/:id',
    element: <MarketplaceDetail />,
  },
  {
    path: '/referrals',
    element: <ProtectedRoute element={<RefereeDashboard />} />,
  },
  {
    path: '/admin/referrals',
    element: <ProtectedRoute element={<RefereeAdminDashboard />} isAdmin={true} />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
