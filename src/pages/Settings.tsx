import { Settings as SettingsIcon, User, Bell, Lock, Database, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [zapierWebhook, setZapierWebhook] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("zapier-webhook-url");
    if (saved) setZapierWebhook(saved);
  }, []);

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

  const handleSyncNow = async () => {
    const webhookUrl = localStorage.getItem("zapier-webhook-url");
    
    if (!webhookUrl) {
      toast.error("Please configure your Zapier webhook first");
      setSyncDialogOpen(true);
      return;
    }

    setIsSyncing(true);

    try {
      // Gather data from localStorage
      const students = JSON.parse(localStorage.getItem("students") || "[]");
      const tutors = JSON.parse(localStorage.getItem("tutors") || "[]");
      const leads = JSON.parse(localStorage.getItem("crm-leads") || "[]");
      
      const syncData = {
        timestamp: new Date().toISOString(),
        academy: "49ice Academy of Music",
        data: {
          students: students.map((s: any) => ({
            id: s.id,
            name: s.name,
            instrument: s.instrument,
            level: s.level,
            status: s.status,
            email: s.email,
          })),
          tutors: tutors.map((t: any) => ({
            id: t.id,
            name: t.name,
            instrument: t.instrument,
            students: t.students,
            email: t.email,
          })),
          leads: leads.filter((l: any) => !l.archived).map((l: any) => ({
            id: l.id,
            name: l.name,
            email: l.email,
            phone: l.phone,
            stage: l.stage,
            instrument: l.instrument,
            source: l.source,
          })),
        },
        stats: {
          total_students: students.length,
          total_tutors: tutors.length,
          total_leads: leads.filter((l: any) => !l.archived).length,
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
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your academy's configuration</p>
        </div>

        {/* Academy Profile */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Academy Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="academy-name">Academy Name</Label>
                <Input id="academy-name" defaultValue="49ice Academy of Music" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input id="email" type="email" defaultValue="info@49ice.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+233 24 000 0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" defaultValue="Accra, Ghana" />
              </div>
            </div>
            <Button className="gradient-primary text-primary-foreground">Save Changes</Button>
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
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button>Update Password</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sms-provider">SMS Provider</Label>
                <Input id="sms-provider" defaultValue="Twilio" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-provider">Email Provider</Label>
                <Input id="email-provider" defaultValue="SendGrid" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Business API</Label>
                <Input id="whatsapp" defaultValue="Connected" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-gateway">Payment Gateway</Label>
                <Input id="payment-gateway" defaultValue="MTN MoMo, Paystack" disabled />
              </div>
            </div>
            <Button variant="outline">Manage Integrations</Button>
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
                  <h3 className="font-semibold mb-2">Backup Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create a backup of all academy data
                  </p>
                  <Button variant="outline" className="w-full">
                    Create Backup
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Export Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export data to CSV or Excel format
                  </p>
                  <Button variant="outline" className="w-full">
                    Export All Data
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
                      Configure Sync
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

              <Card className="border-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Audit Logs</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    View system activity logs
                  </p>
                  <Button variant="outline" className="w-full">
                    View Logs
                  </Button>
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
                    <li>Student records (name, instrument, level, status)</li>
                    <li>Tutor information (name, instrument, student count)</li>
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
