
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

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

    // Get the token and new password from the request body
    const { token, password } = await req.json()

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token and password are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Password validation
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
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

    // Verify the token
    const { data: resetData, error: resetError } = await supabase
      .from('password_resets')
      .select('id, teacher_id, expires_at, used')
      .eq('token', token)
      .single()

    if (resetError || !resetData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (resetData.used) {
      return new Response(
        JSON.stringify({ error: 'Token has already been used' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const now = new Date()
    const expiresAt = new Date(resetData.expires_at)
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Update the teacher's password
    const { error: updateError } = await supabase
      .from('teachers')
      .update({ password_hash: hashedPassword })
      .eq('id', resetData.teacher_id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      throw new Error('Failed to update password')
    }

    // Mark the token as used
    const { error: tokenUpdateError } = await supabase
      .from('password_resets')
      .update({ used: true })
      .eq('id', resetData.id)

    if (tokenUpdateError) {
      console.error('Error marking token as used:', tokenUpdateError)
      // Continue anyway since the password was updated
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in set-new-password function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
