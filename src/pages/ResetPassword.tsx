
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-reset-token', {
          body: { token }
        });

        if (error || !data?.valid) {
          setTokenValid(false);
          toast({
            title: "Ogiltig eller utgången länk",
            description: "Denna återställningslänk är ogiltig eller har löpt ut. Vänligen begär en ny.",
            variant: "destructive",
          });
        } else {
          setTokenValid(true);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        setTokenValid(false);
        toast({
          title: "Fel vid verifiering",
          description: "Kunde inte verifiera återställningslänken. Vänligen försök igen senare.",
          variant: "destructive",
        });
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla fält",
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

    if (password.length < 8) {
      toast({
        title: "Fel",
        description: "Lösenordet måste vara minst 8 tecken långt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('set-new-password', {
        body: { 
          token,
          password 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsComplete(true);
      toast({
        title: "Lösenord återställt",
        description: "Ditt lösenord har uppdaterats. Du kan nu logga in med ditt nya lösenord.",
      });

      // Redirect to home page after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Något gick fel",
        description: error instanceof Error ? error.message : "Kunde inte återställa lösenordet. Vänligen försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Verifierar länk...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ogiltig återställningslänk</CardTitle>
            <CardDescription>
              Denna återställningslänk är ogiltig eller har löpt ut.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Vänligen begär en ny återställningslänk för att fortsätta.
            </p>
            <Button asChild>
              <Link to="/forgot-password">Begär ny återställningslänk</Link>
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/" className="text-sm text-primary hover:underline">
              Tillbaka till startsidan
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Välj nytt lösenord</CardTitle>
          <CardDescription>
            {isComplete 
              ? "Ditt lösenord har uppdaterats framgångsrikt."
              : "Skapa ett nytt lösenord för ditt konto"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isComplete ? (
            <div className="text-center py-4 space-y-6">
              <p className="text-muted-foreground">
                Du omdirigeras till inloggningssidan...
              </p>
              <Button asChild className="mt-4">
                <Link to="/">Gå till startsidan</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nytt lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
                <Input
                  id="confirmPassword"
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
                  "Återställ lösenord"
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

export default ResetPassword;
