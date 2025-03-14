import { useState } from "react";
import { Test, Question } from "@/types/question";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Share2, ExternalLink, Copy, ChevronDown, ChevronUp, Edit, Save, X, Trash2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
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

interface TestCardProps {
  test: Test;
  questions: Question[];
  onUpdate: (updatedTest: Test) => void;
  onDelete?: (testId: string) => void;
  isAdmin?: boolean;
}

export const TestCard = ({ test, questions, onUpdate, onDelete, isAdmin = false }: TestCardProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(test.title);
  const [description, setDescription] = useState(test.description || "");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    test.questions?.map(q => q.id) || []
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate an absolute URL for the test
  const shareLink = `${window.location.origin}/test/${test.id}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Länk kopierad!",
      description: "Dela denna länk med dina elever",
    });
  };

  const questionsCount = test.questions?.length || 0;
  const isCreatedByOtherTeacher = isAdmin && test.teacherId !== undefined;

  const handleSaveEdit = async () => {
    if (!title.trim()) {
      toast({
        title: "Fel",
        description: "Ange en titel för testet",
        variant: "destructive",
      });
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast({
        title: "Fel",
        description: "Välj minst en fråga för testet",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Update test info
      const { error: testError } = await supabase
        .from('tests')
        .update({
          title: title.trim(),
          description: description.trim() || null
        })
        .eq('id', test.id);

      if (testError) throw testError;

      // Delete existing test questions
      const { error: deleteError } = await supabase
        .from('test_questions')
        .delete()
        .eq('test_id', test.id);

      if (deleteError) throw deleteError;

      // Add new test questions
      const testQuestions = selectedQuestionIds.map((questionId, index) => ({
        test_id: test.id,
        question_id: questionId,
        position: index
      }));

      const { error: insertError } = await supabase
        .from('test_questions')
        .insert(testQuestions);

      if (insertError) throw insertError;

      // Get selected questions
      const selectedQuestions = questions.filter(q => 
        selectedQuestionIds.includes(q.id)
      );

      // Create updated test object
      const updatedTest: Test = {
        ...test,
        title: title.trim(),
        description: description.trim() || undefined,
        questions: selectedQuestions
      };

      // Update state
      onUpdate(updatedTest);
      setIsEditing(false);

      toast({
        title: "Framgång",
        description: "Testet har uppdaterats",
      });
    } catch (error) {
      console.error('Error updating test:', error);
      toast({
        title: "Fel",
        description: "Det gick inte att uppdatera testet. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    
    try {
      // First delete all test questions
      const { error: testQuestionsError } = await supabase
        .from('test_questions')
        .delete()
        .eq('test_id', test.id);
        
      if (testQuestionsError) throw testQuestionsError;
      
      // Then delete test answers
      const { error: answersError } = await supabase
        .from('student_answers')
        .delete()
        .eq('test_id', test.id);
        
      if (answersError) throw answersError;
      
      // Finally delete the test itself
      const { error: testError } = await supabase
        .from('tests')
        .delete()
        .eq('id', test.id);
        
      if (testError) throw testError;
      
      // Notify parent component
      onDelete(test.id);
      
      toast({
        title: "Framgång",
        description: "Testet har raderats",
      });
      
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({
        title: "Fel",
        description: "Det gick inte att radera testet. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <>
      <Card className="w-full animate-fadeIn">
        {isEditing ? (
          <>
            <CardHeader className="pb-2">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Testtitel
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="T.ex. Naturkunskap Quiz - Vecka 3"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Beskrivning (valfri)
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Lägg till instruktioner eller detaljer om detta test"
                  rows={2}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Välj frågor för detta test
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                  {questions.map((question) => (
                    <div key={question.id} className="flex items-start space-x-2 p-2 hover:bg-muted rounded-md">
                      <Checkbox
                        id={`question-edit-${question.id}`}
                        checked={selectedQuestionIds.includes(question.id)}
                        onCheckedChange={() => toggleQuestionSelection(question.id)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={`question-edit-${question.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {question.text}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Svar: {question.answer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-2" />
                Avbryt
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveEdit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara ändringar
                  </>
                )}
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  {isCreatedByOtherTeacher && (
                    <div className="bg-amber-100 px-2 py-1 rounded text-xs text-amber-800 mb-2 inline-block flex items-center">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Admin-visning
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{test.title}</h3>
                  {test.description && (
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <span className="font-medium">{questionsCount}</span> frågor
                <span className="text-muted-foreground"> · Skapad den {new Date(test.createdAt).toLocaleDateString('sv-SE')}</span>
              </div>
              
              {test.questions && test.questions.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowQuestions(!showQuestions)}
                    className="flex items-center w-full justify-between"
                  >
                    {showQuestions ? "Dölj" : "Visa"} frågor
                    {showQuestions ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </Button>
                  
                  {showQuestions && (
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                      {test.questions.map((question, index) => (
                        <div key={question.id} className="p-2 border rounded-md bg-muted/30">
                          <p className="text-sm font-medium">
                            F{index + 1}: {question.text}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Svar: {question.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Dela med elever
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm"
                  onClick={() => window.open(`/test-dashboard/${test.id}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visa resultat
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Redigera
                </Button>
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Radera
                  </Button>
                )}
              </div>
            </CardFooter>
          </>
        )}
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dela test med elever</DialogTitle>
            <DialogDescription>
              Elever kan använda denna länk för att svara på alla frågor i detta test utan att behöva logga in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <Input value={shareLink} readOnly />
              <Button variant="outline" size="icon" onClick={copyShareLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Elever kommer att svara på varje fråga i sekvens. 
              Du kan se alla svar på testets resultatsida.
            </div>
            <Button 
              className="w-full" 
              variant="default" 
              onClick={() => window.open(`/test-dashboard/${test.id}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visa testresultat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker på att du vill radera detta test?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Detta kommer att permanent radera testet 
              "{test.title}" och alla relaterade svar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTest();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Raderar...
                </>
              ) : (
                "Radera test"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
