
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Test } from "@/types/question";

interface StudentNameFormProps {
  test: Test;
  studentName: string;
  setStudentName: (name: string) => void;
  onSubmit: () => void;
  captchaQuestion: string;
  captchaAnswer: string;
  setCaptchaAnswer: (answer: string) => void;
  expectedCaptchaAnswer: string;
  generateCaptcha: () => string;
}

export const StudentNameForm: React.FC<StudentNameFormProps> = ({
  test,
  studentName,
  setStudentName,
  onSubmit,
  captchaQuestion,
  captchaAnswer,
  setCaptchaAnswer,
  expectedCaptchaAnswer,
  generateCaptcha,
}) => {
  const handleNameSubmit = () => {
    if (!studentName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to start the test.",
        variant: "destructive",
      });
      return;
    }
    
    if (captchaAnswer !== expectedCaptchaAnswer) {
      toast({
        title: "Incorrect captcha",
        description: "Please solve the math problem correctly.",
        variant: "destructive",
      });
      generateCaptcha();
      setCaptchaAnswer("");
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-2xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            {test.description && (
              <p className="text-muted-foreground">{test.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="mb-4">This test has {test.questions?.length || 0} questions. Please enter your name to begin.</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
                
                <div className="p-4 bg-muted rounded-md">
                  <label htmlFor="captcha" className="block text-sm font-medium mb-1">
                    {captchaQuestion} (Spam Protection)
                  </label>
                  <Input
                    id="captcha"
                    placeholder="Solve this simple math problem"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleNameSubmit} 
                  className="w-full"
                >
                  Start Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
