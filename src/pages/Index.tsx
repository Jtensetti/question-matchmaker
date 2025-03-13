import { useState, useEffect } from "react";
import { Question, Test } from "@/types/question";
import { QuestionCard } from "@/components/QuestionCard";
import { CreateQuestionForm } from "@/components/CreateQuestionForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateTestForm } from "@/components/CreateTestForm";
import { TestCard } from "@/components/TestCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Loader2, FileQuestion, BookOpen, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [isTeacher, setIsTeacher] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState("");
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  const TEACHER_PASSWORD = "teacher123";

  useEffect(() => {
    fetchQuestions();
    fetchTests();
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
          createdAt: new Date(q.created_at),
          similarityThreshold: q.similarity_threshold || 0.7,
          semanticMatching: q.semantic_matching !== false
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

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const basicTests: Test[] = data.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          createdAt: new Date(t.created_at)
        }));
        
        const testsWithQuestions = await Promise.all(
          basicTests.map(async (test) => {
            const { data: testQuestionsData, error: testQuestionsError } = await supabase
              .from('test_questions')
              .select(`
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
              .eq('test_id', test.id)
              .order('position', { ascending: true });
            
            if (testQuestionsError) {
              console.error('Error fetching test questions:', testQuestionsError);
              return test;
            }
            
            if (testQuestionsData && testQuestionsData.length > 0) {
              const questions: Question[] = testQuestionsData.map(tq => ({
                id: tq.questions.id,
                text: tq.questions.text,
                answer: tq.questions.answer,
                createdAt: new Date(tq.questions.created_at),
                similarityThreshold: tq.questions.similarity_threshold || 0.7,
                semanticMatching: tq.questions.semantic_matching !== false
              }));
              
              return { ...test, questions };
            }
            
            return test;
          })
        );
        
        setTests(testsWithQuestions);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast({
        title: "Error",
        description: "Failed to load tests. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateQuestion = async (
    questionText: string, 
    answerText: string, 
    similarityThreshold: number,
    semanticMatching: boolean
  ) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([
          { 
            text: questionText, 
            answer: answerText,
            similarity_threshold: similarityThreshold,
            semantic_matching: semanticMatching
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newQuestion: Question = {
          id: data.id,
          text: data.text,
          answer: data.answer,
          createdAt: new Date(data.created_at),
          similarityThreshold: data.similarity_threshold,
          semanticMatching: data.semantic_matching
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

  const handleCreateTest = async (
    newTestData: Omit<Test, "id" | "createdAt">,
    selectedQuestionIds: string[]
  ) => {
    try {
      const { data: createdTestData, error: testError } = await supabase
        .from('tests')
        .insert([
          { 
            title: newTestData.title,
            description: newTestData.description
          }
        ])
        .select()
        .single();

      if (testError) throw testError;

      if (createdTestData) {
        const testQuestions = selectedQuestionIds.map((questionId, index) => ({
          test_id: createdTestData.id,
          question_id: questionId,
          position: index
        }));

        const { error: testQuestionsError } = await supabase
          .from('test_questions')
          .insert(testQuestions);

        if (testQuestionsError) throw testQuestionsError;

        const selectedQuestions = questions.filter(q => 
          selectedQuestionIds.includes(q.id)
        );

        const newTest: Test = {
          id: createdTestData.id,
          title: createdTestData.title,
          description: createdTestData.description || undefined,
          createdAt: new Date(createdTestData.created_at),
          questions: selectedQuestions
        };
        
        setTests(prev => [newTest, ...prev]);
        setShowCreateTest(false);
        
        toast({
          title: "Success",
          description: "Test created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating test:', error);
      toast({
        title: "Error",
        description: "Failed to create test. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTest = (updatedTest: Test) => {
    setTests(prev => 
      prev.map(test => test.id === updatedTest.id ? updatedTest : test)
    );
  };

  const handleTeacherModeAccess = () => {
    setShowTeacherDialog(true);
  };

  const checkTeacherPassword = () => {
    setIsCheckingPassword(true);
    setTimeout(() => {
      if (teacherPassword === TEACHER_PASSWORD) {
        setIsTeacher(true);
        setShowTeacherDialog(false);
        toast({
          title: "Framgång",
          description: "Lärarläge aktiverat",
        });
      } else {
        toast({
          title: "Fel lösenord",
          description: "Lösenordet du angav är felaktigt",
          variant: "destructive",
        });
      }
      setTeacherPassword("");
      setIsCheckingPassword(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Frågematcharen</h1>
          <p className="text-lg text-muted-foreground">
            {isTeacher 
              ? "Skapa och hantera dina frågor och tester" 
              : "Svara på frågor och testa dina kunskaper"}
          </p>
          {isTeacher ? (
            <Button 
              variant="outline" 
              onClick={() => setIsTeacher(false)}
              className="animate-fadeIn"
            >
              Byt till elevläge
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleTeacherModeAccess}
              className="animate-fadeIn"
            >
              <Lock className="h-4 w-4 mr-2" />
              Lärarläge
            </Button>
          )}
        </header>

        <main className="max-w-3xl mx-auto space-y-6">
          {isTeacher ? (
            <>
              <Tabs defaultValue="tests" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tests">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Tester
                  </TabsTrigger>
                  <TabsTrigger value="questions">
                    <FileQuestion className="h-4 w-4 mr-2" />
                    Frågor
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="tests" className="mt-6 space-y-4">
                  {showCreateTest ? (
                    <>
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Skapa nytt test</h2>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowCreateTest(false)}
                        >
                          Avbryt
                        </Button>
                      </div>
                      <CreateTestForm 
                        onSubmit={handleCreateTest} 
                        questions={questions} 
                      />
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Tester</h2>
                      <Button 
                        onClick={() => setShowCreateTest(true)}
                        size="sm"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Skapa test
                      </Button>
                    </div>
                  )}
                  
                  {!showCreateTest && (
                    <div className="space-y-4">
                      {tests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-md">
                          Inga tester skapade ännu. Klicka på knappen ovan för att skapa ditt första test!
                        </div>
                      ) : (
                        tests.map((test) => (
                          <TestCard 
                            key={test.id} 
                            test={test} 
                            questions={questions}
                            onUpdate={handleUpdateTest}
                          />
                        ))
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="questions" className="mt-6 space-y-4">
                  <CreateQuestionForm onSubmit={handleCreateQuestion} />
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Skapade frågor</h2>
                    {questions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border rounded-md">
                        Inga frågor skapade ännu. Använd formuläret ovan för att skapa din första fråga!
                      </div>
                    ) : (
                      questions.map((question) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          isTeacher={true}
                        />
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tillgängliga tester</h2>
              {tests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Inga tester tillgängliga ännu. Vänta på att din lärare lägger till några!
                </div>
              ) : (
                <div className="space-y-4">
                  {tests.map((test) => (
                    <Card key={test.id} className="w-full">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold">{test.title}</h3>
                            {test.description && (
                              <p className="text-sm text-muted-foreground">{test.description}</p>
                            )}
                            <p className="text-sm mt-2">
                              <span className="font-medium">{test.questions?.length || 0}</span> frågor
                            </p>
                          </div>
                          <Button 
                            onClick={() => window.open(`/test/${test.id}`, "_blank")}
                            className="w-full"
                          >
                            Starta test
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <h2 className="text-xl font-semibold mt-8">Individuella frågor</h2>
              {questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Inga frågor tillgängliga ännu. Vänta på att din lärare lägger till några!
                </div>
              ) : (
                questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <Dialog open={showTeacherDialog} onOpenChange={setShowTeacherDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lärarläge</DialogTitle>
            <DialogDescription>
              Ange lösenordet för att komma åt lärarläget
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Lösenord"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    checkTeacherPassword();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={checkTeacherPassword}
              disabled={isCheckingPassword}
            >
              {isCheckingPassword ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Kontrollerar...
                </>
              ) : (
                "Fortsätt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
