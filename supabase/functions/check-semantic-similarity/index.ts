
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text1, text2 } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a teacher evaluating student answers. Respond with "true" if the answers match semantically, and "false" if they don\'t. Only respond with true or false.'
          },
          {
            role: 'user',
            content: `Question: Compare these answers semantically:
            Teacher's answer: "${text1}"
            Student's answer: "${text2}"
            
            Are they semantically equivalent? Respond with only true or false.`
          }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const isCorrect = data.choices[0].message.content.toLowerCase().includes('true');

    return new Response(JSON.stringify({ isCorrect }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-semantic-similarity function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
