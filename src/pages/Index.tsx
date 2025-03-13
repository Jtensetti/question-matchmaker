
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
import { PlusCircle, Loader2, FileQuestion, BookOpen, Lock, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showDeleteQuestionDialog, setShowDeleteQuestionDialog] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const TEACHER_PASSWORD = "teacher123";
  const ADMIN_PASSWORD = "admin456";

  useEffect(() => {
    fetchQuestions();
    fetchTests();
  }, [isAdmin, teacherId]);

  const fetchQuestions = async () => {
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!isAdmin && teacherId) {
        // Regular teachers only see their own questions
        query = query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const formattedQuestions: Question[] = data.map(q => ({
          id: q.id,
          text: q.text,
          answer: q.answer,
          createdAt: new Date(q.created_at),
          similarityThreshold: q.similarity_threshold || 0.7,
          semanticMatching: q.semantic_matching !== false,
          teacherId: q.teacher_id
        }));
        
        // For admin, store all questions
        if (isAdmin) {
          setAllQuestions(formattedQuestions);
        }
        
        // Set the questions to display
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
      let query = supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!isAdmin && teacherId) {
        // Regular teachers only see their own tests
        query = query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const basicTests: Test[] = data.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          createdAt: new Date(t.created_at),
          teacherId: t.teacher_id
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
                  semantic_matching,
                  teacher_id
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
                semanticMatching: tq.questions.semantic_matching !== false,
                teacherId: tq.questions.teacher_id
              }));
              
              return { ...test, questions };
            }
            
            return test;
          })
        );
        
        // For admin, store all tests
        if (isAdmin) {
          setAllTests(testsWithQuestions);
        }
        
        // Set the tests to display
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
            semantic_matching: semanticMatching,
            teacher_id: teacherId
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
          semanticMatching: data.semantic_matching,
          teacherId: data.teacher_id
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
            description: newTestData.description,
            teacher_id: teacherId
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
          questions: selectedQuestions,
          teacherId: createdTestData.teacher_id
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
    
    // If admin, also update the allTests array
    if (isAdmin) {
      setAllTests(prev => 
        prev.map(test => test.id === updatedTest.id ? updatedTest : test)
      );
    }
  };

  const handleDeleteTest = (testId: string) => {
    setTests(prev => prev.filter(test => test.id !== testId));
    
    // If admin, also update the allTests array
    if (isAdmin) {
      setAllTests(prev => prev.filter(test => test.id !== testId));
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setIsDeletingQuestion(true);
    
    try {
      const { data: testQuestionsData, error: testQuestionsError } = await supabase
        .from('test_questions')
        .select('test_id')
        .eq('question_id', questionId);
        
      if (testQuestionsError) throw testQuestionsError;
      
      if (testQuestionsData && testQuestionsData.length > 0) {
        toast({
          title: "Kan inte radera",
          description: "Denna fråga används i ett eller flera tester. Ta bort frågan från testerna först.",
          variant: "destructive",
        });
        return;
      }
      
      const { error: answersError } = await supabase
        .from('student_answers')
        .delete()
        .eq('question_id', questionId);
        
      if (answersError) throw answersError;
      
      const { error: questionError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);
        
      if (questionError) throw questionError;
      
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      
      // If admin, also update the allQuestions array
      if (isAdmin) {
        setAllQuestions(prev => prev.filter(q => q.id !== questionId));
      }
      
      toast({
        title: "Framgång",
        description: "Frågan har raderats",
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Fel",
        description: "Det gick inte att radera frågan. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingQuestion(false);
      setShowDeleteQuestionDialog(false);
      setSelectedQuestionId(null);
    }
  };

  const confirmDeleteQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setShowDeleteQuestionDialog(true);
  };

  const handleTeacherModeAccess = () => {
    setShowTeacherDialog(true);
  };

  const handleAdminModeAccess = () => {
    setShowAdminDialog(true);
  };

  const checkTeacherPassword = () => {
    setIsCheckingPassword(true);
    setTimeout(() => {
      if (teacherPassword === TEACHER_PASSWORD) {
        // Generate a pseudo teacher ID (would be from auth in a real app)
        const generatedTeacherId = Math.random().toString(36).substring(2, 15);
        setTeacherId(generatedTeacherId);
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

  const checkAdminPassword = () => {
    setIsCheckingPassword(true);
    setTimeout(() => {
      if (adminPassword === ADMIN_PASSWORD) {
        setIsAdmin(true);
        setIsTeacher(true);
        setShowAdminDialog(false);
        // Admin sees everything, so no teacher ID filter
        setTeacherId(null);
        toast({
          title: "Framgång",
          description: "Administratörsläge aktiverat",
        });
      } else {
        toast({
          title: "Fel lösenord",
          description: "Lösenordet du angav är felaktigt",
          variant: "destructive",
        });
      }
      setAdminPassword("");
      setIsCheckingPassword(false);
    }, 500);
  };

  const toggleAdminMode = () => {
    if (isAdmin) {
      setIsAdmin(false);
      // Generate a pseudo teacher ID to switch back to regular teacher mode
      const generatedTeacherId = Math.random().toString(36).substring(2, 15);
      setTeacherId(generatedTeacherId);
      toast({
        title: "Läge ändrat",
        description: "Administratörsläge inaktiverat. Du är nu i lärarläge.",
      });
    } else {
      handleAdminModeAccess();
    }
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
            {isAdmin 
              ? "Administrera alla lärares frågor och tester"
              : isTeacher 
                ? "Skapa och hantera dina frågor och tester" 
                : "Svara på frågor och testa dina kunskaper"}
          </p>
          <div className="flex justify-center space-x-2">
            {isTeacher ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsTeacher(false)}
                  className="animate-fadeIn"
                >
                  Byt till elevläge
                </Button>
                {isAdmin ? (
                  <Button 
                    variant="outline" 
                    onClick={toggleAdminMode}
                    className="animate-fadeIn bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Inaktivera admin-läge
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleAdminModeAccess}
                    className="animate-fadeIn"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Aktivera admin-läge
                  </Button>
                )}
              </>
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
          </div>
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
                  {isAdmin && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4">
                      <h3 className="font-medium text-amber-800 flex items-center">
                        <ShieldCheck className="h-5 w-5 mr-2" />
                        Administratörsläge aktivt
                      </h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Du kan nu se och hantera alla lärares tester.
                      </p>
                    </div>
                  )}
                  
                  {showCreateTest ? (
                    <>
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Skapa nytt test</h2>
                      </div>
                      <CreateTestForm 
                        onSubmit={handleCreateTest} 
                        questions={questions}
                        onCancel={() => setShowCreateTest(false)}
                        onQuestionCreated={(newQuestion) => {
                          setQuestions(prev => [newQuestion, ...prev]);
                        }}
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
                            onDelete={handleDeleteTest}
                            isAdmin={isAdmin}
                          />
                        ))
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="questions" className="mt-6 space-y-4">
                  {isAdmin && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4">
                      <h3 className="font-medium text-amber-800 flex items-center">
                        <ShieldCheck className="h-5 w-5 mr-2" />
                        Administratörsläge aktivt
                      </h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Du kan nu se och hantera alla lärares frågor.
                      </p>
                    </div>
                  )}
                  
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
                          isAdmin={isAdmin}
                          onDeleteClick={() => confirmDeleteQuestion(question.id)}
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

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administratörsläge</DialogTitle>
            <DialogDescription>
              Ange administratörslösenordet för att få tillgång till alla lärares frågor och tester
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Administratörslösenord"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    checkAdminPassword();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={checkAdminPassword}
              disabled={isCheckingPassword}
              className="bg-amber-600 hover:bg-amber-700"
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

      <AlertDialog open={showDeleteQuestionDialog} onOpenChange={setShowDeleteQuestionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker på att du vill radera denna fråga?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Detta kommer att permanent radera frågan 
              och alla relaterade svar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                if (selectedQuestionId) {
                  handleDeleteQuestion(selectedQuestionId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingQuestion}
            >
              {isDeletingQuestion ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Raderar...
                </>
              ) : (
                "Radera fråga"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
