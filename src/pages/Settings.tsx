import { Settings as SettingsIcon, User, Bell, Lock, Database, Palette, Download, Upload, Shield, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [zapierWebhook, setZapierWebhook] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lessonGenerationEnabled, setLessonGenerationEnabled] = useState(true);
  
  // Profile form state
  const [academyName, setAcademyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch settings data
  const { data: settings } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setAcademyName(profile.full_name || "");
      setContactEmail(profile.email || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
    }
  }, [profile]);

  // Initialize settings data
  useEffect(() => {
    if (settings) {
      setLessonGenerationEnabled(settings.lesson_generation_enabled ?? true);
    }
  }, [settings]);

  useEffect(() => {
    const saved = localStorage.getItem("zapier-webhook-url");
    if (saved) setZapierWebhook(saved);
  }, []);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { full_name: string; phone?: string; location?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user?.id,
          email: user?.email,
          full_name: data.full_name,
          phone: data.phone,
          location: data.location,
          updated_at: new Date().toISOString() 
        }, {
          onConflict: 'id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { lesson_generation_enabled: boolean }) => {
      // First try to update
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('user_id', user?.id);
        if (error) throw error;
      } else {
        // If no record exists, insert one
        const { error } = await supabase
          .from('settings')
          .insert({ user_id: user?.id, ...data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success("Settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  const handleSaveProfile = () => {
    // Save all profile data to database
    updateProfileMutation.mutate({ 
      full_name: academyName,
      phone: phone,
      location: location
    });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme === 'system' ? 'auto' : newTheme}`);
  };

  const handleSaveWebhook = () => {
    if (!zapierWebhook.trim()) {
      toast.error("Please enter a valid webhook URL");
      return;
    }
    
    if (!zapierWebhook.startsWith('https://hooks.zapier.com/')) {
      toast.error("Please enter a valid Zapier webhook URL");
      return;
    }

    localStorage.setItem("zapier-webhook-url", zapierWebhook);
    setSyncDialogOpen(false);
    toast.success("Zapier webhook configured successfully");
  };

  const handleExportData = async (type: 'students' | 'tutors' | 'payments' | 'all') => {
    setIsExporting(true);
    
    try {
      let data: any = {};
      
      if (type === 'students' || type === 'all') {
        const { data: students } = await supabase.from('students').select('*');
        data.students = students;
      }
      
      if (type === 'tutors' || type === 'all') {
        const { data: tutors } = await supabase.from('tutors').select('*');
        data.tutors = tutors;
      }
      
      if (type === 'payments' || type === 'all') {
        const { data: payments } = await supabase.from('payments').select('*');
        data.payments = payments;
      }
      
      if (type === 'all') {
        const { data: lessons } = await supabase.from('lessons').select('*');
        const { data: attendance } = await supabase.from('attendance').select('*');
        const { data: expenses } = await supabase.from('expenses').select('*');
        data.lessons = lessons;
        data.attendance = attendance;
        data.expenses = expenses;
      }
      
      // Convert to CSV format
      const csvContent = Object.entries(data).map(([key, values]: [string, any]) => {
        if (!values || values.length === 0) return '';
        const headers = Object.keys(values[0]).join(',');
        const rows = values.map((row: any) => 
          Object.values(row).map((v: any) => 
            typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
          ).join(',')
        ).join('\n');
        return `=== ${key.toUpperCase()} ===\n${headers}\n${rows}`;
      }).filter(Boolean).join('\n\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `academy-export-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success(`${type === 'all' ? 'All data' : type} exported successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncNow = async () => {
    const webhookUrl = localStorage.getItem("zapier-webhook-url");
    
    if (!webhookUrl) {
      toast.error("Please configure your Zapier webhook first");
      setSyncDialogOpen(true);
      return;
    }

    setIsSyncing(true);

    try {
      // Fetch data from database
      const { data: students } = await supabase.from('students').select('*');
      const { data: tutors } = await supabase.from('tutors').select('*');
      const { data: leads } = await supabase.from('crm_leads').select('*');
      
      const syncData = {
        timestamp: new Date().toISOString(),
        academy: academyName || "Academy",
        data: {
          students: (students || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            subjects: s.subjects,
            grade: s.grade,
            status: s.status,
            email: s.email,
          })),
          tutors: (tutors || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            subjects: t.subjects,
            email: t.email,
          })),
          leads: (leads || []).filter((l: any) => l.stage !== 'lost').map((l: any) => ({
            id: l.id,
            name: l.name,
            email: l.email,
            phone: l.phone,
            stage: l.stage,
            source: l.source,
          })),
        },
        stats: {
          total_students: students?.length || 0,
          total_tutors: tutors?.length || 0,
          total_leads: leads?.filter((l: any) => l.stage !== 'lost').length || 0,
        },
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(syncData),
      });

      toast.success("Data sync triggered! Check your Google Sheets in a moment.");
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync data. Please check your webhook URL.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your academy's configuration</p>
        </div>

        {/* Lesson Management */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Lesson Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 space-y-1">
                <Label htmlFor="lesson-generation" className="text-base font-medium">
                  Automatic Lesson Generation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable automatic lesson generation. Turn this off during school vacations, holidays, or breaks to prevent lessons from being created.
                </p>
              </div>
              <Switch
                id="lesson-generation"
                checked={lessonGenerationEnabled}
                onCheckedChange={(checked) => {
                  setLessonGenerationEnabled(checked);
                  updateSettingsMutation.mutate({ lesson_generation_enabled: checked });
                }}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Status:</strong> Lesson generation is currently{' '}
                <span className={lessonGenerationEnabled ? "text-green-600 dark:text-green-400 font-semibold" : "text-orange-600 dark:text-orange-400 font-semibold"}>
                  {lessonGenerationEnabled ? 'enabled' : 'disabled'}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="academy-name">Full Name</Label>
                <Input 
                  id="academy-name" 
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={contactEmail}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 24 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                />
              </div>
            </div>
            <Button 
              className="gradient-primary text-primary-foreground"
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Security & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password" 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button 
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Export Students</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download student data as CSV
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleExportData('students')}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Students
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Export Tutors</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download tutor data as CSV
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleExportData('tutors')}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Tutors
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Export All Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download complete academy data
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleExportData('all')}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export All Data"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Google Sheets Sync</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sync data with Google Sheets via Zapier
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSyncDialogOpen(true)}
                    >
                      Configure
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                    >
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Google Sheets Sync Dialog */}
        <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure Google Sheets Sync</DialogTitle>
              <DialogDescription>
                Connect your academy data to Google Sheets using Zapier webhooks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <h4 className="font-semibold">Setup Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Go to Zapier and create a new Zap</li>
                    <li>Select "Webhooks by Zapier" as the trigger</li>
                    <li>Choose "Catch Hook" as the trigger event</li>
                    <li>Copy the webhook URL provided by Zapier</li>
                    <li>Paste the webhook URL below</li>
                    <li>Add "Google Sheets" as your action app</li>
                    <li>Configure how you want the data mapped to your sheet</li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={zapierWebhook}
                    onChange={(e) => setZapierWebhook(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your webhook URL is stored locally and never sent to our servers
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
                  <h4 className="font-semibold mb-2">What data gets synced?</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Student records (name, subjects, grade, status)</li>
                    <li>Tutor information (name, subjects, email)</li>
                    <li>Active leads (name, contact info, stage)</li>
                    <li>Summary statistics</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveWebhook}>
                Save Configuration
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appearance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose how the academy dashboard appears
                </p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'} 
                    className="flex-1"
                    onClick={() => handleThemeChange('light')}
                  >
                    Light
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'} 
                    className="flex-1"
                    onClick={() => handleThemeChange('dark')}
                  >
                    Dark
                  </Button>
                  <Button 
                    variant={theme === 'system' ? 'default' : 'outline'} 
                    className="flex-1"
                    onClick={() => handleThemeChange('system')}
                  >
                    Auto
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
