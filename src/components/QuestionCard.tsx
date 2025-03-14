
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question } from "@/types/question";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkSemanticMatch } from "@/utils/semanticMatching";
import { QuestionInput } from "@/components/question-card/QuestionInput";
import { StudentNameInput } from "@/components/question-card/StudentNameInput";
import { AnswerResults } from "@/components/question-card/AnswerResults";
import { gridSelectionsToString } from "@/components/question-card/gridUtils";

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
  const [selectedRadioOption, setSelectedRadioOption] = useState("");
  const [ratingValue, setRatingValue] = useState<number>(
    question.ratingMin !== undefined ? question.ratingMin : 1
  );
  const [gridSelections, setGridSelections] = useState<Record<string, string>>({});

  const handleGridCellSelect = (row: string, col: string) => {
    setGridSelections(prev => ({
      ...prev,
      [row]: col
    }));
  };

  const handleSubmitAnswer = async () => {
    // Set answer based on question type
    let answerToCheck = userAnswer;
    
    if (question.questionType === "multiple-choice") {
      answerToCheck = selectedRadioOption;
    } else if (question.questionType === "rating") {
      answerToCheck = ratingValue.toString();
    } else if (question.questionType === "grid") {
      answerToCheck = gridSelectionsToString(gridSelections);
    }
    
    if (!answerToCheck.trim()) {
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
      let calculatedSimilarity = 0;
      let correct = false;
      
      // For text questions, use semantic matching
      if (question.questionType === "text" || !question.questionType) {
        const threshold = question.similarityThreshold || 0.7;
        
        calculatedSimilarity = await checkSemanticMatch(
          answerToCheck.trim(),
          question.answer.trim(),
          threshold
        );
        
        correct = calculatedSimilarity >= threshold;
      } 
      // For multiple choice, exact match is required
      else if (question.questionType === "multiple-choice") {
        correct = answerToCheck === question.answer;
        calculatedSimilarity = correct ? 1 : 0;
      }
      // For rating questions, exact match is required
      else if (question.questionType === "rating") {
        correct = answerToCheck === question.answer;
        calculatedSimilarity = correct ? 1 : 0;
      }
      // For grid questions, compare the sets of matches
      else if (question.questionType === "grid") {
        // Convert both to sets of matches for comparison
        const expectedMatches = new Set(question.answer.split(',').map(pair => pair.trim()));
        const userMatches = new Set(answerToCheck.split(',').map(pair => pair.trim()));
        
        // Count matches
        let matchCount = 0;
        for (const match of userMatches) {
          if (expectedMatches.has(match)) {
            matchCount++;
          }
        }
        
        // Calculate similarity as proportion of correct matches
        const totalExpected = expectedMatches.size;
        calculatedSimilarity = totalExpected > 0 ? matchCount / totalExpected : 0;
        
        // Correct if all expected matches are present
        correct = matchCount === totalExpected;
      }
      
      setSimilarity(calculatedSimilarity);
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
              answer: answerToCheck.trim()
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
    setSelectedRadioOption("");
    setRatingValue(question.ratingMin !== undefined ? question.ratingMin : 1);
    setGridSelections({});
    setIsSubmitted(false);
    setIsCorrect(null);
    setSimilarity(0);
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
            {(isTeacher || isAdmin) && (
              <div className="text-sm text-muted-foreground mt-1">
                <p>Svar: {question.answer}</p>
                <p>Typ: {question.questionType || "text"}</p>
              </div>
            )}
          </div>
          
          {!isSubmitted ? (
            <div className="space-y-2">
              {showNameInput ? (
                <StudentNameInput
                  studentName={studentName}
                  setStudentName={setStudentName}
                  onCancel={() => setShowNameInput(false)}
                  onSave={handleSaveStudent}
                />
              ) : (
                <>
                  <QuestionInput
                    question={question}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                    selectedRadioOption={selectedRadioOption}
                    setSelectedRadioOption={setSelectedRadioOption}
                    ratingValue={ratingValue}
                    setRatingValue={setRatingValue}
                    gridSelections={gridSelections}
                    handleGridCellSelect={handleGridCellSelect}
                    onSubmit={handleSubmitAnswer}
                  />
                  <Button 
                    onClick={handleSubmitAnswer} 
                    className="w-full mt-4"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Kontrollerar...' : 'Svara'}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <AnswerResults
              question={question}
              userAnswer={userAnswer}
              selectedRadioOption={selectedRadioOption}
              ratingValue={ratingValue}
              gridSelections={gridSelections}
              isCorrect={isCorrect}
              similarity={similarity}
              onReset={resetQuestion}
            />
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
