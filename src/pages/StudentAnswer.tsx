
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Question, QuestionType } from "@/types/question";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const StudentAnswer = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [ratingValue, setRatingValue] = useState(1);
  const [gridSelections, setGridSelections] = useState<Record<string, string>>({});
  const [studentName, setStudentName] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  
  // Simple captcha generation
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

        if (data) {
          const fetchedQuestion: Question = {
            id: data.id,
            text: data.text,
            answer: data.answer,
            createdAt: new Date(data.created_at),
            similarityThreshold: data.similarity_threshold || 0.7,
            semanticMatching: data.semantic_matching !== false,
            questionType: (data.question_type as QuestionType) || 'text',
            options: data.options,
            ratingMin: data.rating_min,
            ratingMax: data.rating_max,
            gridRows: data.grid_rows,
            gridColumns: data.grid_columns
          };
          
          setQuestion(fetchedQuestion);
          
          // Set initial rating value if applicable
          if (fetchedQuestion.questionType === 'rating' && fetchedQuestion.ratingMin !== undefined) {
            setRatingValue(fetchedQuestion.ratingMin);
          }
          
          console.log("Fetched question details:", {
            id: fetchedQuestion.id,
            type: fetchedQuestion.questionType,
            options: fetchedQuestion.options,
            ratingRange: `${fetchedQuestion.ratingMin}-${fetchedQuestion.ratingMax}`,
            gridData: {
              rows: fetchedQuestion.gridRows,
              columns: fetchedQuestion.gridColumns
            }
          });
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

  // Convert grid selections to string format for submission
  const gridSelectionsToString = () => {
    return Object.entries(gridSelections)
      .map(([row, col]) => `${row}:${col}`)
      .join(',');
  };

  // Handle grid cell selection
  const handleGridCellSelect = (row: string, col: string) => {
    setGridSelections(prev => ({
      ...prev,
      [row]: col
    }));
  };

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
    
    // Get answer based on question type
    let answer = "";
    
    switch (question.questionType) {
      case "multiple-choice":
        answer = selectedOption;
        break;
      case "rating":
        answer = ratingValue.toString();
        break;
      case "grid":
        answer = gridSelectionsToString();
        break;
      case "text":
      default:
        answer = textAnswer;
        break;
    }
    
    if (!answer.trim()) {
      toast({
        title: "Answer required",
        description: "Please provide an answer to the question.",
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
      setExpectedCaptchaAnswer(generateCaptcha());
      setCaptchaAnswer("");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Store the student answer in the database
      const { error } = await supabase
        .from('student_answers')
        .insert([
          { 
            question_id: question.id, 
            student_name: studentName,
            answer: answer
          }
        ]);

      if (error) throw error;
      
      toast({
        title: "Answer submitted!",
        description: "Your answer has been submitted successfully.",
      });
      
      // Redirect to a thank you page or show completion message
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

  // Render the appropriate input based on question type
  const renderQuestionInput = () => {
    if (!question) return null;

    switch (question.questionType) {
      case "multiple-choice":
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose an answer
            </label>
            <RadioGroup 
              value={selectedOption} 
              onValueChange={setSelectedOption}
              className="space-y-2"
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case "rating":
        const min = question.ratingMin !== undefined ? question.ratingMin : 1;
        const max = question.ratingMax !== undefined ? question.ratingMax : 5;
        
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              Your rating (from {min} to {max})
            </label>
            <div className="space-y-4">
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
                Selected value: {ratingValue}
              </div>
            </div>
          </div>
        );
      
      case "grid":
        if (!question.gridRows?.length || !question.gridColumns?.length) {
          return <p className="text-muted-foreground">Grid data is missing</p>;
        }
        
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              Match items by selecting cells in the grid
            </label>
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
            <div className="mt-2 text-sm text-muted-foreground">
              Your selections: {Object.entries(gridSelections).length > 0 ? 
                Object.entries(gridSelections)
                  .map(([row, col]) => `${row} → ${col}`)
                  .join(', ') : 
                "None"}
            </div>
          </div>
        );
        
      case "text":
      default:
        return (
          <div>
            <label htmlFor="answer" className="block text-sm font-medium mb-1">
              Your Answer
            </label>
            <Input
              id="answer"
              placeholder="Type your answer here"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={submitting}
            />
          </div>
        );
    }
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
              <h2 className="text-xl font-semibold mb-2">{question.text}</h2>
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
              
              {renderQuestionInput()}
              
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
