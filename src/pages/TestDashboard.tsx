
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, ArrowLeft, Download, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Test, Question, StudentAnswer } from "@/types/question";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { isAnswerCorrect } from "@/utils/semanticMatching";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudentData {
  name: string;
  totalAnswers: number;
  correctAnswers: number;
  percentCorrect: number;
  answers: StudentAnswer[];
}

interface QuestionData {
  question: Question;
  totalAnswers: number;
  correctAnswers: number;
  percentCorrect: number;
}

const TestDashboard = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [questionData, setQuestionData] = useState<QuestionData[]>([]);
  
  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) return;
      
      try {
        // Fetch the test
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (testError) throw testError;

        if (testData) {
          const testObj: Test = {
            id: testData.id,
            title: testData.title,
            description: testData.description || undefined,
            createdAt: new Date(testData.created_at),
          };
          setTest(testObj);
          
          // Fetch questions for this test
          const { data: testQuestionsData, error: questionsError } = await supabase
            .from('test_questions')
            .select(`
              id,
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

          if (questionsError) throw questionsError;

          if (testQuestionsData) {
            const questionsArray: Question[] = testQuestionsData.map(tq => ({
              id: tq.questions.id,
              text: tq.questions.text,
              answer: tq.questions.answer,
              createdAt: new Date(tq.questions.created_at),
              similarityThreshold: tq.questions.similarity_threshold || 0.7,
              semanticMatching: tq.questions.semantic_matching !== false
            }));
            
            setQuestions(questionsArray);
            
            // Fetch all student answers for this test
            const { data: answersData, error: answersError } = await supabase
              .from('student_answers')
              .select('*')
              .eq('test_id', testId)
              .order('submitted_at', { ascending: false });

            if (answersError) throw answersError;

            if (answersData) {
              // Process the answers and determine if they're correct
              const processedAnswers: StudentAnswer[] = [];
              
              for (const ans of answersData) {
                const question = questionsArray.find(q => q.id === ans.question_id);
                
                if (question) {
                  const isCorrect = isAnswerCorrect(
                    ans.answer, 
                    question.answer, 
                    question.similarityThreshold || 0.7,
                    question.semanticMatching !== false
                  );
                  
                  processedAnswers.push({
                    id: ans.id,
                    questionId: ans.question_id,
                    testId: ans.test_id,
                    studentName: ans.student_name,
                    answer: ans.answer,
                    submittedAt: new Date(ans.submitted_at),
                    isCorrect
                  });
                }
              }
              
              setStudentAnswers(processedAnswers);
              
              // Process data for student-based view
              const studentMap = new Map<string, StudentData>();
              
              for (const ans of processedAnswers) {
                if (!studentMap.has(ans.studentName)) {
                  studentMap.set(ans.studentName, {
                    name: ans.studentName,
                    totalAnswers: 0,
                    correctAnswers: 0,
                    percentCorrect: 0,
                    answers: []
                  });
                }
                
                const studentInfo = studentMap.get(ans.studentName)!;
                studentInfo.totalAnswers++;
                if (ans.isCorrect) studentInfo.correctAnswers++;
                studentInfo.answers.push(ans);
                studentInfo.percentCorrect = Math.round((studentInfo.correctAnswers / studentInfo.totalAnswers) * 100);
              }
              
              setStudentData(Array.from(studentMap.values()));
              
              // Process data for question-based view
              const questionStats: QuestionData[] = questionsArray.map(question => {
                const questionAnswers = processedAnswers.filter(a => a.questionId === question.id);
                const totalAnswers = questionAnswers.length;
                const correctAnswers = questionAnswers.filter(a => a.isCorrect).length;
                const percentCorrect = totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
                
                return {
                  question,
                  totalAnswers,
                  correctAnswers,
                  percentCorrect
                };
              });
              
              setQuestionData(questionStats);
            }
          }
        } else {
          toast({
            title: "Test not found",
            description: "The test dashboard you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load the dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId, navigate]);

  const exportToCSV = () => {
    if (!test || !studentAnswers.length) return;
    
    // Create CSV content
    const headers = ['Student Name', 'Question', 'Answer', 'Correct?', 'Submitted At'];
    const rows = studentAnswers.map(ans => {
      const question = questions.find(q => q.id === ans.questionId);
      return [
        ans.studentName,
        question ? question.text : 'Unknown Question',
        ans.answer,
        ans.isCorrect ? 'Yes' : 'No',
        new Date(ans.submittedAt).toLocaleString()
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up and trigger download
    link.setAttribute('href', url);
    link.setAttribute('download', `test-responses-${test.title.substring(0, 20)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Dashboard Not Found</h2>
              <p className="text-muted-foreground">
                The test dashboard you're looking for doesn't exist.
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

  // Calculate overall statistics
  const totalResponses = studentAnswers.length;
  const correctResponses = studentAnswers.filter(a => a.isCorrect).length;
  const percentCorrect = totalResponses ? Math.round((correctResponses / totalResponses) * 100) : 0;
  const totalStudents = new Set(studentAnswers.map(a => a.studentName)).size;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          {studentAnswers.length > 0 && (
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">Test Dashboard: {test.title}</h1>
            {test.description && (
              <p className="text-muted-foreground">{test.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold">{totalStudents}</h3>
                    <p className="text-sm text-muted-foreground">Students</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold">{totalResponses}</h3>
                    <p className="text-sm text-muted-foreground">Total Answers</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold">{correctResponses}</h3>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold">{percentCorrect}%</h3>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {studentAnswers.length > 0 ? (
              <Tabs defaultValue="students">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="students">
                    <User className="h-4 w-4 mr-2" />
                    By Student
                  </TabsTrigger>
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="students" className="mt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Questions Answered</TableHead>
                          <TableHead>Correct</TableHead>
                          <TableHead>Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentData.map((student) => (
                          <TableRow key={student.name}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.totalAnswers}</TableCell>
                            <TableCell>{student.correctAnswers}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.percentCorrect >= 70
                                  ? 'bg-green-100 text-green-800' 
                                  : student.percentCorrect >= 40
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student.percentCorrect}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="questions" className="mt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Expected Answer</TableHead>
                          <TableHead>Responses</TableHead>
                          <TableHead>Success Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questionData.map((qData) => (
                          <TableRow key={qData.question.id}>
                            <TableCell className="font-medium">{qData.question.text}</TableCell>
                            <TableCell>{qData.question.answer}</TableCell>
                            <TableCell>{qData.totalAnswers}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                qData.percentCorrect >= 70
                                  ? 'bg-green-100 text-green-800' 
                                  : qData.percentCorrect >= 40
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {qData.percentCorrect}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-md">
                No responses yet. Share the test link with your students to collect answers.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestDashboard;
