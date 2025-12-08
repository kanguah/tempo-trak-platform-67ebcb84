import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Building2, 
  Palette, 
  Users, 
  Loader2, 
  Upload,
  Trash2,
  Mail,
  Shield,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  is_owner: boolean;
  email: string;
}

export default function OrganizationSettings() {
  const { currentOrganization, refreshOrganizations, isOwner, isAdmin } = useOrganization();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // General settings
  const [orgName, setOrgName] = useState("");
  const [studentTerm, setStudentTerm] = useState("Students");
  const [tutorTerm, setTutorTerm] = useState("Tutors");
  const [lessonTerm, setLessonTerm] = useState("Lessons");
  
  // Branding
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#D946EF");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // Team
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (currentOrganization) {
      setOrgName(currentOrganization.name);
      setStudentTerm(currentOrganization.student_term || "Students");
      setTutorTerm(currentOrganization.tutor_term || "Tutors");
      setLessonTerm(currentOrganization.lesson_term || "Lessons");
      setPrimaryColor(currentOrganization.primary_color || "#8B5CF6");
      setSecondaryColor(currentOrganization.secondary_color || "#D946EF");
      setLogoUrl(currentOrganization.logo_url);
      
      fetchTeamMembers();
    }
  }, [currentOrganization]);

  const fetchTeamMembers = async () => {
    if (!currentOrganization) return;
    
    try {
      const { data: members, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role, is_owner')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      // Get emails from profiles
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const membersWithEmail = members.map(m => ({
        ...m,
        email: profiles?.find(p => p.id === m.user_id)?.email || 'Unknown'
      }));

      setTeamMembers(membersWithEmail);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleSaveGeneral = async () => {
    if (!currentOrganization || !isAdmin) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgName,
          student_term: studentTerm,
          tutor_term: tutorTerm,
          lesson_term: lessonTerm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrganization.id);

      if (error) throw error;
      
      await refreshOrganizations();
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!currentOrganization || !isAdmin) return;
    
    setIsSavingBranding(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrganization.id);

      if (error) throw error;
      
      await refreshOrganizations();
      toast.success('Branding updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save branding');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentOrganization || !isAdmin) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentOrganization.id}-logo.${fileExt}`;
      const filePath = `organizations/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Update organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', currentOrganization.id);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      await refreshOrganizations();
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleInviteMember = async () => {
    if (!currentOrganization || !isAdmin || !inviteEmail) return;
    
    setIsInviting(true);
    try {
      // In a real app, you'd send an invitation email
      // For now, we'll just show a message
      toast.info(`Invitation would be sent to ${inviteEmail} with role: ${inviteRole}`);
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwner) {
      toast.error('Only owners can remove members');
      return;
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      await fetchTeamMembers();
      toast.success('Member removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's settings and team
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      Student Term
                    </Label>
                    <Input
                      value={studentTerm}
                      onChange={(e) => setStudentTerm(e.target.value)}
                      placeholder="Students"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Tutor Term
                    </Label>
                    <Input
                      value={tutorTerm}
                      onChange={(e) => setTutorTerm(e.target.value)}
                      placeholder="Tutors"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      Lesson Term
                    </Label>
                    <Input
                      value={lessonTerm}
                      onChange={(e) => setLessonTerm(e.target.value)}
                      placeholder="Lessons"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                {isAdmin && (
                  <Button 
                    onClick={handleSaveGeneral}
                    disabled={isLoading}
                    className="gradient-primary text-primary-foreground"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>Upload your organization's logo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  {isAdmin && (
                    <div>
                      <Button
                        variant="outline"
                        disabled={isUploadingLogo}
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>Customize your organization's colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                        disabled={!isAdmin}
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                        disabled={!isAdmin}
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-3">Preview</p>
                  <div className="flex gap-3">
                    <Button
                      style={{ background: primaryColor, borderColor: primaryColor }}
                      className="text-white"
                    >
                      Primary Button
                    </Button>
                    <Button
                      variant="outline"
                      style={{ borderColor: secondaryColor, color: secondaryColor }}
                    >
                      Secondary
                    </Button>
                  </div>
                </div>

                {isAdmin && (
                  <Button 
                    onClick={handleSaveBranding}
                    disabled={isSavingBranding}
                    className="gradient-primary text-primary-foreground"
                  >
                    {isSavingBranding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Colors'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Settings */}
          <TabsContent value="team" className="space-y-6">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Invite Team Member</CardTitle>
                  <CardDescription>Add new members to your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleInviteMember}
                      disabled={isInviting || !inviteEmail}
                    >
                      {isInviting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Invite
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>{teamMembers.length} members in this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.email}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={member.is_owner ? 'default' : 'secondary'}>
                              {member.is_owner ? 'Owner' : member.role}
                            </Badge>
                            {member.user_id === user?.id && (
                              <Badge variant="outline">You</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {isOwner && !member.is_owner && member.user_id !== user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {member.email} from your organization. They will lose access to all data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveMember(member.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
