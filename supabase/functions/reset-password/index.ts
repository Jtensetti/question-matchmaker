
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the email from the request body
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if the email exists in the teachers table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if teacher exists
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('id, email, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (teacherError || !teacherData) {
      // We don't want to reveal if the email exists or not for security reasons
      // Just return success even if the email doesn't exist
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!teacherData.is_active) {
      // Don't send reset emails to inactive accounts
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate a reset token
    const tokenExpiryHours = 24
    const tokenExpiry = new Date()
    tokenExpiry.setHours(tokenExpiry.getHours() + tokenExpiryHours)
    
    const token = crypto.randomUUID()
    
    // Store the token in the database
    const { error: resetError } = await supabase
      .from('password_resets')
      .insert([
        {
          teacher_id: teacherData.id,
          token: token,
          expires_at: tokenExpiry.toISOString(),
          used: false
        }
      ])

    if (resetError) {
      console.error('Error creating reset token:', resetError)
      throw new Error('Failed to create password reset token')
    }

    // Send email with reset link
    // In this implementation, we'll use Supabase's storage to store the token and send an email
    // In a production environment, you should integrate with an email service
    const resetLink = `${frontendUrl}/reset-password?token=${token}`
    
    console.log(`Reset link generated for ${email}: ${resetLink}`)
    
    // Note: In a real application, you would send an actual email here
    // For now, we'll just log the link and consider it a success
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in reset-password function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
