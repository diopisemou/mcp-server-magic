import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ReferralStats as ReferralStatsType } from '../types/referral';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  prefix?: string;
  suffix?: string;
}

function StatCard({ title, value, description, prefix, suffix }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{value}{suffix}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ReferralStatsProps {
  stats: ReferralStatsType;
  loading: boolean;
}

export function ReferralStats({ stats, loading }: ReferralStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-full mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Link Clicks"
        value={stats.clicks}
        description="Total number of clicks on your referral links"
      />
      <StatCard
        title="Successful Referrals"
        value={stats.referrals.subscribed}
        description="People who subscribed through your link"
      />
      <StatCard
        title="Pending Earnings"
        value={stats.commissions.pending.toFixed(2)}
        prefix="$"
        description="Commissions not yet paid out"
      />
      <StatCard
        title="Total Earnings"
        value={stats.commissions.total.toFixed(2)}
        prefix="$"
        description="All-time earnings from referrals"
      />
    </div>
  );
}
