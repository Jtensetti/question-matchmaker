
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Question, QuestionType } from "@/types/question";
import { TextAnswerInput } from "@/components/student-answer/TextAnswerInput";
import { MultipleChoiceInput } from "@/components/student-answer/MultipleChoiceInput";
import { RatingInput } from "@/components/student-answer/RatingInput";
import { GridInput } from "@/components/student-answer/GridInput";
import { CaptchaInput } from "@/components/student-answer/CaptchaInput";
import { LoadingState } from "@/components/student-answer/LoadingState";
import { QuestionNotFound } from "@/components/student-answer/QuestionNotFound";
import { generateCaptcha } from "@/components/student-answer/captchaUtils";
import { gridSelectionsToString } from "@/components/question-card/gridUtils";
import { StudentNameInput } from "@/components/question-card/StudentNameInput";

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
  const [expectedCaptchaAnswer, setExpectedCaptchaAnswer] = useState("");
  const [nameInputVisible, setNameInputVisible] = useState(false);
  
  useEffect(() => {
    const { question, answer } = generateCaptcha();
    setCaptchaQuestion(question);
    setExpectedCaptchaAnswer(answer);
  }, []);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) return;
      
      try {
        console.log("Fetching question with ID:", questionId);
        
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();

        if (error) {
          console.error('Supabase error when fetching question:', error);
          throw error;
        }

        if (data) {
          const questionType = data.question_type ?? 'text';
          
          const fetchedQuestion: Question = {
            id: data.id,
            text: data.text,
            answer: data.answer,
            createdAt: new Date(data.created_at),
            similarityThreshold: data.similarity_threshold ?? 0.7,
            semanticMatching: data.semantic_matching !== false,
            questionType: questionType as QuestionType,
            options: data.options,
            ratingMin: data.rating_min,
            ratingMax: data.rating_max,
            gridRows: data.grid_rows,
            gridColumns: data.grid_columns
          };
          
          setQuestion(fetchedQuestion);
          
          if (fetchedQuestion.questionType === 'rating' && fetchedQuestion.ratingMin !== undefined) {
            setRatingValue(fetchedQuestion.ratingMin);
          }
          
          if (fetchedQuestion.questionType === 'multiple-choice' && 
              Array.isArray(fetchedQuestion.options) && 
              fetchedQuestion.options.length > 0) {
            setSelectedOption(fetchedQuestion.options[0]);
          }
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
    
    let answer = "";
    
    switch (question.questionType) {
      case "multiple-choice":
        answer = selectedOption;
        break;
      case "rating":
        answer = ratingValue.toString();
        break;
      case "grid":
        answer = gridSelectionsToString(gridSelections);
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
      const { question, answer } = generateCaptcha();
      setCaptchaQuestion(question);
      setExpectedCaptchaAnswer(answer);
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
            answer: answer
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

    switch (question.questionType) {
      case "multiple-choice":
        return question.options ? (
          <MultipleChoiceInput
            options={question.options}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
          />
        ) : null;
      
      case "rating":
        const min = question.ratingMin !== undefined ? question.ratingMin : 1;
        const max = question.ratingMax !== undefined ? question.ratingMax : 5;
        
        return (
          <RatingInput
            min={min}
            max={max}
            ratingValue={ratingValue}
            setRatingValue={setRatingValue}
          />
        );
      
      case "grid":
        if (!question.gridRows?.length || !question.gridColumns?.length) {
          return <p className="text-muted-foreground">Grid data is missing</p>;
        }
        
        return (
          <GridInput
            gridRows={question.gridRows}
            gridColumns={question.gridColumns}
            gridSelections={gridSelections}
            handleGridCellSelect={handleGridCellSelect}
          />
        );
        
      case "text":
      default:
        return (
          <TextAnswerInput
            textAnswer={textAnswer}
            setTextAnswer={setTextAnswer}
            submitting={submitting}
          />
        );
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!question) {
    return <QuestionNotFound />;
  }

  const handleSaveName = () => {
    if (studentName.trim()) {
      setNameInputVisible(false);
    } else {
      toast({
        title: "Name required",
        description: "Please enter your name.",
        variant: "destructive",
      });
    }
  };

  const handleCancelName = () => {
    setNameInputVisible(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-2xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold">Answer this Question</h1>
            <div className="text-sm text-muted-foreground">
              Question type: <span className="font-medium">{question.questionType}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-md">
              <h2 className="text-xl font-semibold mb-2">{question.text}</h2>
            </div>
            
            <div className="space-y-4">
              {nameInputVisible ? (
                <StudentNameInput
                  studentName={studentName}
                  setStudentName={setStudentName}
                  onCancel={handleCancelName}
                  onSave={handleSaveName}
                />
              ) : (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Your Name
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      disabled={submitting}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
              
              {renderQuestionInput()}
              
              <CaptchaInput
                captchaQuestion={captchaQuestion}
                captchaAnswer={captchaAnswer}
                setCaptchaAnswer={setCaptchaAnswer}
                submitting={submitting}
              />
              
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
