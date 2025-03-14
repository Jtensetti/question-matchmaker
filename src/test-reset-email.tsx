
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Supabase URL and anon key from the client file
const SUPABASE_URL = "https://ssamctnybxlvwrrlfbmz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYW1jdG55YnhsdndycmxmYm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNDYxMzUsImV4cCI6MjA1NDkyMjEzNX0.qyr63Do8EbDwuRSsNmYCy4ay9b8r-OfrKohCkTZAduM";

export const TestResetEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const email = "jonatan.tensetti@gmail.com";

  const sendResetEmail = async () => {
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
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ett fel uppstod");
      }

      toast({
        title: "Test email sent",
        description: `Reset password email sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ett oväntat fel inträffade",
        variant: "destructive",
      });
      console.error("Error sending test email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Test Reset Password Email</h1>
        <p className="mb-4">
          This will send a password reset email to: <strong>{email}</strong>
        </p>
        <Button
          onClick={sendResetEmail}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Sending..." : "Send Reset Email"}
        </Button>
      </div>
    </div>
  );
};

export default TestResetEmail;
