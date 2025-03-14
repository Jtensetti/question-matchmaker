import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, AlignLeft, AlignRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/question";
import React from "react";
import { normalizeQuestionType } from "@/utils/questionTypeHelper";

const StudentAnswer = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [studentName, setStudentName] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [gridAnswers, setGridAnswers] = useState<Record<string, string>>({});
  
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    setCaptchaQuestion(`What is ${num1} + ${num2}?`);
    return (num1 + num2).toString();
  };
  
  const [expectedCaptchaAnswer, setExpectedCaptchaAnswer] = useState(() => generateCaptcha());

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) return;
      
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();

        if (error) throw error;

        console.log("Question data from DB:", data);

        if (data) {
          // Get raw question type first for debugging
          const rawQuestionType = data.question_type;
          console.log("Raw question type from DB:", rawQuestionType);
          
          // Normalize the question type
          const normalizedType = normalizeQuestionType(data.question_type);
          console.log("Normalized question type:", normalizedType);
          
          // Include more detailed debugging
          if (typeof data.question_type === 'object') {
            console.log("Question type is an object - examining properties:");
            Object.keys(data.question_type).forEach(key => {
              console.log(`- ${key}: ${JSON.stringify(data.question_type[key])}`);
            });
          }
          
          // Properly convert database fields to our Question type
          const questionData: Question = {
            id: data.id,
            text: data.text,
            answer: data.answer,
            createdAt: new Date(data.created_at),
            similarityThreshold: data.similarity_threshold || 0.7,
            semanticMatching: data.semantic_matching !== false,
            questionType: normalizedType, // Use normalized type
            options: Array.isArray(data.options) ? data.options : [],
            gridRows: Array.isArray(data.grid_rows) ? data.grid_rows : [],
            gridColumns: Array.isArray(data.grid_columns) ? data.grid_columns : [],
            ratingMin: typeof data.rating_min === 'number' ? data.rating_min : undefined,
            ratingMax: typeof data.rating_max === 'number' ? data.rating_max : undefined,
            ratingCorrect: data.answer ? parseInt(data.answer) : undefined
          };
          
          setQuestion(questionData);
          
          console.log("Converted question object:", questionData);
        } else {
          toast({
            title: "Question not found",
            description: "The question you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching question:', error);
        toast({
          title: "Error",
          description: "Failed to load the question. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId, navigate]);

  const handleSubmit = async () => {
    if (!question) return;
    
    if (!studentName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to submit your answer.",
        variant: "destructive",
      });
      return;
    }
    
    let answerToSubmit = "";
    
    switch (question.questionType) {
      case "rating":
        if (ratingValue === null) {
          toast({
            title: "Answer required",
            description: "Please select a value on the scale.",
            variant: "destructive",
          });
          return;
        }
        answerToSubmit = ratingValue.toString();
        break;
        
      case "multiple-choice":
        if (!selectedOption) {
          toast({
            title: "Answer required",
            description: "Please select an option.",
            variant: "destructive",
          });
          return;
        }
        answerToSubmit = selectedOption;
        break;
        
      case "checkbox":
        if (selectedOptions.length === 0) {
          toast({
            title: "Answer required",
            description: "Please select at least one option.",
            variant: "destructive",
          });
          return;
        }
        answerToSubmit = JSON.stringify(selectedOptions);
        break;
        
      case "grid":
        if (Object.keys(gridAnswers).length === 0) {
          toast({
            title: "Answer required",
            description: "Please fill in at least one grid cell.",
            variant: "destructive",
          });
          return;
        }
        answerToSubmit = JSON.stringify(gridAnswers);
        break;
        
      default:
        if (!answer.trim()) {
          toast({
            title: "Answer required",
            description: "Please provide an answer to the question.",
            variant: "destructive",
          });
          return;
        }
        answerToSubmit = answer;
    }
    
    if (captchaAnswer !== expectedCaptchaAnswer) {
      toast({
        title: "Incorrect captcha",
        description: "Please solve the math problem correctly.",
        variant: "destructive",
      });
      setExpectedCaptchaAnswer(generateCaptcha());
      setCaptchaAnswer("");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('student_answers')
        .insert([
          { 
            question_id: question.id, 
            student_name: studentName,
            answer: answerToSubmit
          }
        ]);

      if (error) throw error;
      
      toast({
        title: "Answer submitted!",
        description: "Your answer has been submitted successfully.",
      });
      
      navigate(`/thank-you/${question.id}`);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderQuestionInput = () => {
    if (!question) return null;
    
    // Get the normalized question type and log it again for debugging
    const questionType = normalizeQuestionType(question.questionType);
    
    console.log("Rendering input for question type:", questionType, {
      originalQuestionType: question.questionType,
      options: question.options,
      hasGridRows: Boolean(question.gridRows),
      hasGridColumns: Boolean(question.gridColumns),
      ratingMin: question.ratingMin,
      ratingMax: question.ratingMax
    });
    
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
        const blankRegex = /___+|\[\.\.\.+\]/g;
        if (blankRegex.test(question.text)) {
          return renderFillInBlanks();
        }
        return (
          <Textarea
            id="answer"
            placeholder="Type your answer here"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-24"
            disabled={submitting}
          />
        );
    }
  };
  
  const renderFillInBlanks = () => {
    const blankRegex = /___+|\[\.\.\.+\]/g;
    const parts = question!.text.split(blankRegex);
    const blanks = question!.text.match(blankRegex) || [];
    
    return (
      <div className="mt-2 space-y-1">
        <p className="mb-4 text-sm text-muted-foreground">Fill in the blanks:</p>
        <div>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <span>{part}</span>
              {index < blanks.length && (
                <Input
                  className="inline-block mx-1 w-32"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={submitting}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  const renderRatingScale = () => {
    if (!question?.ratingMin || !question?.ratingMax) {
      console.error("Missing rating min/max:", question);
      return (
        <div className="p-4 bg-red-100 rounded-md">
          <p>This question is missing rating scale information.</p>
        </div>
      );
    }
    
    const min = question.ratingMin;
    const max = question.ratingMax;
    const step = 1;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <AlignLeft className="h-4 w-4" />
            <span>{min}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{max}</span>
            <AlignRight className="h-4 w-4" />
          </div>
        </div>
        
        <Slider
          defaultValue={[min]}
          min={min}
          max={max}
          step={step}
          onValueChange={(value) => setRatingValue(value[0])}
          disabled={submitting}
        />
        
        {ratingValue !== null && (
          <div className="text-center mt-2">
            Your selection: <span className="font-semibold">{ratingValue}</span>
          </div>
        )}
      </div>
    );
  };
  
  const renderMultipleChoice = () => {
    if (!question?.options || question.options.length === 0) {
      console.error("Missing options for multiple choice:", question);
      return (
        <div className="p-4 bg-red-100 rounded-md">
          <p>This multiple choice question is missing options.</p>
        </div>
      );
    }
    
    return (
      <RadioGroup 
        value={selectedOption} 
        onValueChange={setSelectedOption}
        className="space-y-3"
      >
        {question.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
            <RadioGroupItem value={option} id={`option-${index}`} disabled={submitting} />
            <label htmlFor={`option-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">
              {option}
            </label>
          </div>
        ))}
      </RadioGroup>
    );
  };
  
  const renderCheckboxes = () => {
    if (!question?.options || question.options.length === 0) {
      console.error("Missing options for checkbox:", question);
      return (
        <div className="p-4 bg-red-100 rounded-md">
          <p>This checkbox question is missing options.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
            <Checkbox 
              id={`checkbox-${index}`} 
              checked={selectedOptions.includes(option)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedOptions(prev => [...prev, option]);
                } else {
                  setSelectedOptions(prev => prev.filter(item => item !== option));
                }
              }}
              disabled={submitting}
            />
            <label
              htmlFor={`checkbox-${index}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
    );
  };
  
  const renderGrid = () => {
    if (!question?.gridRows || !question?.gridColumns || 
        question.gridRows.length === 0 || question.gridColumns.length === 0) {
      console.error("Missing grid rows/columns:", question);
      return (
        <div className="p-4 bg-red-100 rounded-md">
          <p>This grid question is missing grid configuration.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
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
                {question.gridColumns.map((col, colIndex) => {
                  const cellId = `${row}-${col}`;
                  return (
                    <td key={cellId} className="p-2 border">
                      <Input
                        className="w-full"
                        value={gridAnswers[cellId] || ''}
                        onChange={(e) => {
                          setGridAnswers(prev => ({
                            ...prev,
                            [cellId]: e.target.value
                          }));
                        }}
                        disabled={submitting}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Question Not Found</h2>
              <p className="text-muted-foreground">
                The question you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/')}>
                Go Back Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-2xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold">Answer this Question</h1>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-md">
              <h2 className="text-xl font-semibold mb-2">{question?.text}</h2>
            </div>
            
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
                  disabled={submitting}
                />
              </div>
              
              <div>
                <label htmlFor="answer" className="block text-sm font-medium mb-1">
                  Your Answer
                </label>
                {renderQuestionInput()}
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
                  disabled={submitting}
                />
              </div>
              
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Answer"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnswer;
