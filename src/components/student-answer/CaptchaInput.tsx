
import React from "react";
import { Input } from "@/components/ui/input";

interface CaptchaInputProps {
  captchaQuestion: string;
  captchaAnswer: string;
  setCaptchaAnswer: (answer: string) => void;
  submitting: boolean;
}

export const CaptchaInput: React.FC<CaptchaInputProps> = ({
  captchaQuestion,
  captchaAnswer,
  setCaptchaAnswer,
  submitting
}) => {
  return (
    <div className="p-4 bg-muted rounded-md">
      <label htmlFor="captcha" className="block text-sm font-medium mb-1">
        {captchaQuestion} (Spam Protection)
      </label>
      <Input
        id="captcha"
        placeholder="Solve this simple math problem"
        value={captchaAnswer}
        onChange={(e) => setCaptchaAnswer(e.target.value)}
        disabled={submitting}
      />
    </div>
  );
};
