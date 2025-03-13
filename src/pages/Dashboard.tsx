
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/question";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { isAnswerCorrect } from "@/utils/semanticMatching";

interface StudentAnswer {
  id: string;
  question_id: string;
  student_name: string;
  answer: string;
  submitted_at: string;
  is_correct?: boolean;
}

const Dashboard = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  
  useEffect(() => {
    const fetchQuestionAndAnswers = async () => {
      if (!questionId) return;
      
      try {
        // Fetch the question
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();

        if (questionError) throw questionError;

        if (questionData) {
          const questionObj: Question = {
            id: questionData.id,
            text: questionData.text,
            answer: questionData.answer,
            createdAt: new Date(questionData.created_at),
            similarityThreshold: questionData.similarity_threshold || 0.7,
            semanticMatching: questionData.semantic_matching !== false
          };
          setQuestion(questionObj);
          
          // Fetch all student answers for this question
          const { data: answersData, error: answersError } = await supabase
            .from('student_answers')
            .select('*')
            .eq('question_id', questionId)
            .order('submitted_at', { ascending: false });

          if (answersError) throw answersError;

          if (answersData) {
            // Process the answers and determine if they're correct
            const processedAnswers = answersData.map((ans) => {
              const isCorrect = isAnswerCorrect(
                ans.answer, 
                questionObj.answer, 
                questionObj.similarityThreshold || 0.7,
                questionObj.semanticMatching !== false
              );
              
              return {
                ...ans,
                is_correct: isCorrect
              };
            });
            
            setAnswers(processedAnswers);
          }
        } else {
          toast({
            title: "Question not found",
            description: "The dashboard you're looking for doesn't exist.",
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

    fetchQuestionAndAnswers();
  }, [questionId, navigate]);

  const exportToCSV = () => {
    if (!question || !answers.length) return;
    
    // Create CSV content
    const headers = ['Student Name', 'Answer', 'Submitted At', 'Correct?'];
    const rows = answers.map(ans => [
      ans.student_name,
      ans.answer,
      new Date(ans.submitted_at).toLocaleString(),
      ans.is_correct ? 'Yes' : 'No'
    ]);
    
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
    link.setAttribute('download', `responses-${question.text.substring(0, 20)}.csv`);
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

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Dashboard Not Found</h2>
              <p className="text-muted-foreground">
                The question dashboard you're looking for doesn't exist.
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

  // Calculate statistics
  const totalResponses = answers.length;
  const correctResponses = answers.filter(a => a.is_correct).length;
  const percentCorrect = totalResponses ? Math.round((correctResponses / totalResponses) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
          
          {answers.length > 0 && (
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">Dashboard: {question.text}</h1>
            <p className="text-muted-foreground">
              Correct Answer: {question.answer}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold">{totalResponses}</h3>
                    <p className="text-sm text-muted-foreground">Total Responses</p>
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
            
            {answers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Correct</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {answers.map((ans) => (
                      <TableRow key={ans.id}>
                        <TableCell className="font-medium">{ans.student_name}</TableCell>
                        <TableCell>{ans.answer}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ans.submitted_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ans.is_correct 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {ans.is_correct ? 'Yes' : 'No'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-md">
                No responses yet. Share the link with your students to collect answers.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
