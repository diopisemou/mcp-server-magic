export interface Referee {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'suspended';
  payment_info: Record<string, any> | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralLink {
  id: string;
  referee_id: string;
  code: string;
  name: string;
  utm_params: Record<string, any> | null;
  clicks: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  link_id: string;
  referred_user_id: string;
  status: 'clicked' | 'signed_up' | 'subscribed' | 'expired';
  clicked_at: string;
  signed_up_at: string | null;
  subscribed_at: string | null;
  created_at: string;
  updated_at: string;
  referral_links?: {
    code: string;
    name: string;
  };
}

export interface Subscription {
  id: string;
  referral_id: string | null;
  user_id: string;
  plan: string;
  amount: number;
  interval: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  referee_id: string;
  subscription_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  commission_date: string;
  calculated_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  subscriptions?: {
    plan: string;
    amount: number;
  };
}

export interface ReferralStats {
  clicks: number;
  referrals: {
    clicked: number;
    signed_up: number;
    subscribed: number;
    expired: number;
  };
  commissions: {
    pending: number;
    paid: number;
    total: number;
  };
}
