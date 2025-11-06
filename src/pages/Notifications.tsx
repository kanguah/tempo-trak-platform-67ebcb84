import { Bell, Mail, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const notifications = [
  {
    id: 1,
    type: "payment",
    title: "Payment Received",
    message: "Sarah Johnson paid GH₵ 450 via MTN MoMo",
    time: "5 minutes ago",
    read: false,
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    id: 2,
    type: "schedule",
    title: "Schedule Change",
    message: "Mr. Kofi rescheduled lesson with Emma Williams to 3:00 PM",
    time: "1 hour ago",
    read: false,
    icon: Clock,
    color: "text-orange-600",
  },
  {
    id: 3,
    type: "enrollment",
    title: "New Student Enrolled",
    message: "Alice Thompson enrolled in Piano lessons (8-lesson package)",
    time: "2 hours ago",
    read: false,
    icon: CheckCircle,
    color: "text-blue-600",
  },
  {
    id: 4,
    type: "alert",
    title: "Payment Overdue",
    message: "David Brown's payment is 5 days overdue (GH₵ 450)",
    time: "3 hours ago",
    read: false,
    icon: AlertCircle,
    color: "text-red-600",
  },
  {
    id: 5,
    type: "message",
    title: "WhatsApp Message",
    message: "New message from Robert Kim: 'When can I start classes?'",
    time: "5 hours ago",
    read: true,
    icon: MessageSquare,
    color: "text-primary",
  },
  {
    id: 6,
    type: "report",
    title: "Monthly Report Ready",
    message: "May attendance report is ready for download",
    time: "1 day ago",
    read: true,
    icon: CheckCircle,
    color: "text-green-600",
  },
];

export default function Notifications() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with academy activities ({unreadCount} unread)
            </p>
          </div>
          <Button variant="outline">Mark All as Read</Button>
        </div>

        {/* Communication Channels */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">SMS Notifications</p>
                  <h3 className="text-2xl font-bold text-foreground">142 sent</h3>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-secondary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email Notifications</p>
                  <h3 className="text-2xl font-bold text-foreground">89 sent</h3>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-accent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">WhatsApp Messages</p>
                  <h3 className="text-2xl font-bold text-foreground">67 sent</h3>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <Card
                  key={notification.id}
                  className={`border-2 transition-all cursor-pointer hover:shadow-md animate-scale-in ${
                    !notification.read ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${notification.color}`}>
                        <notification.icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          {!notification.read && (
                            <Badge className="bg-primary text-primary-foreground">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-muted-foreground">Notify me about pending payments</p>
                </div>
                <Badge className="bg-green-500/10 text-green-600">Enabled</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Schedule Changes</p>
                  <p className="text-sm text-muted-foreground">Alert me when lessons are rescheduled</p>
                </div>
                <Badge className="bg-green-500/10 text-green-600">Enabled</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">New Enrollments</p>
                  <p className="text-sm text-muted-foreground">Notify about new student registrations</p>
                </div>
                <Badge className="bg-green-500/10 text-green-600">Enabled</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Marketing Updates</p>
                  <p className="text-sm text-muted-foreground">Updates about campaigns and conversions</p>
                </div>
                <Badge className="bg-gray-500/10 text-gray-600">Disabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
