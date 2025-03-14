
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question } from "@/types/question";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkSemanticMatch } from "@/utils/semanticMatching";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

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

  // Process grid selections into a string format compatible with the answer format
  const gridSelectionsToString = () => {
    return Object.entries(gridSelections)
      .map(([row, col]) => `${row}:${col}`)
      .join(',');
  };

  const handleSubmitAnswer = async () => {
    // Set answer based on question type
    let answerToCheck = userAnswer;
    
    if (question.questionType === "multiple-choice") {
      answerToCheck = selectedRadioOption;
    } else if (question.questionType === "rating") {
      answerToCheck = ratingValue.toString();
    } else if (question.questionType === "grid") {
      answerToCheck = gridSelectionsToString();
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

  // Handler for selecting a cell in the grid
  const handleGridCellSelect = (row: string, col: string) => {
    setGridSelections(prev => ({
      ...prev,
      [row]: col
    }));
  };

  // Render the appropriate input based on question type
  const renderQuestionInput = () => {
    if (isSubmitted) {
      return null;
    }

    if (showNameInput) {
      return (
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
      );
    }

    switch (question.questionType) {
      case "multiple-choice":
        return (
          <RadioGroup 
            value={selectedRadioOption} 
            onValueChange={setSelectedRadioOption}
            className="space-y-2"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case "rating":
        const min = question.ratingMin !== undefined ? question.ratingMin : 1;
        const max = question.ratingMax !== undefined ? question.ratingMax : 5;
        
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{min}</span>
              <span>{max}</span>
            </div>
            <Slider
              value={[ratingValue]}
              min={min}
              max={max}
              step={1}
              onValueChange={(values) => setRatingValue(values[0])}
            />
            <div className="text-center font-medium mt-2">
              Valt värde: {ratingValue}
            </div>
          </div>
        );
      
      case "grid":
        if (!question.gridRows?.length || !question.gridColumns?.length) {
          return <p className="text-muted-foreground">Rutnätsmatchning saknar data</p>;
        }
        
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]"></TableHead>
                  {question.gridColumns.map((col, colIndex) => (
                    <TableHead key={colIndex} className="text-center">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {question.gridRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="font-medium">{row}</TableCell>
                    {question.gridColumns?.map((col, colIndex) => (
                      <TableCell key={colIndex} className="text-center p-2">
                        <div 
                          className={`h-6 w-6 rounded-full mx-auto cursor-pointer border ${
                            gridSelections[row] === col 
                              ? 'bg-primary border-primary' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => handleGridCellSelect(row, col)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
        
      case "text":
      default:
        return (
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
        );
    }
  };

  // Render the submitted answer info
  const renderSubmittedAnswer = () => {
    if (!isSubmitted) {
      return null;
    }

    let displayedAnswer = "";
    
    if (question.questionType === "multiple-choice") {
      displayedAnswer = selectedRadioOption;
    } else if (question.questionType === "rating") {
      displayedAnswer = ratingValue.toString();
    } else if (question.questionType === "grid") {
      displayedAnswer = Object.entries(gridSelections)
        .map(([row, col]) => `${row} → ${col}`)
        .join(', ');
    } else {
      displayedAnswer = userAnswer;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <p className="font-medium">Ditt svar:</p>
          <p className="text-muted-foreground">{displayedAnswer}</p>
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
            {(isTeacher || isAdmin) && (
              <div className="text-sm text-muted-foreground mt-1">
                <p>Svar: {question.answer}</p>
                <p>Typ: {question.questionType || "text"}</p>
              </div>
            )}
          </div>
          
          {!isSubmitted ? (
            <div className="space-y-2">
              {renderQuestionInput()}
              {!showNameInput && (
                <Button 
                  onClick={handleSubmitAnswer} 
                  className="w-full mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Kontrollerar...' : 'Svara'}
                </Button>
              )}
            </div>
          ) : (
            renderSubmittedAnswer()
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
