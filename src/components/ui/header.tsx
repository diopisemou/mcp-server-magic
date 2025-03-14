
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './button';
import { useAuth } from '@/contexts/AuthContext';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './navigation-menu';
import { cn } from '@/lib/utils';
import { User, LogOut, Package, Activity } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get display name safely from user object
  const getDisplayName = () => {
    if (!user) return '';
    
    // Check for user_metadata (for Supabase)
    if (user.user_metadata && user.user_metadata.username) {
      return user.user_metadata.username;
    }
    
    // Fallback to email
    return user.email;
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-all duration-100", 
      isScrolled ? "shadow-sm" : ""
    )}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-medium text-lg">MCP Server Generator</span>
          </Link>
        </div>
        
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink className="px-4 py-2 hover:text-primary transition-colors">
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/docs">
                <NavigationMenuLink className="px-4 py-2 hover:text-primary transition-colors">
                  Docs
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/marketplace">
                <NavigationMenuLink className="px-4 py-2 hover:text-primary transition-colors flex items-center">
                  <Package className="mr-1 h-4 w-4" />
                  Marketplace
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/status">
                <NavigationMenuLink className="px-4 py-2 hover:text-primary transition-colors flex items-center">
                  <Activity className="mr-1 h-4 w-4" />
                  Status
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            {user && (
              <NavigationMenuItem>
                <Link to="/dashboard">
                  <NavigationMenuLink className="px-4 py-2 hover:text-primary transition-colors">
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{getDisplayName()}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth', { state: { mode: 'signin' } })}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate('/auth', { state: { mode: 'signup' } })}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
