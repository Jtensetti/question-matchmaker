
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import bcrypt from "bcryptjs";

type RegisterFormProps = {
  onSuccess: (teacherId: string, teacherEmail: string, teacherName: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export const RegisterForm = ({ onSuccess, isLoading, setIsLoading }: RegisterFormProps) => {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerFullName) {
      toast({
        title: "Fel",
        description: "Alla fält måste fyllas i",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Fel",
        description: "Lösenordet måste vara minst 6 tecken långt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if email already exists
      const { data: existingTeacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("email", registerEmail.toLowerCase().trim())
        .maybeSingle();

      if (existingTeacher) {
        throw new Error("En lärare med denna e-post finns redan");
      }

      // Hash the password using bcrypt (10 rounds)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(registerPassword, salt);
      
      const { data: newTeacher, error: insertError } = await supabase
        .from("teachers")
        .insert([
          { 
            email: registerEmail.toLowerCase().trim(), 
            full_name: registerFullName.trim(),
            password_hash: passwordHash
          }
        ])
        .select()
        .single();

      if (insertError || !newTeacher) {
        throw new Error("Kunde inte skapa konto: " + insertError?.message);
      }

      toast({
        title: "Konto skapat",
        description: "Ditt lärarkonto har skapats. Du är nu inloggad.",
      });

      // Call the success callback with teacher information
      onSuccess(newTeacher.id, newTeacher.email, newTeacher.full_name);
    } catch (error) {
      toast({
        title: "Registrering misslyckades",
        description: error instanceof Error ? error.message : "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full-name">Fullständigt namn</Label>
        <Input 
          id="full-name" 
          type="text" 
          placeholder="Anna Andersson" 
          value={registerFullName}
          onChange={(e) => setRegisterFullName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-email">E-post</Label>
        <Input 
          id="register-email" 
          type="email" 
          placeholder="din.email@exempel.se" 
          value={registerEmail}
          onChange={(e) => setRegisterEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Lösenord</Label>
        <Input 
          id="register-password" 
          type="password" 
          value={registerPassword}
          onChange={(e) => setRegisterPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Skapar konto...
          </>
        ) : (
          "Registrera"
        )}
      </Button>
    </form>
  );
};
