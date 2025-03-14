
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@1.0.0'

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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      console.error('Missing environment variables', { 
        hasSupabaseUrl: !!supabaseUrl, 
        hasSupabaseKey: !!supabaseServiceKey, 
        hasResendKey: !!resendApiKey 
      })
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resend = new Resend(resendApiKey)

    // Check if teacher exists
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('id, email, is_active, full_name')
      .eq('email', email.toLowerCase())
      .single()

    if (teacherError || !teacherData) {
      console.log('Teacher not found or error:', teacherError)
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
      console.log('Teacher account is inactive:', email)
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

    // Create reset link
    const resetLink = `${frontendUrl}/reset-password?token=${token}`
    
    // Send email with Resend
    const teacherName = teacherData.full_name || 'Lärare'
    
    console.log('Attempting to send email to:', email)
    
    try {
      await resend.emails.send({
        from: 'Lärarportalen <onboarding@resend.dev>',
        to: [email],
        subject: 'Återställ ditt lösenord',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hej ${teacherName}!</h2>
            <p>Vi har mottagit en begäran om att återställa ditt lösenord.</p>
            <p>Klicka på länken nedan för att välja ett nytt lösenord:</p>
            <p>
              <a href="${resetLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                Återställ lösenord
              </a>
            </p>
            <p>Eller kopiera denna länk till din webbläsare:</p>
            <p>${resetLink}</p>
            <p>Denna länk är giltig i ${tokenExpiryHours} timmar.</p>
            <p>Om du inte begärde att återställa ditt lösenord kan du bortse från detta meddelande.</p>
            <p>Med vänliga hälsningar,<br>Lärarportalen</p>
          </div>
        `
      });
      
      console.log('Password reset email sent successfully')
    } catch (emailErr) {
      console.error('Caught error while sending email:', emailErr)
      throw new Error('Email sending failed: ' + (emailErr.message || 'Unknown error'))
    }

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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
