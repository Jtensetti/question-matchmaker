
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import bcrypt from "bcryptjs";
import Cookies from "js-cookie";

type LoginFormProps = {
  onSuccess: (teacherId: string, teacherEmail: string, teacherName: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export const LoginForm = ({ onSuccess, isLoading, setIsLoading }: LoginFormProps) => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Fel",
        description: "E-post och lösenord krävs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if the teacher exists with this email
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id, email, full_name, is_active, password_hash")
        .eq("email", loginEmail.toLowerCase().trim())
        .single();

      if (teacherError || !teacherData) {
        throw new Error("Lärare hittades inte");
      }

      if (!teacherData.is_active) {
        throw new Error("Detta konto är inaktiverat");
      }

      // Check if password matches using bcrypt
      if (!teacherData.password_hash || !(await bcrypt.compare(loginPassword, teacherData.password_hash))) {
        throw new Error("Ogiltigt lösenord");
      }

      // Set cookies if "remember me" is checked
      if (rememberMe) {
        // Cookie expiration: 30 days
        const expirationDays = 30;
        Cookies.set("teacherId", teacherData.id, { expires: expirationDays });
        Cookies.set("teacherEmail", teacherData.email, { expires: expirationDays });
        Cookies.set("teacherName", teacherData.full_name, { expires: expirationDays });
      }

      toast({
        title: "Inloggad",
        description: `Välkommen tillbaka, ${teacherData.full_name}!`,
      });

      // Call the success callback with teacher information
      onSuccess(teacherData.id, teacherData.email, teacherData.full_name);
    } catch (error) {
      toast({
        title: "Inloggning misslyckades",
        description: error instanceof Error ? error.message : "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="din.email@exempel.se" 
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Lösenord</Label>
        <Input 
          id="password" 
          type="password" 
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="rememberMe" className="text-sm">Kom ihåg mig</Label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loggar in...
          </>
        ) : (
          "Logga in"
        )}
      </Button>
    </form>
  );
};
