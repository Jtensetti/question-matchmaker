
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, AlignLeft, AlignRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/question";

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
          setQuestion({
            id: data.id,
            text: data.text,
            answer: data.answer,
            createdAt: new Date(data.created_at),
            similarityThreshold: data.similarity_threshold || 0.7,
            semanticMatching: data.semantic_matching !== false,
            questionType: data.question_type,
            ratingMin: data.rating_min,
            ratingMax: data.rating_max,
            ratingCorrect: parseInt(data.answer)
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
    
    // For rating question type
    if (question.questionType === "rating") {
      if (ratingValue === null) {
        toast({
          title: "Answer required",
          description: "Please select a value on the scale.",
          variant: "destructive",
        });
        return;
      }
    } else if (!answer.trim()) {
      // For other question types
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
            answer: question.questionType === "rating" 
              ? ratingValue!.toString() 
              : answer
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
  
  const renderRatingScale = () => {
    if (!question?.ratingMin || !question?.ratingMax) return null;
    
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
        </div>
        
        {ratingValue !== null && (
          <div className="text-center text-sm">
            Your selection: <span className="font-semibold">{ratingValue}</span>
          </div>
        )}
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
              
              <div>
                <label htmlFor="answer" className="block text-sm font-medium mb-1">
                  Your Answer
                </label>
                
                {question.questionType === "rating" ? (
                  renderRatingScale()
                ) : (
                  <Input
                    id="answer"
                    placeholder="Type your answer here"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={submitting}
                  />
                )}
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
