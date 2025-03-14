
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password } = await req.json();
    
    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: "Token and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Find the reset token
    const { data: resetData, error: resetError } = await supabaseAdmin
      .from("password_resets")
      .select("id, teacher_id, expires_at, used")
      .eq("token", token)
      .single();

    if (resetError || !resetData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetData.expires_at);
    
    if (now > expiresAt || resetData.used) {
      return new Response(
        JSON.stringify({ error: "Reset token has expired or been used" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the teacher
    const { data: teacherData, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id, is_active")
      .eq("id", resetData.teacher_id)
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

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the teacher's password
    const { error: updateError } = await supabaseAdmin
      .from("teachers")
      .update({
        password_hash: hashedPassword
      })
      .eq("id", resetData.teacher_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark the reset token as used
    const { error: markUsedError } = await supabaseAdmin
      .from("password_resets")
      .update({ used: true })
      .eq("id", resetData.id);

    if (markUsedError) {
      console.error("Failed to mark token as used:", markUsedError);
      // Not returning an error here since the password was updated successfully
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in update-password function:", error);
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
