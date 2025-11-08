import { useState } from "react";
import { Send, MessageSquare, Mail, Clock, CheckCircle2, XCircle, Plus, Edit, Trash2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const templates = [
  {
    id: 1,
    name: "Payment Reminder",
    channel: "WhatsApp",
    subject: "",
    message: "Hello {name}, this is a reminder that your payment of {amount} is due on {date}. Please make payment to avoid interruption of lessons.",
    category: "Payment",
  },
  {
    id: 2,
    name: "Lesson Reminder",
    channel: "SMS",
    subject: "",
    message: "Hi {name}, reminder: Your {instrument} lesson is tomorrow at {time} with {tutor}. See you there!",
    category: "Lesson",
  },
  {
    id: 3,
    name: "Welcome Email",
    channel: "Email",
    subject: "Welcome to 49ice Academy!",
    message: "Dear {name},\n\nWelcome to 49ice Academy of Music! We're excited to have you join our musical family.\n\nYour lessons will begin on {start_date}.\n\nBest regards,\nThe 49ice Team",
    category: "General",
  },
  {
    id: 4,
    name: "Tutor Assignment",
    channel: "Email",
    subject: "Your Tutor Assignment",
    message: "Hello {name},\n\nYour tutor for {instrument} is {tutor}. Lessons will be held {schedule}.\n\nLooking forward to your musical journey!",
    category: "General",
  },
];

const messageHistory = [
  {
    id: 1,
    recipient: "John Mensah",
    channel: "WhatsApp",
    message: "Payment reminder for June fees",
    status: "Delivered",
    timestamp: "2024-01-15 10:30 AM",
    template: "Payment Reminder",
  },
  {
    id: 2,
    recipient: "Bulk: 45 students",
    channel: "Email",
    message: "Monthly newsletter and updates",
    status: "Sent",
    timestamp: "2024-01-14 09:00 AM",
    template: "Custom",
  },
  {
    id: 3,
    recipient: "Sarah Osei",
    channel: "SMS",
    message: "Lesson reminder for tomorrow",
    status: "Delivered",
    timestamp: "2024-01-14 05:00 PM",
    template: "Lesson Reminder",
  },
  {
    id: 4,
    recipient: "Michael Asante",
    channel: "WhatsApp",
    message: "Welcome message",
    status: "Failed",
    timestamp: "2024-01-13 02:15 PM",
    template: "Welcome Email",
  },
];

const automatedReminders = [
  {
    id: 1,
    name: "Lesson Reminder - 24h",
    type: "Lesson",
    channel: "WhatsApp",
    trigger: "24 hours before lesson",
    active: true,
    sent: 156,
  },
  {
    id: 2,
    name: "Payment Due - 3 days",
    type: "Payment",
    channel: "Email",
    trigger: "3 days before due date",
    active: true,
    sent: 89,
  },
  {
    id: 3,
    name: "Payment Overdue",
    type: "Payment",
    channel: "WhatsApp",
    trigger: "1 day after due date",
    active: true,
    sent: 12,
  },
  {
    id: 4,
    name: "Lesson Reminder - 2h",
    type: "Lesson",
    channel: "SMS",
    trigger: "2 hours before lesson",
    active: false,
    sent: 0,
  },
];

export default function Messaging() {
  const [selectedChannel, setSelectedChannel] = useState("WhatsApp");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Sent":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Failed":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "WhatsApp":
        return <MessageSquare className="h-4 w-4" />;
      case "Email":
        return <Mail className="h-4 w-4" />;
      case "SMS":
        return <Send className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Messaging Center</h1>
            <p className="text-muted-foreground">Send messages, manage templates, and track delivery</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-primary">
            <Plus className="mr-2 h-5 w-5" />
            New Template
          </Button>
        </div>

        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="bg-card">
            <TabsTrigger value="send">Send Messages</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">Delivery Tracking</TabsTrigger>
            <TabsTrigger value="automation">Automated Reminders</TabsTrigger>
          </TabsList>

          {/* Send Messages Tab */}
          <TabsContent value="send" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 shadow-card">
                <CardHeader>
                  <CardTitle>Compose Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Channel</Label>
                      <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="SMS">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Template (Optional)</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates
                            .filter((t) => t.channel === selectedChannel)
                            .map((template) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-students">All Students</SelectItem>
                        <SelectItem value="all-parents">All Parents</SelectItem>
                        <SelectItem value="all-tutors">All Tutors</SelectItem>
                        <SelectItem value="pending-payments">Pending Payments</SelectItem>
                        <SelectItem value="custom">Custom Selection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedChannel === "Email" && (
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input placeholder="Email subject" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Type your message here..."
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use variables: {"{name}"}, {"{amount}"}, {"{date}"}, {"{instrument}"}, {"{tutor}"}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="schedule" />
                    <Label htmlFor="schedule">Schedule for later</Label>
                  </div>

                  <div className="flex gap-3">
                    <Button className="gradient-primary flex-1">
                      <Send className="mr-2 h-4 w-4" />
                      Send Now
                    </Button>
                    <Button variant="outline">Save as Draft</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sent Today</span>
                        <span className="font-semibold text-foreground">127</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivered</span>
                        <span className="font-semibold text-green-600">122</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed</span>
                        <span className="font-semibold text-red-600">5</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-semibold text-orange-600">3</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Channel Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">WhatsApp</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Email</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">SMS</span>
                      </div>
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                        Limited
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {templates.map((template) => (
                <Card key={template.id} className="shadow-card hover:shadow-primary transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          template.channel === "WhatsApp" ? "bg-green-500/10" :
                          template.channel === "Email" ? "bg-blue-500/10" : "bg-purple-500/10"
                        }`}>
                          {getChannelIcon(template.channel)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.channel}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {template.subject && (
                      <p className="text-sm font-medium text-foreground mb-2">
                        Subject: {template.subject}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.message}
                    </p>
                    <Badge className="mt-4" variant="outline">
                      {template.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Delivery Tracking Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Message History</CardTitle>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messageHistory.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          message.channel === "WhatsApp" ? "bg-green-500/10" :
                          message.channel === "Email" ? "bg-blue-500/10" : "bg-purple-500/10"
                        }`}>
                          {getChannelIcon(message.channel)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{message.recipient}</p>
                          <p className="text-sm text-muted-foreground">{message.message}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                            <Badge variant="outline" className="text-xs">
                              {message.template}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(message.status)} variant="outline">
                        {message.status === "Delivered" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {message.status === "Failed" && <XCircle className="mr-1 h-3 w-3" />}
                        {message.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automated Reminders Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Automated Reminder Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automatedReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          reminder.channel === "WhatsApp" ? "bg-green-500/10" :
                          reminder.channel === "Email" ? "bg-blue-500/10" : "bg-purple-500/10"
                        }`}>
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{reminder.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {reminder.trigger} • {reminder.channel}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sent: {reminder.sent} times
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {reminder.type}
                        </Badge>
                        <Switch checked={reminder.active} />
                      </div>
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
