
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./auth/LoginForm";
import { RegisterForm } from "./auth/RegisterForm";
import { ForgotPasswordForm } from "./auth/ForgotPasswordForm";

type TeacherAuthProps = {
  onSuccess: (teacherId: string, teacherEmail: string, teacherName: string) => void;
};

export const TeacherAuth = ({ onSuccess }: TeacherAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
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
        {showForgotPassword ? (
          <ForgotPasswordForm onBack={handleBackToLogin} />
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Logga in</TabsTrigger>
              <TabsTrigger value="register">Registrera</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-4">
              <LoginForm 
                onSuccess={onSuccess} 
                isLoading={isLoading} 
                setIsLoading={setIsLoading}
                onForgotPassword={handleForgotPassword}
              />
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-4">
              <RegisterForm 
                onSuccess={onSuccess} 
                isLoading={isLoading} 
                setIsLoading={setIsLoading} 
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        {/* Footer text removed as requested */}
      </CardFooter>
    </Card>
  );
};
