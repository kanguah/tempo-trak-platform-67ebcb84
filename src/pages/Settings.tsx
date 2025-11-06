import { Settings as SettingsIcon, User, Bell, Lock, Database, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
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
                    Sync data with Google Sheets
                  </p>
                  <Button variant="outline" className="w-full">
                    Configure Sync
                  </Button>
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
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" className="flex-1">
                    Light
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Dark
                  </Button>
                  <Button variant="outline" className="flex-1">
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
