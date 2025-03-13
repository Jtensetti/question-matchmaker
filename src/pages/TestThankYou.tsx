
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Test } from "@/types/question";

const TestThankYou = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) return;
      
      try {
        const { data, error } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (error) throw error;

        if (data) {
          setTest({
            id: data.id,
            title: data.title,
            description: data.description || undefined,
            createdAt: new Date(data.created_at)
          });
        }
      } catch (error) {
        console.error('Error fetching test:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6 space-y-6">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          
          <h1 className="text-2xl font-bold">Thank You!</h1>
          
          <p className="text-muted-foreground">
            Your answers for {test?.title || "the test"} have been submitted successfully.
          </p>
          
          <Button
            onClick={() => navigate('/')}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestThankYou;
