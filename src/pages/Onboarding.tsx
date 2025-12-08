import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Loader2, GraduationCap, Users, BookOpen } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const { refreshOrganizations } = useOrganization();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Organization details
  const [orgName, setOrgName] = useState("");
  const [studentTerm, setStudentTerm] = useState("Students");
  const [tutorTerm, setTutorTerm] = useState("Tutors");
  const [lessonTerm, setLessonTerm] = useState("Lessons");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast.error("Please enter your organization name");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(orgName);

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          slug,
          student_term: studentTerm,
          tutor_term: tutorTerm,
          lesson_term: lessonTerm,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'admin',
          is_owner: true,
        });

      if (memberError) throw memberError;

      // Refresh organizations in context
      await refreshOrganizations();
      
      toast.success("Organization created successfully!");
      navigate('/');
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || "Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome!</h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your education center
          </p>
        </div>

        {step === 1 && (
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Create Your Organization</CardTitle>
              <CardDescription>
                This is where you'll manage your students, tutors, and lessons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  placeholder="e.g., Bright Academy, Elite Tutoring"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Customize terminology (optional)
                </p>
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="student-term" className="text-xs text-muted-foreground">
                        What do you call students?
                      </Label>
                      <Input
                        id="student-term"
                        placeholder="Students"
                        value={studentTerm}
                        onChange={(e) => setStudentTerm(e.target.value)}
                        disabled={isLoading}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="tutor-term" className="text-xs text-muted-foreground">
                        What do you call tutors?
                      </Label>
                      <Input
                        id="tutor-term"
                        placeholder="Tutors"
                        value={tutorTerm}
                        onChange={(e) => setTutorTerm(e.target.value)}
                        disabled={isLoading}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="lesson-term" className="text-xs text-muted-foreground">
                        What do you call lessons?
                      </Label>
                      <Input
                        id="lesson-term"
                        placeholder="Lessons"
                        value={lessonTerm}
                        onChange={(e) => setLessonTerm(e.target.value)}
                        disabled={isLoading}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full gradient-primary text-primary-foreground"
                onClick={handleCreateOrganization}
                disabled={isLoading || !orgName.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          You can invite team members and customize settings later
        </p>
      </div>
    </div>
  );
}
