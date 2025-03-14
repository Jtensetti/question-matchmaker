
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, AlignLeft, AlignRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Test, Question } from "@/types/question";
import { Progress } from "@/components/ui/progress";

const TestTaking = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [answer, setAnswer] = useState("");
  const [nameEntered, setNameEntered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [answers, setAnswers] = useState<{questionId: string, answer: string}[]>([]);
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
    const fetchTest = async () => {
      if (!testId) return;
      
      try {
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (testError) throw testError;

        if (testData) {
          const test: Test = {
            id: testData.id,
            title: testData.title,
            description: testData.description || undefined,
            createdAt: new Date(testData.created_at),
          };

          setTest(test);
          
          const { data: testQuestionsData, error: testQuestionsError } = await supabase
            .from('test_questions')
            .select(`
              id,
              test_id,
              question_id,
              position,
              questions:question_id (
                id,
                text,
                answer,
                created_at,
                similarity_threshold,
                semantic_matching,
                question_type,
                options,
                grid_rows,
                grid_columns,
                rating_min,
                rating_max
              )
            `)
            .eq('test_id', testId)
            .order('position', { ascending: true });

          if (testQuestionsError) throw testQuestionsError;

          if (testQuestionsData) {
            const questions: Question[] = testQuestionsData.map(tq => ({
              id: tq.questions.id,
              text: tq.questions.text,
              answer: tq.questions.answer,
              createdAt: new Date(tq.questions.created_at),
              similarityThreshold: tq.questions.similarity_threshold || 0.7,
              semanticMatching: tq.questions.semantic_matching !== false,
              questionType: tq.questions.question_type || 'text',
              options: tq.questions.options,
              gridRows: tq.questions.grid_rows,
              gridColumns: tq.questions.grid_columns,
              ratingMin: tq.questions.rating_min,
              ratingMax: tq.questions.rating_max,
              ratingCorrect: tq.questions.answer ? parseInt(tq.questions.answer) : undefined
            }));
            
            setTestQuestions(questions);
          }
        } else {
          toast({
            title: "Test not found",
            description: "The test you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast({
          title: "Error",
          description: "Failed to load the test. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId, navigate]);

  useEffect(() => {
    // Reset all answer inputs when question changes
    setAnswer("");
    setRatingValue(null);
    setSelectedOption("");
    setSelectedOptions([]);
    setGridAnswers({});
  }, [currentQuestionIndex]);

  const handleNameSubmit = () => {
    if (!studentName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to start the test.",
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
    
    setNameEntered(true);
  };

  const handleAnswerSubmit = async () => {
    if (!test || !testQuestions[currentQuestionIndex]) return;
    
    const currentQuestion = testQuestions[currentQuestionIndex];
    let answerToSubmit = "";
    
    // Validate and prepare answer based on question type
    switch (currentQuestion.questionType) {
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
        // text questions
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
    
    setSubmitting(true);
    
    try {
      setAnswers(prev => [...prev, {
        questionId: currentQuestion.id,
        answer: answerToSubmit
      }]);
      
      moveToNextOrComplete(answerToSubmit);
    } catch (error) {
      handleSubmissionError(error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const moveToNextOrComplete = (currentAnswer: string) => {
    if (currentQuestionIndex < testQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitAllAnswers(currentAnswer);
    }
  };
  
  const submitAllAnswers = async (finalAnswer: string) => {
    if (!test) return;
    
    const allAnswers = [...answers, {
      questionId: testQuestions[currentQuestionIndex].id,
      answer: finalAnswer
    }];
    
    try {
      for (const ans of allAnswers) {
        const { error } = await supabase
          .from('student_answers')
          .insert([
            { 
              question_id: ans.questionId, 
              test_id: test.id,
              student_name: studentName,
              answer: ans.answer
            }
          ]);

        if (error) throw error;
      }
      
      toast({
        title: "Test completed!",
        description: "All your answers have been submitted successfully.",
      });
      
      navigate(`/test-thank-you/${test.id}`);
    } catch (error) {
      handleSubmissionError(error);
    }
  };
  
  const handleSubmissionError = (error: any) => {
    console.error('Error submitting answer:', error);
    toast({
      title: "Error",
      description: "Failed to submit your answer. Please try again.",
      variant: "destructive",
    });
  };
  
  const renderQuestionInput = () => {
    if (!testQuestions[currentQuestionIndex]) return null;
    
    const currentQuestion = testQuestions[currentQuestionIndex];
    
    switch (currentQuestion.questionType) {
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
        return (
          <Input
            id="answer"
            placeholder="Type your answer here"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitting}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAnswerSubmit();
              }
            }}
          />
        );
    }
  };
  
  const renderRatingScale = () => {
    const currentQuestion = testQuestions[currentQuestionIndex];
    if (!currentQuestion?.ratingMin || !currentQuestion?.ratingMax) return null;
    
    const min = currentQuestion.ratingMin;
    const max = currentQuestion.ratingMax;
    const step = 1;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <div className="flex items-center">
            <AlignLeft className="h-4 w-4 mr-1" />
            <span>{min}</span>
          </div>
          <div className="flex items-center">
            <span>{max}</span>
            <AlignRight className="h-4 w-4 ml-1" />
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
    const currentQuestion = testQuestions[currentQuestionIndex];
    if (!currentQuestion?.options || currentQuestion.options.length === 0) return null;
    
    return (
      <RadioGroup 
        value={selectedOption} 
        onValueChange={setSelectedOption}
        className="space-y-2"
      >
        {currentQuestion.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`option-${index}`} />
            <label htmlFor={`option-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {option}
            </label>
          </div>
        ))}
      </RadioGroup>
    );
  };
  
  const renderCheckboxes = () => {
    const currentQuestion = testQuestions[currentQuestionIndex];
    if (!currentQuestion?.options || currentQuestion.options.length === 0) return null;
    
    return (
      <div className="space-y-2">
        {currentQuestion.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
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
            />
            <label
              htmlFor={`checkbox-${index}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
    );
  };
  
  const renderGrid = () => {
    const currentQuestion = testQuestions[currentQuestionIndex];
    if (!currentQuestion?.gridRows || !currentQuestion?.gridColumns || 
        currentQuestion.gridRows.length === 0 || currentQuestion.gridColumns.length === 0) {
      return null;
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 border"></th>
              {currentQuestion.gridColumns.map((col, colIndex) => (
                <th key={colIndex} className="p-2 border bg-muted font-medium text-sm">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentQuestion.gridRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="p-2 border bg-muted font-medium text-sm">
                  {row}
                </td>
                {currentQuestion.gridColumns?.map((col, colIndex) => {
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
          <p className="text-lg text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test || testQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Test Not Found</h2>
              <p className="text-muted-foreground">
                The test you're looking for doesn't exist or has no questions.
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

  if (!nameEntered) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-2xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <h1 className="text-2xl font-bold">{test.title}</h1>
              {test.description && (
                <p className="text-muted-foreground">{test.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-4">This test has {testQuestions.length} questions. Please enter your name to begin.</p>
                
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
                    />
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
                    />
                  </div>
                  
                  <Button 
                    onClick={handleNameSubmit} 
                    className="w-full"
                  >
                    Start Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = testQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-2xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{test.title}</h1>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {testQuestions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-md">
              <h2 className="text-xl font-semibold mb-2">{currentQuestion.text}</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium mb-1">
                  Your Answer
                </label>
                
                {renderQuestionInput()}
              </div>
              
              <Button 
                onClick={handleAnswerSubmit} 
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : currentQuestionIndex < testQuestions.length - 1 ? (
                  "Next Question"
                ) : (
                  "Complete Test"
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full text-center text-sm text-muted-foreground">
              Taking test as: <span className="font-medium">{studentName}</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TestTaking;
