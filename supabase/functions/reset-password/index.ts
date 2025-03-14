
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Find the teacher by email
    const { data: teacherData, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id, full_name, email, is_active")
      .eq("email", email.toLowerCase())
      .single();

    if (teacherError || !teacherData) {
      return new Response(
        JSON.stringify({ error: "Teacher not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!teacherData.is_active) {
      return new Response(
        JSON.stringify({ error: "Account is inactive" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a unique token
    const token = crypto.randomUUID();
    
    // Calculate expiration time (24 hours from now)
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    // Store the reset token in the database
    const { error: resetError } = await supabaseAdmin
      .from("password_resets")
      .insert({
        teacher_id: teacherData.id,
        token: token,
        expires_at: expires.toISOString(),
      });

    if (resetError) {
      console.error("Error creating password reset:", resetError);
      return new Response(
        JSON.stringify({ error: "Failed to create password reset" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate the reset URL
    const resetUrl = `${req.headers.get("origin")}/reset-password/${token}`;

    // Send the email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Skolplattformen <no-reply@resend.dev>",
      to: [teacherData.email],
      subject: "Återställ ditt lösenord",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Återställ ditt lösenord</h2>
          <p>Hej ${teacherData.full_name},</p>
          <p>Vi har fått en begäran om att återställa ditt lösenord. Klicka på länken nedan för att skapa ett nytt lösenord:</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; font-weight: bold; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
              Återställ lösenord
            </a>
          </p>
          <p>Länken är giltig i 24 timmar.</p>
          <p>Om du inte begärde återställning av lösenordet kan du ignorera detta mail.</p>
          <p>Vänliga hälsningar,<br>Skolplattformen</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in reset-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Supabase client implementation for Deno
function createClient(supabaseUrl, supabaseKey) {
  return {
    from(table) {
      return {
        select(columns) {
          this.columns = columns;
          return this;
        },
        eq(column, value) {
          this.filter = { column, value };
          return this;
        },
        single() {
          return this.execute('SELECT');
        },
        insert(data) {
          this.data = data;
          return this.execute('INSERT');
        },
        update(data) {
          this.data = data;
          return this.execute('UPDATE');
        },
        async execute(method) {
          const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
          
          const headers = {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': method === 'INSERT' ? 'return=representation' : 'return=representation',
          };

          try {
            let finalUrl = url;
            let options = { headers };

            if (method === 'SELECT') {
              if (this.columns) {
                url.searchParams.append('select', this.columns);
              }
              if (this.filter) {
                url.searchParams.append(`${this.filter.column}`, `eq.${this.filter.value}`);
              }
              options.method = 'GET';
            } else if (method === 'INSERT') {
              options.method = 'POST';
              options.body = JSON.stringify(this.data);
            } else if (method === 'UPDATE') {
              if (this.filter) {
                url.searchParams.append(`${this.filter.column}`, `eq.${this.filter.value}`);
              }
              options.method = 'PATCH';
              options.body = JSON.stringify(this.data);
            }

            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
              return { data: null, error: data };
            }
            
            return { data: method === 'SELECT' && Array.isArray(data) && this.filter ? data[0] : data, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      };
    }
  };
}
