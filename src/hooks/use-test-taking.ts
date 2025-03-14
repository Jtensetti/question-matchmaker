
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Test, Question, QuestionAnswer, GridAnswer } from "@/types/question";

export const useTestTaking = (testId: string | undefined) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [answer, setAnswer] = useState<QuestionAnswer>("");
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
          
          // Fetch questions for this test - Updated to include all question fields
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
              options: tq.questions.options || [],
              gridRows: tq.questions.grid_rows || [],
              gridColumns: tq.questions.grid_columns || [],
              ratingMin: tq.questions.rating_min,
              ratingMax: tq.questions.rating_max
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

  // Initialize answer based on question type when changing questions
  useEffect(() => {
    const question = testQuestions[currentQuestionIndex];
    if (question) {
      switch (question.questionType) {
        case "rating":
          setAnswer(question.ratingMin || 1);
          break;
        case "grid":
          setAnswer({ row: "", column: "" });
          break;
        case "multiple-choice":
          setAnswer("");
          break;
        case "text":
        default:
          setAnswer("");
          break;
      }
    }
  }, [currentQuestionIndex, testQuestions]);

  const handleNameSubmit = () => {
    setNameEntered(true);
  };

  // Validate answer based on question type
  const validateAnswer = (question: Question): boolean => {
    if (question.questionType === "text" && typeof answer === "string" && !answer.trim()) {
      toast({
        title: "Answer required",
        description: "Please provide an answer to the question.",
        variant: "destructive",
      });
      return false;
    }

    switch (question.questionType) {
      case "rating":
        if (typeof answer !== "number") {
          toast({
            title: "Invalid rating",
            description: "Please select a valid rating.",
            variant: "destructive",
          });
          return false;
        }
        
        const min = question.ratingMin ?? 1;
        const max = question.ratingMax ?? 10;
        
        if (answer < min || answer > max) {
          toast({
            title: "Invalid rating",
            description: `Please select a rating between ${min} and ${max}.`,
            variant: "destructive",
          });
          return false;
        }
        break;
      
      case "grid":
        if (typeof answer !== "object" || !answer || !("row" in answer) || !("column" in answer)) {
          toast({
            title: "Incomplete selection",
            description: "Please select both a row and column.",
            variant: "destructive",
          });
          return false;
        }
        
        const gridAnswer = answer as GridAnswer;
        if (!gridAnswer.row || !gridAnswer.column) {
          toast({
            title: "Incomplete selection",
            description: "Please select both a row and column.",
            variant: "destructive",
          });
          return false;
        }
        break;
      
      case "multiple-choice":
        if (typeof answer !== "string" || !answer) {
          toast({
            title: "Invalid choice",
            description: "Please select one of the available options.",
            variant: "destructive",
          });
          return false;
        }
        
        if (!question.options?.includes(answer as string)) {
          toast({
            title: "Invalid choice",
            description: "Please select one of the available options.",
            variant: "destructive",
          });
          return false;
        }
        break;
    }

    return true;
  };

  const handleAnswerSubmit = async () => {
    if (!test || !testQuestions[currentQuestionIndex]) return;
    
    setSubmitting(true);
    
    try {
      // Convert the answer to string format for storage
      let stringifiedAnswer: string;
      
      if (typeof answer === "object") {
        stringifiedAnswer = JSON.stringify(answer);
      } else {
        stringifiedAnswer = String(answer);
      }
      
      // Store answer for final submission
      setAnswers(prev => [...prev, {
        questionId: testQuestions[currentQuestionIndex].id,
        answer: stringifiedAnswer
      }]);
      
      // Move to next question
      if (currentQuestionIndex < testQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Submit all answers to Supabase
        const allAnswers = [...answers, {
          questionId: testQuestions[currentQuestionIndex].id,
          answer: stringifiedAnswer
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

  return {
    loading,
    test,
    testQuestions,
    currentQuestionIndex,
    studentName,
    setStudentName,
    answer,
    setAnswer,
    nameEntered,
    setNameEntered,
    submitting,
    captchaAnswer,
    setCaptchaAnswer,
    captchaQuestion,
    expectedCaptchaAnswer,
    generateCaptcha,
    handleNameSubmit,
    handleAnswerSubmit,
    validateAnswer
  };
};
