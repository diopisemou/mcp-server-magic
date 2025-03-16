import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Referral system API function loaded")

interface RefereeRequest {
  payment_info?: Record<string, any>;
}

interface ReferralLinkRequest {
  name: string;
  utm_params?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    const endpoint = path[1] // 'referral' is path[0]

    // Route the request based on the endpoint and method
    switch (endpoint) {
      case 'become-referee':
        if (req.method === 'POST') {
          return handleBecomeReferee(req, supabaseClient, user.id)
        }
        break

      case 'referee':
        if (req.method === 'GET') {
          return handleGetReferee(supabaseClient, user.id)
        } else if (req.method === 'PUT') {
          return handleUpdateReferee(req, supabaseClient, user.id)
        }
        break

      case 'links':
        if (req.method === 'GET') {
          return handleGetReferralLinks(supabaseClient, user.id)
        } else if (req.method === 'POST') {
          return handleCreateReferralLink(req, supabaseClient, user.id)
        }
        break

      case 'referrals':
        if (req.method === 'GET') {
          return handleGetReferrals(supabaseClient, user.id)
        }
        break

      case 'commissions':
        if (req.method === 'GET') {
          return handleGetCommissions(supabaseClient, user.id)
        }
        break

      case 'stats':
        if (req.method === 'GET') {
          return handleGetStats(supabaseClient, user.id)
        }
        break

      case 'track':
        if (req.method === 'GET') {
          const code = url.searchParams.get('code')
          if (code) {
            return handleTrackReferral(supabaseClient, code)
          }
        }
        break
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// Handler for registering as a referee
async function handleBecomeReferee(req: Request, supabase: any, userId: string) {
  try {
    // Check if user is already a referee
    const { data: existingReferee } = await supabase
      .from('referees')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingReferee) {
      return new Response(
        JSON.stringify({
          error: 'You are already registered as a referee',
          referee: existingReferee,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Register as a new referee
    const { data: referee, error } = await supabase
      .from('referees')
      .insert([{ user_id: userId }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ referee }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handler for getting referee information
async function handleGetReferee(supabase: any, userId: string) {
  try {
    const { data: referee, error } = await supabase
      .from('referees')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return new Response(
      JSON.stringify({
        referee: referee || null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handler for updating referee information
async function handleUpdateReferee(req: Request, supabase: any, userId: string) {
  try {
    const { data: referee } = await supabase
      .from('referees')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!referee) {
      return new Response(JSON.stringify({ error: 'Referee not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const body: RefereeRequest = await req.json()

    const { data: updatedReferee, error } = await supabase
      .from('referees')
      .update({
        payment_info: body.payment_info,
      })
      .eq('id', referee.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ referee: updatedReferee }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handler for getting referral links
async function handleGetReferralLinks(supabase: any, userId: string) {
  try {
    // Get referee ID
    const { data: referee } = await supabase
      .from('referees')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!referee) {
      return new Response(JSON.stringify({ error: 'Referee not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Get referral links
    const { data: links, error } = await supabase
      .from('referral_links')
      .select('*')
      .eq('referee_id', referee.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ links }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handler for creating a new referral link
async function handleCreateReferralLink(req: Request, supabase: any, userId: string) {
  try {
    // Get referee ID
    const { data: referee } = await supabase
      .from('referees')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    if (!referee) {
      return new Response(JSON.stringify({ error: 'Referee not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Check if referee is approved
    if (referee.status !== 'approved') {
      return new Response(
        JSON.stringify({
          error: 'Your referee account must be approved before creating referral links',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    const body: ReferralLinkRequest = await req.json()

    // Create a function that can be called from Supabase Edge Function to generate a unique code
    // For now, we'll use a simple random string
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // Create new referral link
    const { data: link, error } = await supabase
      .from('referral_links')
      .insert([
        {
          referee_id: referee.id,
          code: generateCode(),
          name: body.name,
          utm_params: body.utm_params || null,
        },
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ link }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handler for getting referrals
async function handleGetReferrals(supabase: any, userId: string) {
  try {
    // Get referee ID
    const { data: referee } = await supabase
      .from('referees')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!referee) {
      return new Response(JSON.stringify({ error: 'Referee not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Get referrals
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        id,
        status,
        clicked_at,
        signed_up_at,
        subscribed_at,
        link_id,
        referral_links(code, name)
      `)
      .in(
        'link_id',
        supabase
          .from('referral_links')
          .select('id')
          .eq('referee_id', referee.id)
      )
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ referrals }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handler for getting commissions
async function handleGetCommissions(supabase: any, userId: string) {
  try {
    // Get referee ID
    const { data: referee } = await supabase
      .from('referees')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!referee) {
      return new Response(JSON.stringify({ error: 'Referee not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Get commissions
    const { data: commissions, error } = await supabase
      .from('commissions')
      .select(`
        id,
        amount,
        status,
        commission_date,
        calculated_at,
        paid_at,
        subscription_id,
        subscriptions(plan, amount)
      `)
      .eq('referee_id', referee.id)
      .order('commission_date', { ascending: false })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ commissions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handler for getting referral statistics
async function handleGetStats(supabase: any, userId: string) {
  try {
    // Get referee ID
    const { data: referee } = await supabase
      .from('referees')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!referee) {
      return new Response(JSON.stringify({ error: 'Referee not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Get referral links
    const { data: links } = await supabase
      .from('referral_links')
      .select('id, clicks')
      .eq('referee_id', referee.id)

    const linkIds = links ? links.map((link) => link.id) : []
    const totalClicks = links ? links.reduce((sum, link) => sum + link.clicks, 0) : 0

    // Get referral counts by status
    const { data: referralCounts, error: referralError } = await supabase
      .from('referrals')
      .select('status, count')
      .in('link_id', linkIds)
      .group('status')

    if (referralError) {
      throw referralError
    }

    // Get commission totals
    const { data: commissionTotals, error: commissionError } = await supabase.rpc(
      'get_commission_totals_for_referee',
      { referee_id: referee.id }
    )

    if (commissionError) {
      // If the RPC doesn't exist, fallback to a manual calculation
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status')
        .eq('referee_id', referee.id)

      const pending = commissions
        ? commissions
            .filter((c) => c.status === 'pending')
            .reduce((sum, c) => sum + parseFloat(c.amount), 0)
        : 0

      const paid = commissions
        ? commissions
            .filter((c) => c.status === 'paid')
            .reduce((sum, c) => sum + parseFloat(c.amount), 0)
        : 0

      const stats = {
        clicks: totalClicks,
        referrals: {
          clicked: referralCounts.find((r) => r.status === 'clicked')?.count || 0,
          signed_up: referralCounts.find((r) => r.status === 'signed_up')?.count || 0,
          subscribed: referralCounts.find((r) => r.status === 'subscribed')?.count || 0,
          expired: referralCounts.find((r) => r.status === 'expired')?.count || 0,
        },
        commissions: {
          pending,
          paid,
          total: pending + paid,
        },
      }

      return new Response(JSON.stringify({ stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Use the RPC results
    const stats = {
      clicks: totalClicks,
      referrals: {
        clicked: referralCounts.find((r) => r.status === 'clicked')?.count || 0,
        signed_up: referralCounts.find((r) => r.status === 'signed_up')?.count || 0,
        subscribed: referralCounts.find((r) => r.status === 'subscribed')?.count || 0,
        expired: referralCounts.find((r) => r.status === 'expired')?.count || 0,
      },
      commissions: commissionTotals,
    }

    return new Response(JSON.stringify({ stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handler for tracking referral clicks
async function handleTrackReferral(supabase: any, code: string) {
  try {
    // Find the referral link
    const { data: link, error: linkError } = await supabase
      .from('referral_links')
      .select('id, referee_id')
      .eq('code', code)
      .eq('active', true)
      .single()

    if (linkError) {
      return new Response(JSON.stringify({ error: 'Invalid referral code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Increment click count
    await supabase
      .from('referral_links')
      .update({ clicks: link.clicks + 1 })
      .eq('id', link.id)

    return new Response(
      JSON.stringify({ success: true, referral_code: code }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}
