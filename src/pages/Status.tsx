
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Server, Database, Cloud, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import HeaderLayout from '@/components/layouts/HeaderLayout';

// Types for service status
type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface ServiceInfo {
  name: string;
  status: ServiceStatus;
  icon: React.ReactNode;
  uptime: number;
  lastIncident?: string;
}

export default function Status() {
  const [services, setServices] = useState<ServiceInfo[]>([
    { 
      name: 'API Service', 
      status: 'operational', 
      icon: <Server className="h-5 w-5" />,
      uptime: 99.98
    },
    { 
      name: 'Database', 
      status: 'operational', 
      icon: <Database className="h-5 w-5" />,
      uptime: 99.99
    },
    { 
      name: 'MCP Generator', 
      status: 'operational', 
      icon: <Zap className="h-5 w-5" />,
      uptime: 100
    },
    { 
      name: 'Cloud Storage', 
      status: 'operational', 
      icon: <Cloud className="h-5 w-5" />,
      uptime: 99.95
    }
  ]);
  
  const [incidents, setIncidents] = useState<{date: string, description: string, resolved: boolean}[]>([
    {
      date: '2025-02-15',
      description: 'Brief API outage affecting server generation',
      resolved: true
    },
    {
      date: '2025-01-20',
      description: 'Scheduled database maintenance',
      resolved: true
    }
  ]);
  
  const [overallStatus, setOverallStatus] = useState<ServiceStatus>('operational');
  
  // Simulate fetching status data
  useEffect(() => {
    // This would be replaced with an actual API call in production
    const fetchStatus = async () => {
      // Simulate random status changes for demo purposes
      if (Math.random() > 0.8) {
        const updatedServices = [...services];
        const randomIndex = Math.floor(Math.random() * services.length);
        updatedServices[randomIndex].status = Math.random() > 0.5 ? 'degraded' : 'operational';
        
        setServices(updatedServices);
        
        // Update overall status based on individual service statuses
        if (updatedServices.some(s => s.status === 'outage')) {
          setOverallStatus('outage');
        } else if (updatedServices.some(s => s.status === 'degraded')) {
          setOverallStatus('degraded');
        } else {
          setOverallStatus('operational');
        }
      }
    };
    
    // Fetch status initially and then every 30 seconds
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, [services]);
  
  const getStatusLabel = (status: ServiceStatus) => {
    switch (status) {
      case 'operational': return 'Operational';
      case 'degraded': return 'Degraded Performance';
      case 'outage': return 'Service Outage';
      default: return 'Unknown';
    }
  };
  
  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational': return 'text-green-500';
      case 'degraded': return 'text-amber-500';
      case 'outage': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'outage': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };
  
  return (
    <HeaderLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">System Status</h1>
        
        <div className="mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(overallStatus)}
                <span className={cn("ml-2", getStatusColor(overallStatus))}>
                  All Systems {getStatusLabel(overallStatus)}
                </span>
              </CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {services.map((service, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {service.icon}
                        <span className="ml-2 font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(service.status)}
                        <span className={cn("ml-2", getStatusColor(service.status))}>
                          {getStatusLabel(service.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={service.uptime} className="h-2" />
                      <span className="text-xs text-muted-foreground">
                        {service.uptime}% uptime
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Recent Incidents</h2>
        {incidents.length > 0 ? (
          <div className="space-y-4">
            {incidents.map((incident, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{incident.description}</CardTitle>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      incident.resolved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {incident.resolved ? "Resolved" : "Ongoing"}
                    </span>
                  </div>
                  <CardDescription>{incident.date}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <p>No incidents reported in the last 90 days.</p>
        )}
      </div>
    </HeaderLayout>
  );
}
