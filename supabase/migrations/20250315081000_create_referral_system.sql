-- Enable pgcrypto extension for gen_random_uuid() function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create referees table to store referee information
CREATE TABLE IF NOT EXISTS public.referees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    payment_info JSONB DEFAULT NULL,
    approved_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_referee_user UNIQUE (user_id)
);

-- Create referral_links table to store referral links for referees
CREATE TABLE IF NOT EXISTS public.referral_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referee_id UUID NOT NULL REFERENCES public.referees(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    utm_params JSONB DEFAULT NULL,
    clicks INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create referrals table to track referred users
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'clicked' CHECK (status IN ('clicked', 'signed_up', 'subscribed', 'expired')),
    clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    signed_up_at TIMESTAMPTZ DEFAULT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_referral_user UNIQUE (referred_user_id)
);

-- Create subscriptions table to track paid subscriptions from referrals
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    interval VARCHAR(20) NOT NULL CHECK (interval IN ('monthly', 'yearly')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create commissions table to track referee earnings
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referee_id UUID NOT NULL REFERENCES public.referees(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    commission_date DATE NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_referees_user_id ON public.referees(user_id);
CREATE INDEX idx_referral_links_referee_id ON public.referral_links(referee_id);
CREATE INDEX idx_referrals_link_id ON public.referrals(link_id);
CREATE INDEX idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_referral_id ON public.subscriptions(referral_id);
CREATE INDEX idx_commissions_referee_id ON public.commissions(referee_id);
CREATE INDEX idx_commissions_subscription_id ON public.commissions(subscription_id);

-- Create or replace functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_referees_updated_at
BEFORE UPDATE ON public.referees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_links_updated_at
BEFORE UPDATE ON public.referral_links
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Referee policies
CREATE POLICY "Allow users to view their own referee profile"
ON public.referees
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own referee profile"
ON public.referees
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own referee profile"
ON public.referees
FOR UPDATE
USING (auth.uid() = user_id);

-- Referral link policies
CREATE POLICY "Allow referees to view their own referral links"
ON public.referral_links
FOR SELECT
USING (referee_id IN (SELECT id FROM public.referees WHERE user_id = auth.uid()));

CREATE POLICY "Allow referees to insert their own referral links"
ON public.referral_links
FOR INSERT
WITH CHECK (referee_id IN (SELECT id FROM public.referees WHERE user_id = auth.uid()));

CREATE POLICY "Allow referees to update their own referral links"
ON public.referral_links
FOR UPDATE
USING (referee_id IN (SELECT id FROM public.referees WHERE user_id = auth.uid()));

-- Referral policies
CREATE POLICY "Allow referees to view their own referrals"
ON public.referrals
FOR SELECT
USING (link_id IN (SELECT id FROM public.referral_links WHERE referee_id IN 
    (SELECT id FROM public.referees WHERE user_id = auth.uid())));

-- Subscription policies
CREATE POLICY "Allow users to view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- Commission policies
CREATE POLICY "Allow referees to view their own commissions"
ON public.commissions
FOR SELECT
USING (referee_id IN (SELECT id FROM public.referees WHERE user_id = auth.uid()));

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_unique_referral_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    result TEXT := '';
    i INTEGER := 0;
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        result := '';
        FOR i IN 1..length LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- Check if code already exists
        PERFORM 1 FROM public.referral_links WHERE code = result;
        is_unique := NOT FOUND;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate commission (20% of subscription amount)
CREATE OR REPLACE FUNCTION calculate_commission(subscription_amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(subscription_amount * 0.2, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically create a default referral link when a referee is approved
CREATE OR REPLACE FUNCTION create_default_referral_link()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO public.referral_links (referee_id, code, name)
        VALUES (NEW.id, generate_unique_referral_code(), 'Default Link');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_referral_link_on_approval
AFTER UPDATE OR INSERT ON public.referees
FOR EACH ROW EXECUTE FUNCTION create_default_referral_link();

-- Create a function to automatically create commissions for new subscriptions with referrals
CREATE OR REPLACE FUNCTION create_commission_for_subscription()
RETURNS TRIGGER AS $$
DECLARE
    referee_id UUID;
BEGIN
    -- Only process if there's a referral
    IF NEW.referral_id IS NOT NULL THEN
        -- Find the referee that should receive the commission
        SELECT r.referee_id INTO referee_id
        FROM public.referral_links rl
        JOIN public.referrals ref ON ref.link_id = rl.id
        WHERE ref.id = NEW.referral_id;
        
        IF referee_id IS NOT NULL THEN
            -- Create the commission
            INSERT INTO public.commissions (
                referee_id, 
                subscription_id, 
                amount, 
                commission_date
            )
            VALUES (
                referee_id, 
                NEW.id, 
                calculate_commission(NEW.amount),
                CURRENT_DATE
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_commission_on_subscription
AFTER INSERT ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION create_commission_for_subscription();

-- Create a function to automatically update referral status when subscription status changes
CREATE OR REPLACE FUNCTION update_referral_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_id IS NOT NULL THEN
        -- Update the referral status to subscribed
        UPDATE public.referrals
        SET status = 'subscribed',
            subscribed_at = CURRENT_TIMESTAMP
        WHERE id = NEW.referral_id AND status = 'signed_up';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_on_subscription
AFTER INSERT ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_referral_on_subscription();

-- Add admin policies for managing referees

-- Policy for admin access to all referees
CREATE POLICY "Allow admin access to all referees"
ON public.referees
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
  )
);

-- Policy for admin access to all referral links
CREATE POLICY "Allow admin access to all referral links"
ON public.referral_links
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
  )
);

-- Policy for admin access to all referrals
CREATE POLICY "Allow admin access to all referrals"
ON public.referrals
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
  )
);

-- Policy for admin access to all subscriptions
CREATE POLICY "Allow admin access to all subscriptions"
ON public.subscriptions
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
  )
);

-- Policy for admin access to all commissions
CREATE POLICY "Allow admin access to all commissions"
ON public.commissions
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
  )
);
