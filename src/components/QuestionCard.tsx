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
  AlignRight,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkSemanticMatch, checkAnswerCorrectAsync } from "@/utils/semanticMatching";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [gridAnswers, setGridAnswers] = useState<Record<string, string>>({});

  const questionType = typeof question.questionType === 'object' 
    ? (question.questionType as any)?.value || 'text' 
    : question.questionType || 'text';

  console.log("Question in QuestionCard with fixed type:", {
    id: question.id,
    text: question.text,
    questionType,
    options: question.options,
    ratingMin: question.ratingMin,
    ratingMax: question.ratingMax,
    gridRows: question.gridRows,
    gridColumns: question.gridColumns
  });

  const handleSubmitAnswer = async () => {
    if (questionType === "rating") {
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
    
    if (questionType === "multiple-choice") {
      if (!selectedOption) {
        toast({
          title: "Tomt svar",
          description: "Vänligen välj ett alternativ",
          variant: "destructive",
        });
        return;
      }
      
      const isExactlyCorrect = selectedOption === question.answer;
      
      setIsCorrect(isExactlyCorrect);
      setIsSubmitted(true);
      setUserAnswer(selectedOption);
      
      if (!isTeacher) {
        await saveStudentAnswer(selectedOption);
      }
      
      if (isExactlyCorrect) {
        toast({
          title: "Rätt svar!",
          description: "Du har valt rätt alternativ!",
        });
      } else {
        toast({
          title: "Fel svar",
          description: `Rätt alternativ är: ${question.answer}`,
          variant: "destructive",
        });
      }
      
      return;
    }
    
    if (questionType === "checkbox") {
      if (selectedOptions.length === 0) {
        toast({
          title: "Tomt svar",
          description: "Vänligen välj minst ett alternativ",
          variant: "destructive",
        });
        return;
      }
      
      const correctOptions = question.answer.split(",").map(opt => opt.trim());
      const correctCount = selectedOptions.filter(opt => correctOptions.includes(opt)).length;
      const isExactlyCorrect = 
        correctCount === correctOptions.length && 
        selectedOptions.length === correctOptions.length;
      
      setIsCorrect(isExactlyCorrect);
      setIsSubmitted(true);
      setUserAnswer(selectedOptions.join(", "));
      
      if (!isTeacher) {
        await saveStudentAnswer(JSON.stringify(selectedOptions));
      }
      
      if (isExactlyCorrect) {
        toast({
          title: "Rätt svar!",
          description: "Du har valt alla rätt alternativ!",
        });
      } else {
        toast({
          title: "Fel svar",
          description: `Rätt alternativ är: ${question.answer}`,
          variant: "destructive",
        });
      }
      
      return;
    }
    
    if (questionType === "grid") {
      if (Object.keys(gridAnswers).length === 0) {
        toast({
          title: "Tomt svar",
          description: "Vänligen fyll i minst en cell i tabellen",
          variant: "destructive",
        });
        return;
      }
      
      const answerString = JSON.stringify(gridAnswers);
      setIsCorrect(false);
      setIsSubmitted(true);
      setUserAnswer(answerString);
      
      if (!isTeacher) {
        await saveStudentAnswer(answerString);
      }
      
      toast({
        title: "Svar inlämnat",
        description: "Din lärare kommer att bedöma ditt svar",
      });
      
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
      const threshold = question.similarityThreshold || 0.7;
      
      const calculatedSimilarity = await checkSemanticMatch(
        userAnswer.trim(),
        question.answer.trim(),
        threshold
      );
      
      setSimilarity(calculatedSimilarity);
      
      const correct = calculatedSimilarity >= threshold;
      
      setIsCorrect(correct);
      setIsSubmitted(true);

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
    setSelectedOption("");
    setSelectedOptions([]);
    setGridAnswers({});
  };
  
  const renderRatingScale = () => {
    if (!question.ratingMin || !question.ratingMax) {
      console.log("Missing rating configuration:", { ratingMin: question.ratingMin, ratingMax: question.ratingMax });
      
      return (
        <div className="space-y-2 mt-4 p-3 border border-amber-300 bg-amber-50 rounded-md">
          <div className="flex items-center gap-2 text-amber-600">
            <Info className="h-4 w-4" />
            <p className="text-sm">Denna frågetyp saknar korrekt konfiguration.</p>
          </div>
          <Input
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Ditt svar..."
            disabled={isSubmitted}
          />
        </div>
      );
    }
    
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
        
        {isSubmitted ? (
          <div className="relative h-10">
            <div className="absolute top-4 left-0 right-0 h-2 bg-gray-300 rounded-full"></div>
            
            <div 
              className="absolute top-2 h-6 w-6 bg-primary rounded-full shadow transform -translate-x-1/2"
              style={{ 
                left: `${((parseInt(userAnswer) - min) / (max - min)) * 100}%` 
              }}
            ></div>
            
            <div 
              className="absolute top-2 h-6 w-6 bg-green-500 rounded-full shadow-md transform -translate-x-1/2 flex items-center justify-center"
              style={{ 
                left: `${((parseInt(question.answer) - min) / (max - min)) * 100}%` 
              }}
            >
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        ) : (
          <Slider
            defaultValue={[min]}
            min={min}
            max={max}
            step={1}
            value={ratingValue !== null ? [ratingValue] : [min]}
            onValueChange={(value) => setRatingValue(value[0])}
            disabled={isSubmitted}
          />
        )}
        
        {ratingValue !== null && !isSubmitted && (
          <div className="text-center text-sm">
            Ditt val: <span className="font-semibold">{ratingValue}</span>
          </div>
        )}
      </div>
    );
  };
  
  const renderMultipleChoice = () => {
    if (!question.options || question.options.length === 0) {
      console.log("Missing multiple choice options:", question.options);
      
      return (
        <div className="space-y-2 mt-4 p-3 border border-amber-300 bg-amber-50 rounded-md">
          <div className="flex items-center gap-2 text-amber-600">
            <Info className="h-4 w-4" />
            <p className="text-sm">Denna flervalsfråga saknar alternativ.</p>
          </div>
          <Input
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Ditt svar..."
            disabled={isSubmitted}
          />
        </div>
      );
    }
    
    return (
      <RadioGroup 
        value={selectedOption} 
        onValueChange={setSelectedOption}
        className="space-y-2 mt-4"
        disabled={isSubmitted}
      >
        {question.options.map((option, index) => (
          <div key={index} className={`flex items-center space-x-2 p-2 rounded-md ${
            isSubmitted && option === question.answer ? "bg-green-100" : 
            isSubmitted && option === selectedOption && option !== question.answer ? "bg-red-100" : ""
          }`}>
            <RadioGroupItem value={option} id={`option-${index}`} disabled={isSubmitted} />
            <label htmlFor={`option-${index}`} className="text-sm font-medium leading-none cursor-pointer">
              {option}
              {isSubmitted && option === question.answer && (
                <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-600" />
              )}
            </label>
          </div>
        ))}
      </RadioGroup>
    );
  };
  
  const renderCheckboxes = () => {
    if (!question.options || question.options.length === 0) {
      console.log("Missing checkbox options:", question.options);
      
      return (
        <div className="space-y-2 mt-4 p-3 border border-amber-300 bg-amber-50 rounded-md">
          <div className="flex items-center gap-2 text-amber-600">
            <Info className="h-4 w-4" />
            <p className="text-sm">Denna kryssrutsfråga saknar alternativ.</p>
          </div>
          <Input
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Ditt svar..."
            disabled={isSubmitted}
          />
        </div>
      );
    }
    
    const correctOptions = question.answer.split(",").map(opt => opt.trim());
    
    return (
      <div className="space-y-2 mt-4">
        {question.options.map((option, index) => (
          <div key={index} className={`flex items-center space-x-2 p-2 rounded-md ${
            isSubmitted && correctOptions.includes(option) ? "bg-green-100" : 
            isSubmitted && selectedOptions.includes(option) && !correctOptions.includes(option) ? "bg-red-100" : ""
          }`}>
            <Checkbox 
              id={`checkbox-${index}`} 
              checked={selectedOptions.includes(option)}
              onCheckedChange={(checked) => {
                if (isSubmitted) return;
                
                if (checked) {
                  setSelectedOptions(prev => [...prev, option]);
                } else {
                  setSelectedOptions(prev => prev.filter(item => item !== option));
                }
              }}
              disabled={isSubmitted}
            />
            <label
              htmlFor={`checkbox-${index}`}
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {option}
              {isSubmitted && correctOptions.includes(option) && (
                <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-600" />
              )}
            </label>
          </div>
        ))}
      </div>
    );
  };
  
  const renderGrid = () => {
    if (!question.gridRows || !question.gridColumns || 
        question.gridRows.length === 0 || question.gridColumns.length === 0) {
      
      console.log("Missing grid configuration:", { 
        gridRows: question.gridRows, 
        gridColumns: question.gridColumns 
      });
      
      return (
        <div className="space-y-2 mt-4 p-3 border border-amber-300 bg-amber-50 rounded-md">
          <div className="flex items-center gap-2 text-amber-600">
            <Info className="h-4 w-4" />
            <p className="text-sm">Denna rutnätsfråga saknar korrekt konfiguration.</p>
          </div>
          <Input
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Ditt svar..."
            disabled={isSubmitted}
          />
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 border"></th>
              {question.gridColumns.map((col, colIndex) => (
                <th key={colIndex} className="p-2 border bg-muted font-medium text-sm">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {question.gridRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="p-2 border bg-muted font-medium text-sm">
                  {row}
                </td>
                {question.gridColumns?.map((col, colIndex) => {
                  const cellId = `${row}-${col}`;
                  return (
                    <td key={cellId} className="p-2 border">
                      <Input
                        className="w-full"
                        value={gridAnswers[cellId] || ''}
                        onChange={(e) => {
                          if (isSubmitted) return;
                          setGridAnswers(prev => ({
                            ...prev,
                            [cellId]: e.target.value
                          }));
                        }}
                        disabled={isSubmitted}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderFillinBlanks = () => {
    if (questionType !== "text") return null;
    
    const blankRegex = /___+|\[\.\.\.+\]/g;
    if (!blankRegex.test(question.text)) return null;
    
    const parts = question.text.split(blankRegex);
    const blanks = question.text.match(blankRegex) || [];
    
    return (
      <div className="mt-4">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < blanks.length && (
              <Input
                className="inline-block mx-1 w-32"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isSubmitted}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderQuestionInput = () => {
    switch (questionType) {
      case "rating":
        return renderRatingScale();
      case "multiple-choice":
        return renderMultipleChoice();
      case "checkbox":
        return renderCheckboxes();
      case "grid":
        return renderGrid();
      case "text":
      default:
        const fillinBlanks = renderFillinBlanks();
        if (fillinBlanks) return fillinBlanks;
        
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
            disabled={isSubmitted}
          />
        );
    }
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
            {(isTeacher || isAdmin) && questionType !== "rating" && (
              <p className="text-sm text-muted-foreground mt-1">
                Svar: {question.answer}
              </p>
            )}
            {(isTeacher || isAdmin) && questionType === "rating" && (
              <p className="text-sm text-muted-foreground mt-1">
                Korrekt värde: {question.answer} (Min: {question.ratingMin}, Max: {question.ratingMax})
              </p>
            )}
            
            {(isTeacher || isAdmin) && (
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <span className="mr-2">Frågetyp: {questionType || "text"}</span>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Info className="h-3.5 w-3.5 inline cursor-help text-muted-foreground/70" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] p-4">
                      <p className="font-semibold mb-1">Frågedetaljer:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>ID: {question.id}</li>
                        <li>Typ: {questionType || "text"}</li>
                        {question.options && <li>Alternativ: {question.options.join(", ")}</li>}
                        {question.ratingMin && <li>Min: {question.ratingMin}</li>}
                        {question.ratingMax && <li>Max: {question.ratingMax}</li>}
                        {question.gridRows && <li>Rader: {question.gridRows.length}</li>}
                        {question.gridColumns && <li>Kolumner: {question.gridColumns.length}</li>}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          
          {renderQuestionInput()}
          
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
              <div className="space-y-4 mt-4">
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
            <div className="space-y-4 mt-4">
              {questionType === "text" && !renderFillinBlanks() && (
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
              
              {(questionType === "multiple-choice" || 
                questionType === "checkbox" || 
                questionType === "rating") && (
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
