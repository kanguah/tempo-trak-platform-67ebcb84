import { useState, useEffect } from "react";
import { Send, Mail, Clock, CheckCircle2, XCircle, Edit, Trash2, Filter } from "lucide-react";
import {
  useMessageTemplates,
  useMessages,
  useAutomatedReminders,
  useGetRecipientContacts,
  useSendMessage,
  useToggleReminder,
} from "@/hooks/useMessaging";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreateTemplateDialog from "@/components/messaging/CreateTemplateDialog";
import IndividualRecipientSelector from "@/components/messaging/IndividualRecipientSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Messaging() {
  const [selectedChannel, setSelectedChannel] = useState<"email" | "sms">("email");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedRecipientType, setSelectedRecipientType] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [recipients, setRecipients] = useState<any[]>([]);
  const [sendMode, setSendMode] = useState<"bulk" | "individual">("bulk");

  const { data: templates = [], isLoading: templatesLoading } = useMessageTemplates();
  const { data: messages = [], isLoading: messagesLoading } = useMessages();
  const { data: automatedReminders = [], isLoading: remindersLoading } = useAutomatedReminders();
  const getRecipients = useGetRecipientContacts();
  const sendMessage = useSendMessage();
  const toggleReminder = useToggleReminder();

  // Fetch recipients when recipient type or channel changes (only for bulk mode)
  useEffect(() => {
    if (sendMode === "bulk" && selectedRecipientType && selectedChannel) {
      console.log("the is my debug data" + selectedRecipientType + selectedChannel);
      getRecipients.mutate(
        { recipientType: selectedRecipientType, channel: selectedChannel },
        {
          onSuccess: (data) => {
            console.log("the is my debug data" + data + selectedRecipientType + selectedChannel);
            setRecipients(data);
          },
        },
      );
    }
  }, [selectedRecipientType, selectedChannel, sendMode]);

  // Load template when selected
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template) {
        setMessageBody(template.message);
        if (template.subject) setSubject(template.subject);
      }
    }
  }, [selectedTemplate, templates]);

  const handleSendMessage = () => {
    if (!messageBody || recipients.length === 0) {
      return;
    }
    sendMessage.mutate(
      {
        channel: selectedChannel,
        subject: selectedChannel === "email" ? subject : undefined,
        messageBody,
        recipients,
        templateId: selectedTemplate || undefined,
        recipientType: selectedRecipientType,
      },
      {
        onSuccess: () => {
          setMessageBody("");
          setSubject("");
          setSelectedTemplate("");
          setSelectedRecipientType("");
          setRecipients([]);
        },
      },
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "sent":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "sending":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <Send className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">Messaging Center</h1>
            <p className="text-sm md:text-base text-muted-foreground">Send messages, manage templates, and track delivery</p>
          </div>
          <CreateTemplateDialog />
        </div>

        <Tabs defaultValue="send" className="space-y-4 md:space-y-6">
          <TabsList className="bg-card w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="send" className="text-xs sm:text-sm py-2">Send Messages</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm py-2">Templates</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2">Tracking</TabsTrigger>
            <TabsTrigger value="automation" className="text-xs sm:text-sm py-2">Reminders</TabsTrigger>
          </TabsList>

          {/* Send Messages Tab */}
          <TabsContent value="send" className="space-y-4 md:space-y-6">
            <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
              <Card className="lg:col-span-2 shadow-card">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Compose Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Send Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={sendMode === "bulk" ? "default" : "outline"}
                        onClick={() => {
                          setSendMode("bulk");
                          setRecipients([]);
                        }}
                        className="flex-1"
                      >
                        Bulk Send
                      </Button>
                      <Button
                        type="button"
                        variant={sendMode === "individual" ? "default" : "outline"}
                        onClick={() => {
                          setSendMode("individual");
                          setSelectedRecipientType("");
                          setRecipients([]);
                        }}
                        className="flex-1"
                      >
                        Individual
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Channel</Label>
                      <Select
                        value={selectedChannel}
                        onValueChange={(value) => {
                          setSelectedChannel(value as "email" | "sms");
                          setRecipients([]);
                        }}
                      >
                        <SelectTrigger className="h-11 md:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Template (Optional)</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="h-11 md:h-10">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {templates
                            .filter((t) => t.channel === selectedChannel)
                            .map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {sendMode === "bulk" ? (
                    <div className="space-y-2">
                      <Label className="text-sm">Recipients</Label>
                      <Select value={selectedRecipientType} onValueChange={setSelectedRecipientType}>
                        <SelectTrigger className="h-11 md:h-10">
                          <SelectValue placeholder="Select recipients" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="all-students">All Students</SelectItem>
                          <SelectItem value="all-parents">All Parents</SelectItem>
                          <SelectItem value="all-tutors">All Tutors</SelectItem>
                          <SelectItem value="all-staff">All Staff</SelectItem>
                          <SelectItem value="pending-payments">Pending Payments</SelectItem>
                        </SelectContent>
                      </Select>
                      {recipients.length > 0 && (
                        <p className="text-xs md:text-sm text-muted-foreground">{recipients.length} recipient(s) selected</p>
                      )}
                    </div>
                  ) : (
                    <IndividualRecipientSelector
                      channel={selectedChannel}
                      onRecipientsChange={(recipients, type) => {
                        setRecipients(recipients);
                        setSelectedRecipientType(type);
                      }}
                    />
                  )}

                  {selectedChannel === "email" && (
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input placeholder="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Type your message here..."
                      className="min-h-[200px]"
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use variables: {"{name}"}, {"{amount}"}, {"{date}"}, {"{instrument}"}, {"{tutor}"}
                    </p>
                    {selectedChannel === "sms" && (
                      <p className="text-xs text-muted-foreground">Character count: {messageBody.length}/160</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="gradient-primary flex-1"
                      onClick={handleSendMessage}
                      disabled={sendMessage.isPending || !messageBody || recipients.length === 0}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendMessage.isPending ? "Sending..." : "Send Now"}
                    </Button>
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
                        <span className="text-muted-foreground">Total Messages</span>
                        <span className="font-semibold text-foreground">{messages.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sent</span>
                        <span className="font-semibold text-green-600">
                          {messages.filter((m) => m.status === "sent").length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed</span>
                        <span className="font-semibold text-red-600">
                          {messages.filter((m) => m.status === "failed").length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sending</span>
                        <span className="font-semibold text-orange-600">
                          {messages.filter((m) => m.status === "sending").length}
                        </span>
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
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Email</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">SMS</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {templatesLoading ? (
              <p>Loading templates...</p>
            ) : templates.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No templates yet. Create your first template!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {templates.map((template) => (
                  <Card key={template.id} className="shadow-card hover:shadow-primary transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-lg ${
                              template.channel === "email" ? "bg-blue-500/10" : "bg-purple-500/10"
                            }`}
                          >
                            {getChannelIcon(template.channel)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{template.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{template.channel}</p>
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
                        <p className="text-sm font-medium text-foreground mb-2">Subject: {template.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3">{template.message}</p>
                      <Badge className="mt-4" variant="outline">
                        {template.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                {messagesLoading ? (
                  <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No messages sent yet</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-lg ${
                              message.channel === "email" ? "bg-blue-500/10" : "bg-purple-500/10"
                            }`}
                          >
                            {getChannelIcon(message.channel)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {message.message_recipients?.length || 0} recipient(s)
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {message.message_body.substring(0, 50)}...
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleString()}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {message.channel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(message.status)} variant="outline">
                          {message.status === "sent" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {message.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                          {message.status === "sending" && <Clock className="mr-1 h-3 w-3" />}
                          {message.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
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
                        <div
                          className={`p-2 rounded-lg ${
                            reminder.channel === "email" ? "bg-blue-500/10" : "bg-purple-500/10"
                          }`}
                        >
                          {getChannelIcon(reminder.channel)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{reminder.name}</p>
                          <p className="text-sm text-muted-foreground">{reminder.trigger_type}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {reminder.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Sent {reminder.times_sent} times</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={reminder.is_active}
                          onCheckedChange={(checked) => {
                            toggleReminder.mutate({ id: reminder.id, isActive: checked });
                          }}
                        />
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
