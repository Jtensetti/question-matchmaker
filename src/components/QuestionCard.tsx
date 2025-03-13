
import { useState } from "react";
import { Question } from "@/types/question";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Share2, Copy, ExternalLink } from "lucide-react";
import { compareTwoStrings } from "string-similarity";
import { isAnswerCorrect, checkSemanticMatch } from "@/utils/semanticMatching";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface QuestionCardProps {
  question: Question;
  isTeacher?: boolean;
  isLoading?: boolean;
  onAnswerSubmit?: (answer: string) => void;
}

export const QuestionCard = ({
  question,
  isTeacher = false,
  isLoading = false,
  onAnswerSubmit,
}: QuestionCardProps) => {
  const [answer, setAnswer] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Use the provided threshold or default to 0.7 (70%)
  const similarityThreshold = question.similarityThreshold ?? 0.7;
  const useSemanticMatching = question.semanticMatching ?? true; // Default to using semantic matching

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast({
        title: "Error",
        description: "Please provide an answer",
        variant: "destructive",
      });
      return;
    }

    if (isRateLimited) {
      toast({
        title: "Please wait",
        description: "Please wait a few seconds before trying again.",
        variant: "destructive",
      });
      return;
    }

    // If we have the correct answer (teacher mode), we can check it locally
    if (question.answer) {
      setChecking(true);
      
      // Simulate a small delay to make the checking feel natural
      setTimeout(() => {
        let similarity: number;
        let isCorrect: boolean;
        
        if (useSemanticMatching) {
          // Use our semantic matching approach
          similarity = checkSemanticMatch(
            answer.trim(), 
            question.answer.trim()
          );
          isCorrect = similarity >= similarityThreshold;
        } else {
          // Use the original string similarity approach
          similarity = compareTwoStrings(
            answer.trim().toLowerCase(),
            question.answer.trim().toLowerCase()
          );
          isCorrect = similarity >= similarityThreshold;
        }
        
        toast({
          title: isCorrect ? "Correct!" : "Incorrect",
          description: isCorrect
            ? `Great job! Your answer is ${Math.round(similarity * 100)}% similar to the expected answer.`
            : `Try again. Your answer is only ${Math.round(similarity * 100)}% similar to the expected meaning.`,
          variant: isCorrect ? "default" : "destructive",
        });
        
        setChecking(false);
        setAnswer("");
      }, 1000);
    } else {
      // If we don't have the correct answer (old behavior), use the callback
      onAnswerSubmit?.(answer);
      setAnswer("");
    }
  };

  const shareLink = `${window.location.origin}/student/${question.id}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied!",
      description: "Share this link with your students",
    });
  };

  return (
    <>
      <Card className="w-full animate-fadeIn">
        <CardHeader>
          <h3 className="text-lg font-semibold">{question.text}</h3>
        </CardHeader>
        <CardContent>
          {isTeacher ? (
            <div className="pt-2 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Answer:</p>
              <p className="mt-1">{question.answer}</p>
              {question.similarityThreshold !== undefined && (
                <div className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Strictness:</span> {Math.round(question.similarityThreshold * 100)}% 
                  ({question.similarityThreshold < 0.4 ? "Very lenient" : 
                    question.similarityThreshold < 0.6 ? "Lenient" : 
                    question.similarityThreshold < 0.8 ? "Moderate" : 
                    question.similarityThreshold < 0.9 ? "Strict" : "Very strict"})
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Matching:</span> {useSemanticMatching ? "Semantic (meaning-based)" : "String similarity (spelling-based)"}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full"
                disabled={isLoading || isRateLimited || checking}
              />
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={isLoading || isRateLimited || checking}
              >
                {isLoading || checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Answer
                  </>
                ) : isRateLimited ? (
                  "Please wait..."
                ) : (
                  "Submit Answer"
                )}
              </Button>
            </div>
          )}
        </CardContent>
        {isTeacher && (
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share with Students
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm"
              onClick={() => window.open(`/dashboard/${question.id}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Responses
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share with Students</DialogTitle>
            <DialogDescription>
              Students can use this link to answer the question without needing to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <Input value={shareLink} readOnly />
              <Button variant="outline" size="icon" onClick={copyShareLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Students will be able to enter their name and answer the question. 
              You can view all responses in the dashboard.
            </div>
            <Button 
              className="w-full" 
              variant="default" 
              onClick={() => window.open(`/dashboard/${question.id}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Responses Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
