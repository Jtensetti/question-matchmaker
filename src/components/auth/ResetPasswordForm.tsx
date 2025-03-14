
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ResetPasswordForm = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: "Fel",
        description: "Lösenord krävs",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Fel",
        description: "Lösenordet måste vara minst 8 tecken långt",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Fel",
        description: "Lösenorden matchar inte",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/update-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabase.supabaseKey}`,
          },
          body: JSON.stringify({ token, password }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ett fel uppstod");
      }

      toast({
        title: "Lösenord uppdaterat",
        description: "Ditt lösenord har uppdaterats. Du kan nu logga in med ditt nya lösenord.",
      });

      // Redirect to login page
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Ett oväntat fel inträffade",
        variant: "destructive",
      });
      setIsValidToken(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Ogiltigt eller utgånget</CardTitle>
          <CardDescription>
            Den här återställningslänken är ogiltig eller har löpt ut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/")} className="w-full">
            Tillbaka till inloggning
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Skapa nytt lösenord</CardTitle>
        <CardDescription>
          Ange ditt nya lösenord nedan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nytt lösenord</Label>
            <Input 
              id="new-password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
            <Input 
              id="confirm-password" 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              "Uppdatera lösenord"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
