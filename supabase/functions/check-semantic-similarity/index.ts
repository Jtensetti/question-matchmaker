
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text1, text2 } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key is not set');
      throw new Error('OpenAI API key is not configured');
    }

    if (!text1 || !text2) {
      console.error('Missing required parameters:', { text1, text2 });
      throw new Error('Both text1 and text2 are required');
    }

    console.log('Making request to OpenAI with texts:', { text1, text2 });

    // Add a small delay to help prevent rate limiting
    await sleep(1000);

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
            
            Are they semantically equivalent? Consider translation equivalence like "Helsinki" and "Helsingfors". But if the teacher's answer is a complex sentence and the student's answer is just a single word that appears in that sentence, they're usually not equivalent.
            
            Respond with only true or false.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Too many requests. Please wait a moment before trying again.",
          retryAfter: 5 // Suggest waiting 5 seconds
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI API response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const isCorrect = data.choices[0].message.content.toLowerCase().includes('true');
    console.log('Evaluation result:', { isCorrect });

    return new Response(JSON.stringify({ isCorrect }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-semantic-similarity function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
