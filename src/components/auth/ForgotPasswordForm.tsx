
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ForgotPasswordFormProps = {
  onBack: () => void;
};

// Get Supabase URL from the client - we know these values from the client.ts file
const SUPABASE_URL = "https://ssamctnybxlvwrrlfbmz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYW1jdG55YnhsdndycmxmYm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNDYxMzUsImV4cCI6MjA1NDkyMjEzNX0.qyr63Do8EbDwuRSsNmYCy4ay9b8r-OfrKohCkTZAduM";

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Fel",
        description: "E-post krävs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ett fel uppstod");
      }

      setEmailSent(true);
      toast({
        title: "E-post skickat",
        description: "Kontrollera din inkorg för instruktioner om hur du återställer ditt lösenord",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-medium">Kontrollera din e-post</h3>
        <p>
          Vi har skickat återställningsinstruktioner till {email}. 
          Kolla din inkorg och följ instruktionerna för att återställa ditt lösenord.
        </p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Tillbaka till inloggning
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">E-post</Label>
        <Input 
          id="reset-email" 
          type="email" 
          placeholder="din.email@exempel.se" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Bearbetar...
          </>
        ) : (
          "Skicka återställningslänk"
        )}
      </Button>

      <Button 
        type="button" 
        variant="ghost" 
        className="w-full mt-2" 
        onClick={onBack}
        disabled={isLoading}
      >
        Tillbaka till inloggning
      </Button>
    </form>
  );
};
