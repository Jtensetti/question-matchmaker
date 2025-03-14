
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
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
  
  // Simple captcha generation
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
        // Fetch test data
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
            teacherId: testData.teacher_id
          };

          setTest(test);
          
          // Fetch questions for this test
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
                semantic_matching
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
              semanticMatching: tq.questions.semantic_matching !== false
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
    
    if (!answer.trim()) {
      toast({
        title: "Answer required",
        description: "Please provide an answer to the question.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Store answer for final submission
      setAnswers(prev => [...prev, {
        questionId: testQuestions[currentQuestionIndex].id,
        answer: answer.trim()
      }]);
      
      // Move to next question
      if (currentQuestionIndex < testQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswer("");
      } else {
        // Submit all answers to Supabase
        const allAnswers = [...answers, {
          questionId: testQuestions[currentQuestionIndex].id,
          answer: answer.trim()
        }];
        
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
        
        // Redirect to thank you page
        navigate(`/test-thank-you/${test.id}`);
      }
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
                <Input
                  id="answer"
                  placeholder="Type your answer here"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={submitting}
                />
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
