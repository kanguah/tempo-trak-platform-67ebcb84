import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Building2, Palette, Users, Sparkles } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Organization details
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  
  // Branding
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#D946EF");
  
  // Terminology
  const [studentTerm, setStudentTerm] = useState("Students");
  const [tutorTerm, setTutorTerm] = useState("Tutors");
  const [lessonTerm, setLessonTerm] = useState("Lessons");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(value));
    }
  };

  const handleCreateOrganization = async () => {
    if (!user?.id || !orgName || !orgSlug) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if slug is unique
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .maybeSingle();

      if (existingOrg) {
        toast({
          title: "Slug already taken",
          description: "Please choose a different organization URL",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: orgName,
          slug: orgSlug,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          student_term: studentTerm,
          tutor_term: tutorTerm,
          lesson_term: lessonTerm,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: "admin",
          is_owner: true,
        });

      if (memberError) throw memberError;

      toast({
        title: "Organization created!",
        description: "Your academy is ready. Let's get started!",
      });

      // Store current org
      localStorage.setItem(`current_org_${user.id}`, newOrg.id);
      
      navigate("/");
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const presetColors = [
    { name: "Purple", primary: "#8B5CF6", secondary: "#D946EF" },
    { name: "Blue", primary: "#3B82F6", secondary: "#06B6D4" },
    { name: "Green", primary: "#10B981", secondary: "#84CC16" },
    { name: "Orange", primary: "#F97316", secondary: "#EAB308" },
    { name: "Red", primary: "#EF4444", secondary: "#F43F5E" },
    { name: "Teal", primary: "#14B8A6", secondary: "#22D3EE" },
  ];

  const academyTypes = [
    { label: "Music School", student: "Students", tutor: "Instructors", lesson: "Lessons" },
    { label: "Coding Academy", student: "Learners", tutor: "Mentors", lesson: "Sessions" },
    { label: "Robotics Club", student: "Members", tutor: "Coaches", lesson: "Workshops" },
    { label: "Dance Studio", student: "Dancers", tutor: "Instructors", lesson: "Classes" },
    { label: "Art School", student: "Artists", tutor: "Teachers", lesson: "Sessions" },
    { label: "Tutoring Center", student: "Students", tutor: "Tutors", lesson: "Lessons" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">Set Up Your Academy</CardTitle>
          <CardDescription className="text-base">
            Let's create your personalized learning management system
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-1 w-16 md:w-32 mx-2 ${
                        step > s ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold">Organization Details</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Academy Name *</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g., Harmony Music Academy"
                    value={orgName}
                    onChange={(e) => handleOrgNameChange(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="orgSlug">Organization URL *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">academy/</span>
                    <Input
                      id="orgSlug"
                      placeholder="harmony-music"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(generateSlug(e.target.value))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be your unique identifier
                  </p>
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!orgName || !orgSlug}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold">Branding</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Color Theme</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                    {presetColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          setPrimaryColor(color.primary);
                          setSecondaryColor(color.secondary);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          primaryColor === color.primary
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-8 rounded"
                            style={{ backgroundColor: color.primary }}
                          />
                          <div
                            className="w-4 h-8 rounded"
                            style={{ backgroundColor: color.secondary }}
                          />
                        </div>
                        <p className="text-xs mt-1 font-medium">{color.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="primaryColor"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold">Customize Terminology</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Quick Presets</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {academyTypes.map((type) => (
                      <button
                        key={type.label}
                        onClick={() => {
                          setStudentTerm(type.student);
                          setTutorTerm(type.tutor);
                          setLessonTerm(type.lesson);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          studentTerm === type.student && tutorTerm === type.tutor
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {type.student}, {type.tutor}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="studentTerm">Students</Label>
                    <Input
                      id="studentTerm"
                      value={studentTerm}
                      onChange={(e) => setStudentTerm(e.target.value)}
                      placeholder="Students"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tutorTerm">Tutors</Label>
                    <Input
                      id="tutorTerm"
                      value={tutorTerm}
                      onChange={(e) => setTutorTerm(e.target.value)}
                      placeholder="Tutors"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lessonTerm">Lessons</Label>
                    <Input
                      id="lessonTerm"
                      value={lessonTerm}
                      onChange={(e) => setLessonTerm(e.target.value)}
                      placeholder="Lessons"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateOrganization}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Academy"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
