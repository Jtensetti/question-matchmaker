
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Fel",
        description: "Vänligen ange din e-postadress",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('reset-password', {
        body: { email: email.toLowerCase().trim() }
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsSubmitted(true);
      toast({
        title: "Återställningslänk skickad",
        description: "Om e-postadressen finns i vårt system har ett e-postmeddelande skickats med ytterligare instruktioner.",
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast({
        title: "Något gick fel",
        description: error instanceof Error ? error.message : "Kunde inte skicka återställningslänk. Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Återställ lösenord</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? "Vi har skickat dig ett e-postmeddelande med instruktioner för att återställa ditt lösenord."
              : "Ange din e-postadress nedan för att få en länk för återställning av lösenord"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center py-4 space-y-6">
              <p className="text-muted-foreground">
                Kontrollera din e-post (och skräppostmapp) efter ett meddelande från oss med instruktioner för att återställa ditt lösenord.
              </p>
              <Button asChild className="mt-4">
                <Link to="/">Tillbaka till startsidan</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
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
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/" className="text-sm text-primary hover:underline">
            Tillbaka till startsidan
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
