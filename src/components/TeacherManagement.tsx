
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, UserPlus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Teacher {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_active: boolean;
}

export const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showEditTeacher, setShowEditTeacher] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
  // Form states
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;

      setTeachers(data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta lärardata. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!email || !fullName) {
      toast({
        title: "Fel",
        description: "E-post och namn krävs",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if email already exists
      const { data: existingTeacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (existingTeacher) {
        throw new Error("En lärare med denna e-post finns redan");
      }

      const { data, error } = await supabase
        .from("teachers")
        .insert([
          { 
            email: email.toLowerCase().trim(), 
            full_name: fullName.trim() 
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Lärare har lagts till",
      });

      // Reset form and refresh teachers list
      setEmail("");
      setFullName("");
      setShowAddTeacher(false);
      fetchTeachers();
    } catch (error) {
      console.error("Error adding teacher:", error);
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte lägga till lärare",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher || !email || !fullName) {
      toast({
        title: "Fel",
        description: "E-post och namn krävs",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if email is changed and if it already exists
      if (email.toLowerCase().trim() !== selectedTeacher.email) {
        const { data: existingTeacher } = await supabase
          .from("teachers")
          .select("id")
          .eq("email", email.toLowerCase().trim())
          .maybeSingle();

        if (existingTeacher) {
          throw new Error("En lärare med denna e-post finns redan");
        }
      }

      const { error } = await supabase
        .from("teachers")
        .update({ 
          email: email.toLowerCase().trim(), 
          full_name: fullName.trim() 
        })
        .eq("id", selectedTeacher.id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Läraruppgifter har uppdaterats",
      });

      // Reset form and refresh teachers list
      setSelectedTeacher(null);
      setEmail("");
      setFullName("");
      setShowEditTeacher(false);
      fetchTeachers();
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte uppdatera lärare",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    try {
      const newStatus = !teacher.is_active;
      const { error } = await supabase
        .from("teachers")
        .update({ is_active: newStatus })
        .eq("id", teacher.id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: `Läraren är nu ${newStatus ? "aktiverad" : "inaktiverad"}`,
      });

      fetchTeachers();
    } catch (error) {
      console.error("Error toggling teacher status:", error);
      toast({
        title: "Fel",
        description: "Kunde inte ändra lärarens status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      // Check if teacher has any questions or tests
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id")
        .eq("teacher_id", selectedTeacher.id);

      if (questionsError) throw questionsError;

      const { data: tests, error: testsError } = await supabase
        .from("tests")
        .select("id")
        .eq("teacher_id", selectedTeacher.id);

      if (testsError) throw testsError;

      if ((questions && questions.length > 0) || (tests && tests.length > 0)) {
        throw new Error(
          "Denna lärare har frågor eller tester. Inaktivera kontot istället för att radera det."
        );
      }

      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", selectedTeacher.id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Läraren har raderats",
      });

      // Reset form and refresh teachers list
      setSelectedTeacher(null);
      setShowDeleteConfirm(false);
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte radera lärare",
        variant: "destructive",
      });
      setShowDeleteConfirm(false);
    }
  };

  const openEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEmail(teacher.email);
    setFullName(teacher.full_name);
    setShowEditTeacher(true);
  };

  const openDeleteConfirm = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowDeleteConfirm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lärarhantering</h2>
        <Button onClick={() => setShowAddTeacher(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Lägg till lärare
        </Button>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center p-6 border rounded-md text-muted-foreground">
          Inga lärare hittades. Klicka på "Lägg till lärare" för att komma igång.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Registrerad</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.full_name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    {format(new Date(teacher.created_at), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>
                    {teacher.is_active ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Aktiv
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Inaktiv
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditTeacher(teacher)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Redigera</span>
                      </Button>
                      <Button 
                        variant={teacher.is_active ? "ghost" : "outline"}
                        size="icon"
                        onClick={() => handleToggleStatus(teacher)}
                        title={teacher.is_active ? "Inaktivera konto" : "Aktivera konto"}
                      >
                        {teacher.is_active ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        <span className="sr-only">
                          {teacher.is_active ? "Inaktivera" : "Aktivera"}
                        </span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openDeleteConfirm(teacher)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Radera</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Teacher Sheet */}
      <Sheet open={showAddTeacher} onOpenChange={setShowAddTeacher}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Lägg till lärare</SheetTitle>
            <SheetDescription>
              Fyll i information för den nya läraren.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-email">E-post</Label>
              <Input
                id="teacher-email"
                placeholder="larare@skola.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-name">Fullständigt namn</Label>
              <Input
                id="teacher-name"
                placeholder="Anna Andersson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <SheetFooter className="sm:justify-end">
            <SheetClose asChild>
              <Button variant="outline">Avbryt</Button>
            </SheetClose>
            <Button 
              onClick={handleAddTeacher} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Spara"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Teacher Sheet */}
      <Sheet open={showEditTeacher} onOpenChange={setShowEditTeacher}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Redigera lärare</SheetTitle>
            <SheetDescription>
              Uppdatera information för läraren.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-post</Label>
              <Input
                id="edit-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Fullständigt namn</Label>
              <Input
                id="edit-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <SheetFooter className="sm:justify-end">
            <SheetClose asChild>
              <Button variant="outline">Avbryt</Button>
            </SheetClose>
            <Button 
              onClick={handleEditTeacher} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Spara"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer att permanent radera läraren{" "}
              <strong>{selectedTeacher?.full_name}</strong>. Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeacher}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Radera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
