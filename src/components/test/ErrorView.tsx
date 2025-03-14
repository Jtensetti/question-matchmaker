
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorViewProps {
  onGoBack: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ onGoBack }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Test Not Found</h2>
            <p className="text-muted-foreground">
              The test you're looking for doesn't exist or has no questions.
            </p>
            <Button onClick={onGoBack}>
              Go Back Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
