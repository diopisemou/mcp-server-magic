import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2 } from 'lucide-react';
import { referralService } from '../utils/referralService';

interface RefereeRegistrationProps {
  onRegistered: () => void;
}

export function RefereeRegistration({ onRegistered }: RefereeRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegistration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await referralService.becomeReferee();
      onRegistered();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register as referee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Become a Referee</CardTitle>
        <CardDescription>
          Join our referral program and earn 20% commission on payments from your referrals for one year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>
            As a referee, you&apos;ll receive a unique referral link that you can share with your network.
            When someone signs up and subscribes to our service through your link, you&apos;ll earn a 20% commission
            on each payment they make for one year.
          </p>
          <p>
            Benefits of being a referee:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Earn passive income from your referrals</li>
            <li>Track your referrals and earnings in real-time</li>
            <li>Create multiple referral links for different channels</li>
            <li>Regular commission payouts</li>
          </ul>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleRegistration}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            'Register as Referee'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
