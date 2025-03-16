import { supabase } from '../lib/supabase'; // Assuming this exists in your project
import {
  Referee,
  ReferralLink,
  Referral,
  Commission,
  ReferralStats,
} from '../types/referral';

/**
 * Service for handling referral-related API calls
 */
export const referralService = {
  /**
   * Register as a referee
   */
  async becomeReferee(): Promise<Referee> {
    const { data, error } = await supabase.functions.invoke('referral/become-referee', {
      method: 'POST',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.referee;
  },

  /**
   * Get current user's referee information
   */
  async getReferee(): Promise<Referee | null> {
    const { data, error } = await supabase.functions.invoke('referral/referee', {
      method: 'GET',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.referee;
  },

  /**
   * Update referee information
   */
  async updateReferee(paymentInfo: Record<string, unknown>): Promise<Referee> {
    const { data, error } = await supabase.functions.invoke('referral/referee', {
      method: 'PUT',
      body: { payment_info: paymentInfo },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.referee;
  },

  /**
   * Get referral links for the current user
   */
  async getReferralLinks(): Promise<ReferralLink[]> {
    const { data, error } = await supabase.functions.invoke('referral/links', {
      method: 'GET',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.links || [];
  },

  /**
   * Create a new referral link
   */
  async createReferralLink(name: string, utmParams?: Record<string, unknown>): Promise<ReferralLink> {
    const { data, error } = await supabase.functions.invoke('referral/links', {
      method: 'POST',
      body: {
        name,
        utm_params: utmParams,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.link;
  },

  /**
   * Get referrals for the current user
   */
  async getReferrals(): Promise<Referral[]> {
    const { data, error } = await supabase.functions.invoke('referral/referrals', {
      method: 'GET',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.referrals || [];
  },

  /**
   * Get commissions for the current user
   */
  async getCommissions(): Promise<Commission[]> {
    const { data, error } = await supabase.functions.invoke('referral/commissions', {
      method: 'GET',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.commissions || [];
  },

  /**
   * Get referral statistics for the current user
   */
  async getReferralStats(): Promise<ReferralStats> {
    const { data, error } = await supabase.functions.invoke('referral/stats', {
      method: 'GET',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.stats;
  },

  /**
   * Track a referral click
   */
  async trackReferral(code: string): Promise<boolean> {
    const { error } = await supabase.functions.invoke('referral/track', {
      method: 'GET',
      query: { code },
    });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },

  /**
   * Get the full referral URL for a code
   */
  getReferralUrl(code: string, baseUrl = window.location.origin): string {
    return `${baseUrl}/signup?ref=${code}`;
  },
};
