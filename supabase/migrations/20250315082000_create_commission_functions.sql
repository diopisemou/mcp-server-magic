-- Function to calculate commission totals for a referee
CREATE OR REPLACE FUNCTION get_commission_totals_for_referee(referee_id UUID)
RETURNS JSON AS $$
DECLARE
    pending_total DECIMAL;
    paid_total DECIMAL;
    total DECIMAL;
BEGIN
    -- Calculate pending commissions
    SELECT COALESCE(SUM(amount), 0) INTO pending_total
    FROM public.commissions
    WHERE referee_id = $1 AND status = 'pending';
    
    -- Calculate paid commissions
    SELECT COALESCE(SUM(amount), 0) INTO paid_total
    FROM public.commissions
    WHERE referee_id = $1 AND status = 'paid';
    
    -- Calculate total
    total := pending_total + paid_total;
    
    -- Return as JSON
    RETURN json_build_object(
        'pending', pending_total,
        'paid', paid_total,
        'total', total
    );
END;
$$ LANGUAGE plpgsql;
