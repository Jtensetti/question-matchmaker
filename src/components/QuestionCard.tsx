
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question } from "@/types/question";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkSemanticMatch, checkAnswerCorrectAsync } from "@/utils/semanticMatching";

interface QuestionCardProps {
  question: Question;
  isTeacher?: boolean;
  onDeleteClick?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, isTeacher = false, onDeleteClick }) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [similarity, setSimilarity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({
        title: "Tomt svar",
        description: "Skriv ett svar innan du skickar in",
        variant: "destructive",
      });
      return;
    }

    if (!isTeacher && !studentName.trim()) {
      setShowNameInput(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate similarity with improved semantic matching
      const threshold = question.similarityThreshold || 0.7;
      
      // First, calculate similarity score
      const calculatedSimilarity = await checkSemanticMatch(
        userAnswer.trim(),
        question.answer.trim(),
        threshold
      );
      
      setSimilarity(calculatedSimilarity);
      
      // Determine if the answer is correct based on similarity threshold
      const correct = calculatedSimilarity >= threshold;
      
      setIsCorrect(correct);
      setIsSubmitted(true);

      // Save answer to database if not in teacher mode
      if (!isTeacher) {
        const { error } = await supabase
          .from('student_answers')
          .insert([
            { 
              question_id: question.id,
              student_name: studentName.trim(),
              answer: userAnswer.trim()
            }
          ]);

        if (error) throw error;
      }

      if (correct) {
        toast({
          title: "Rätt svar!",
          description: "Bra jobbat!",
        });
      } else {
        toast({
          title: "Fel svar",
          description: `Rätt svar: ${question.answer}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Fel",
        description: "Det gick inte att skicka in svaret",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveStudent = () => {
    if (!studentName.trim()) {
      toast({
        title: "Fel",
        description: "Ange ditt namn",
        variant: "destructive",
      });
      return;
    }
    
    setShowNameInput(false);
    handleSubmitAnswer();
  };

  const resetQuestion = () => {
    setUserAnswer("");
    setIsSubmitted(false);
    setIsCorrect(null);
    setSimilarity(0);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <p className="font-medium">{question.text}</p>
            {isTeacher && (
              <p className="text-sm text-muted-foreground mt-1">
                Svar: {question.answer}
              </p>
            )}
          </div>
          
          {!isSubmitted ? (
            showNameInput ? (
              <div className="space-y-2">
                <label htmlFor="studentName" className="text-sm font-medium">
                  Ditt namn
                </label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Ange ditt namn"
                  className="mt-1"
                />
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowNameInput(false)}
                  >
                    Avbryt
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveStudent}
                  >
                    Fortsätt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="Ditt svar..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                />
                <Button 
                  onClick={handleSubmitAnswer} 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Kontrollerar...' : 'Svara'}
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <p className="font-medium">Ditt svar:</p>
                <p className="text-muted-foreground">{userAnswer}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <p className="font-medium">Resultat:</p>
                {isCorrect ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span>Rätt</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-1" />
                    <span>Fel</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <p className="font-medium">Likhet:</p>
                <div className="flex items-center">
                  <span className={similarity >= 0.5 ? "text-green-600" : "text-red-600"}>
                    {Math.round(similarity * 100)}%
                  </span>
                </div>
              </div>
              
              {!isCorrect && (
                <div className="flex items-center space-x-2">
                  <p className="font-medium">Rätt svar:</p>
                  <p className="text-muted-foreground">{question.answer}</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={resetQuestion} 
                className="w-full"
              >
                Försök igen
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      {isTeacher && onDeleteClick && (
        <CardFooter className="justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDeleteClick}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Radera fråga
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
