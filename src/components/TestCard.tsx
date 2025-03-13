
import { useState } from "react";
import { Test } from "@/types/question";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Share2, ExternalLink, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface TestCardProps {
  test: Test;
}

export const TestCard = ({ test }: TestCardProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  const shareLink = `${window.location.origin}/test/${test.id}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied!",
      description: "Share this link with your students",
    });
  };

  const questionsCount = test.questions?.length || 0;

  return (
    <>
      <Card className="w-full animate-fadeIn">
        <CardHeader>
          <h3 className="text-lg font-semibold">{test.title}</h3>
          {test.description && (
            <p className="text-sm text-muted-foreground">{test.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <span className="font-medium">{questionsCount}</span> questions
            <span className="text-muted-foreground"> · Created on {new Date(test.createdAt).toLocaleDateString()}</span>
          </div>
          
          {test.questions && test.questions.length > 0 && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowQuestions(!showQuestions)}
                className="flex items-center w-full justify-between"
              >
                {showQuestions ? "Hide" : "Show"} Questions
                {showQuestions ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
              
              {showQuestions && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {test.questions.map((question, index) => (
                    <div key={question.id} className="p-2 border rounded-md bg-muted/30">
                      <p className="text-sm font-medium">
                        Q{index + 1}: {question.text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Answer: {question.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
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
            onClick={() => window.open(`/test-dashboard/${test.id}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Responses
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Test with Students</DialogTitle>
            <DialogDescription>
              Students can use this link to answer all questions in this test without needing to log in.
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
              Students will answer each question in sequence. 
              You can view all responses in the test dashboard.
            </div>
            <Button 
              className="w-full" 
              variant="default" 
              onClick={() => window.open(`/test-dashboard/${test.id}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Test Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
