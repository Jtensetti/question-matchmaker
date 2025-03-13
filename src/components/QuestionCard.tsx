
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question } from "@/types/question";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  AlignLeft, 
  AlignRight 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkSemanticMatch, checkAnswerCorrectAsync } from "@/utils/semanticMatching";

interface QuestionCardProps {
  question: Question;
  isTeacher?: boolean;
  isAdmin?: boolean;
  onDeleteClick?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  isTeacher = false, 
  isAdmin = false, 
  onDeleteClick 
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [similarity, setSimilarity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [ratingValue, setRatingValue] = useState<number | null>(null);

  const handleSubmitAnswer = async () => {
    if (question.questionType === "rating") {
      if (ratingValue === null) {
        toast({
          title: "Tomt svar",
          description: "Vänligen välj ett värde på skalan",
          variant: "destructive",
        });
        return;
      }
      
      const correctValue = parseInt(question.answer);
      const isExactlyCorrect = ratingValue === correctValue;
      
      setIsCorrect(isExactlyCorrect);
      setIsSubmitted(true);
      setUserAnswer(ratingValue.toString());
      
      if (!isTeacher) {
        // Save answer to database if not in teacher mode
        await saveStudentAnswer(ratingValue.toString());
      }
      
      if (isExactlyCorrect) {
        toast({
          title: "Rätt svar!",
          description: "Du har valt exakt rätt värde!",
        });
      } else {
        toast({
          title: "Fel svar",
          description: `Rätt värde är: ${correctValue}`,
          variant: "destructive",
        });
      }
      
      return;
    }
    
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
        await saveStudentAnswer(userAnswer.trim());
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

  const saveStudentAnswer = async (answer: string) => {
    try {
      const { error } = await supabase
        .from('student_answers')
        .insert([
          { 
            question_id: question.id,
            student_name: studentName.trim(),
            answer: answer
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving student answer:', error);
      throw error;
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
    setRatingValue(null);
  };
  
  const renderRatingScale = () => {
    if (!question.ratingMin || !question.ratingMax) return null;
    
    const min = question.ratingMin;
    const max = question.ratingMax;
    
    return (
      <div className="space-y-4 mt-4">
        <div className="flex justify-between">
          <div className="flex items-center">
            <AlignLeft className="h-5 w-5 mr-1" />
            <span>{min}</span>
          </div>
          <div className="flex items-center">
            <span>{max}</span>
            <AlignRight className="h-5 w-5 ml-1" />
          </div>
        </div>
        
        <div 
          className="relative h-10 bg-muted rounded-md cursor-pointer"
          onClick={(e) => {
            if (isSubmitted) return;
            
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const newValue = Math.round(min + percentage * (max - min));
            setRatingValue(Math.max(min, Math.min(max, newValue)));
          }}
        >
          {/* Track */}
          <div className="absolute top-4 left-0 right-0 h-2 bg-gray-300 rounded-full"></div>
          
          {/* User's selected value handle */}
          {ratingValue !== null && (
            <div 
              className="absolute top-2 h-6 w-6 bg-primary rounded-full shadow transform -translate-x-1/2"
              style={{ 
                left: `${((ratingValue - min) / (max - min)) * 100}%` 
              }}
            ></div>
          )}
          
          {/* Correct value marker (only shown after submission) */}
          {isSubmitted && question.ratingCorrect !== undefined && (
            <div 
              className="absolute top-2 h-6 w-6 bg-green-500 rounded-full shadow-md transform -translate-x-1/2 flex items-center justify-center"
              style={{ 
                left: `${((parseInt(question.answer) - min) / (max - min)) * 100}%` 
              }}
            >
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        
        {ratingValue !== null && (
          <div className="text-center text-sm">
            Ditt val: <span className="font-semibold">{ratingValue}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            {isAdmin && !isTeacher && (
              <div className="bg-amber-100 px-2 py-1 rounded text-xs text-amber-800 mb-2 inline-block">
                Admin-läge
              </div>
            )}
            <p className="font-medium">{question.text}</p>
            {(isTeacher || isAdmin) && question.questionType !== "rating" && (
              <p className="text-sm text-muted-foreground mt-1">
                Svar: {question.answer}
              </p>
            )}
            {(isTeacher || isAdmin) && question.questionType === "rating" && (
              <p className="text-sm text-muted-foreground mt-1">
                Korrekt värde: {question.answer} (Min: {question.ratingMin}, Max: {question.ratingMax})
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
              <div className="space-y-4">
                {question.questionType === "rating" ? (
                  renderRatingScale()
                ) : (
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
                )}
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
              {question.questionType === "rating" ? (
                <>
                  {renderRatingScale()}
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">Resultat:</p>
                    {isCorrect ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span>Rätt värde</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-5 w-5 mr-1" />
                        <span>Fel värde</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">Ditt val:</p>
                    <p className="text-muted-foreground">{userAnswer}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">Korrekt värde:</p>
                    <p className="text-muted-foreground">{question.answer}</p>
                  </div>
                </>
              ) : (
                <>
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
                </>
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
      {(isTeacher || isAdmin) && onDeleteClick && (
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
