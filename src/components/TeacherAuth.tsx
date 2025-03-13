
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type TeacherAuthProps = {
  onSuccess: (teacherId: string, teacherEmail: string, teacherName: string) => void;
};

export const TeacherAuth = ({ onSuccess }: TeacherAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");

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
        .select("id, email, full_name, is_active")
        .eq("email", loginEmail.toLowerCase().trim())
        .single();

      if (teacherError || !teacherData) {
        throw new Error("Lärare hittades inte");
      }

      if (!teacherData.is_active) {
        throw new Error("Detta konto är inaktiverat");
      }

      // In a real app, we would use supabase auth for password handling
      // For this demo, we'll use a simple check against the admin password
      if (loginPassword !== "teacher123") {
        throw new Error("Ogiltigt lösenord");
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

      // In a real app, we would use supabase auth for password handling
      // For this demo, we'll just insert the teacher record
      const { data: newTeacher, error: insertError } = await supabase
        .from("teachers")
        .insert([
          { 
            email: registerEmail.toLowerCase().trim(), 
            full_name: registerFullName.trim(),
            // In a real app, we would not store passwords in plain text
            // This is just for demonstration
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Lärarportal</CardTitle>
        <CardDescription>
          Logga in eller registrera dig för att hantera dina frågor och tester
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Logga in</TabsTrigger>
            <TabsTrigger value="register">Registrera</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 mt-4">
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
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4 mt-4">
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
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <p>Detta är en demo. Lösenord: "teacher123"</p>
      </CardFooter>
    </Card>
  );
};
