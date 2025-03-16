import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2 } from 'lucide-react';
import { RefereeRegistration } from '../components/RefereeRegistration';
import { ReferralLinkManager } from '../components/ReferralLinkManager';
import { ReferralStats } from '../components/ReferralStats';
import { ReferralTable } from '../components/ReferralTable';
import { CommissionTable } from '../components/CommissionTable';
import { referralService } from '../utils/referralService';
import { supabase } from '../lib/supabase';
import { Referee, ReferralLink, Referral, Commission, ReferralStats as ReferralStatsType } from '../types/referral';

export function RefereeDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [referee, setReferee] = useState<Referee | null>(null);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<ReferralStatsType>({
    clicks: 0,
    referrals: {
      clicked: 0,
      signed_up: 0,
      subscribed: 0,
      expired: 0,
    },
    commissions: {
      pending: 0,
      paid: 0,
      total: 0,
    },
  });
  const [linksLoading, setLinksLoading] = useState<boolean>(false);
  const [referralsLoading, setReferralsLoading] = useState<boolean>(false);
  const [commissionsLoading, setCommissionsLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        navigate('/auth');
        return;
      }
      
      setAuthChecking(false);
    };
    
    checkAuth();
  }, [navigate]);

  // Load referee data
  useEffect(() => {
    if (authChecking) return;
    
    const loadRefereeData = async () => {
      try {
        setLoading(true);
        const refereeData = await referralService.getReferee();
        setReferee(refereeData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load referee data');
      } finally {
        setLoading(false);
      }
    };
    
    loadRefereeData();
  }, [authChecking]);

  // Load dashboard data when referee exists
  useEffect(() => {
    if (!referee) return;

    const loadDashboardData = async () => {
      try {
        // Load referral links
        setLinksLoading(true);
        const linksData = await referralService.getReferralLinks();
        setLinks(linksData);
        setLinksLoading(false);

        // Load referrals
        setReferralsLoading(true);
        const referralsData = await referralService.getReferrals();
        setReferrals(referralsData);
        setReferralsLoading(false);

        // Load commissions
        setCommissionsLoading(true);
        const commissionsData = await referralService.getCommissions();
        setCommissions(commissionsData);
        setCommissionsLoading(false);

        // Load stats
        setStatsLoading(true);
        const statsData = await referralService.getReferralStats();
        setStats(statsData);
        setStatsLoading(false);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      }
    };

    loadDashboardData();
  }, [referee]);

  const handleRegistered = async () => {
    // Reload referee data after registration
    try {
      const refereeData = await referralService.getReferee();
      setReferee(refereeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referee data after registration');
    }
  };

  if (authChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not a referee, show registration component
  if (!referee) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-8">Referee Program</h1>
        <RefereeRegistration onRegistered={handleRegistered} />
      </div>
    );
  }

  // Show referee dashboard
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Referee Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage your referrals and track your earnings
      </p>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {referee.status === 'pending' && (
        <Alert className="mb-6">
          <AlertDescription>
            Your referee account is pending approval. You'll be able to create referral links and track earnings once approved.
          </AlertDescription>
        </Alert>
      )}
      
      {referee.status === 'suspended' && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Your referee account has been suspended. Please contact support for more information.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Stats */}
        <ReferralStats stats={stats} loading={statsLoading} />

        {/* Links */}
        <ReferralLinkManager refereeStatus={referee.status} />

        {/* Tabs for Referrals and Commissions */}
        <Tabs defaultValue="referrals">
          <TabsList className="mb-4">
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="referrals">
            <ReferralTable referrals={referrals} loading={referralsLoading} />
          </TabsContent>
          
          <TabsContent value="commissions">
            <CommissionTable commissions={commissions} loading={commissionsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
