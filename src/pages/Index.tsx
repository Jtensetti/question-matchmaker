import { useState, useEffect } from "react";
import { Question } from "@/types/question";
import { QuestionCard } from "@/components/QuestionCard";
import { CreateQuestionForm } from "@/components/CreateQuestionForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isTeacher, setIsTeacher] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedQuestions: Question[] = data.map(q => ({
          id: q.id,
          text: q.text,
          answer: q.answer,
          createdAt: new Date(q.created_at)
        }));
        setQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (questionText: string, answerText: string) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([
          { text: questionText, answer: answerText }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newQuestion: Question = {
          id: data.id,
          text: data.text,
          answer: data.answer,
          createdAt: new Date(data.created_at)
        };
        
        setQuestions(prev => [newQuestion, ...prev]);
        
        toast({
          title: "Success",
          description: "Question created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkSemanticSimilarity = async (text1: string, text2: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a teacher evaluating student answers. Respond with "true" if the answers match semantically, and "false" if they don\'t. Only respond with true or false.'
            },
            {
              role: 'user',
              content: `Question: Compare these answers semantically:
              Teacher's answer: "${text1}"
              Student's answer: "${text2}"
              
              Are they semantically equivalent? Respond with only true or false.`
            }
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const result = data.choices[0].message.content.toLowerCase().includes('true');
      return result;
    } catch (error) {
      console.error('Error checking semantic similarity:', error);
      return false;
    }
  };

  const handleAnswerSubmit = async (questionId: string, studentAnswer: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    setIsChecking(true);
    try {
      const isCorrect = await checkSemanticSimilarity(
        question.answer,
        studentAnswer
      );

      toast({
        title: isCorrect ? "Correct!" : "Incorrect",
        description: isCorrect
          ? "Great job! Your answer is semantically correct!"
          : "Try again. Your answer doesn't match the expected meaning.",
        variant: isCorrect ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error checking your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Question Matchmaker</h1>
          <p className="text-lg text-muted-foreground">
            {isTeacher 
              ? "Create and manage your questions" 
              : "Answer questions and test your knowledge"}
          </p>
          <Button 
            variant="outline" 
            onClick={() => setIsTeacher(!isTeacher)}
            className="animate-fadeIn"
          >
            Switch to {isTeacher ? "Student" : "Teacher"} Mode
          </Button>
        </header>

        <main className="max-w-2xl mx-auto space-y-6">
          {isTeacher ? (
            <>
              <CreateQuestionForm onSubmit={handleCreateQuestion} />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Created Questions</h2>
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    isTeacher={true}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No questions available yet. Wait for your teacher to add some!
                </div>
              ) : (
                questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onAnswerSubmit={(answer) => handleAnswerSubmit(question.id, answer)}
                    isLoading={isChecking}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
