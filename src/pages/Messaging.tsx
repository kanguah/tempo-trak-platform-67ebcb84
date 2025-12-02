import { useState, useEffect } from "react";
import { Send, Mail, Clock, CheckCircle2, XCircle, Edit, Trash2, Filter, Search, X } from "lucide-react";
import { useMessageTemplates, useMessages, useAutomatedReminders, useGetRecipientContacts, useSendMessage, useToggleReminder, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useMessaging";
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
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const {
    data: templates = [],
    isLoading: templatesLoading
  } = useMessageTemplates();
  const {
    data: messages = [],
    isLoading: messagesLoading
  } = useMessages();
  const {
    data: automatedReminders = [],
    isLoading: remindersLoading
  } = useAutomatedReminders();
  const getRecipients = useGetRecipientContacts();
  const sendMessage = useSendMessage();
  const toggleReminder = useToggleReminder();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  // Fetch recipients when recipient type or channel changes (only for bulk mode)
  useEffect(() => {
    if (sendMode === "bulk" && selectedRecipientType && selectedChannel) {
      console.log("the is my debug data" + selectedRecipientType + selectedChannel);
      getRecipients.mutate({
        recipientType: selectedRecipientType,
        channel: selectedChannel
      }, {
        onSuccess: data => {
          console.log("the is my debug data" + data + selectedRecipientType + selectedChannel);
          setRecipients(data);
        }
      });
    }
  }, [selectedRecipientType, selectedChannel, sendMode]);

  // Load template when selected
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
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
    sendMessage.mutate({
      channel: selectedChannel,
      subject: selectedChannel === "email" ? subject : undefined,
      messageBody,
      recipients,
      templateId: selectedTemplate || undefined,
      recipientType: selectedRecipientType
    }, {
      onSuccess: () => {
        setMessageBody("");
        setSubject("");
        setSelectedTemplate("");
        setSelectedRecipientType("");
        setRecipients([]);
      }
    });
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
  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
  };
  const handleUpdateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    updateTemplate.mutate({
      id: editingTemplate.id,
      name: editingTemplate.name,
      message: editingTemplate.message,
      subject: editingTemplate.subject
    }, {
      onSuccess: () => {
        setEditingTemplate(null);
      }
    });
  };
  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplate.mutate(templateId);
    }
  };
  const filteredMessages = messages.filter(message => {
    const matchesStatus = filterStatus === "all" || message.status === filterStatus;
    const matchesChannel = filterChannel === "all" || message.channel === filterChannel;
    const matchesSearch = searchQuery === "" || message.message_body.toLowerCase().includes(searchQuery.toLowerCase()) || message.recipient_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesChannel && matchesSearch;
  });
  const commonTemplates = [{
    name: "Payment Reminder",
    channel: "email",
    category: "payment",
    subject: "Payment Reminder for {name}",
    message: "Dear {name},\n\nThis is a friendly reminder that your payment of {amount} is due on {date}.\n\nPlease make your payment at your earliest convenience.\n\nThank you!"
  }, {
    name: "Lesson Confirmation",
    channel: "email",
    category: "lesson",
    subject: "Lesson Confirmation - {subject}",
    message: "Hi {name},\n\nThis confirms your {subject} lesson scheduled for {date} at {time} with {tutor}.\n\nSee you there!"
  }, {
    name: "Welcome Message",
    channel: "email",
    category: "general",
    subject: "Welcome to Our Academy!",
    message: "Dear {name},\n\nWelcome! We're excited to have you join us. Your lessons will begin on {date}.\n\nIf you have any questions, feel free to reach out.\n\nBest regards"
  }, {
    name: "Payment Reminder SMS",
    channel: "sms",
    category: "payment",
    message: "Hi {name}, reminder: {amount} payment due on {date}. Thank you!"
  }, {
    name: "Lesson Reminder SMS",
    channel: "sms",
    category: "lesson",
    message: "Hi {name}, your {subject} lesson with {tutor} is tomorrow at {time}. See you!"
  }];
  return <div className="min-h-screen bg-background">
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
                      <Button type="button" variant={sendMode === "bulk" ? "default" : "outline"} onClick={() => {
                      setSendMode("bulk");
                      setRecipients([]);
                    }} className="flex-1">
                        Bulk Send
                      </Button>
                      <Button type="button" variant={sendMode === "individual" ? "default" : "outline"} onClick={() => {
                      setSendMode("individual");
                      setSelectedRecipientType("");
                      setRecipients([]);
                    }} className="flex-1">
                        Individual
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Channel</Label>
                      <Select value={selectedChannel} onValueChange={value => {
                      setSelectedChannel(value as "email" | "sms");
                      setRecipients([]);
                    }}>
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
                          {templates.filter(t => t.channel === selectedChannel).map(template => <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {sendMode === "bulk" ? <div className="space-y-2">
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
                      {recipients.length > 0 && <p className="text-xs md:text-sm text-muted-foreground">{recipients.length} recipient(s) selected</p>}
                    </div> : <IndividualRecipientSelector channel={selectedChannel} onRecipientsChange={(recipients, type) => {
                  setRecipients(recipients);
                  setSelectedRecipientType(type);
                }} />}

                  {selectedChannel === "email" && <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input placeholder="Email subject" value={subject} onChange={e => setSubject(e.target.value)} />
                    </div>}

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea placeholder="Type your message here..." className="min-h-[200px]" value={messageBody} onChange={e => setMessageBody(e.target.value)} />
                    <p className="text-xs text-muted-foreground">
                      Use variables: {"{name}"}, {"{amount}"}, {"{date}"}, {"{instrument}"}, {"{tutor}"}
                    </p>
                    {selectedChannel === "sms" && <p className="text-xs text-muted-foreground">Character count: {messageBody.length}/160</p>}
                  </div>

                  <div className="flex gap-3">
                    <Button className="gradient-primary flex-1" onClick={handleSendMessage} disabled={sendMessage.isPending || !messageBody || recipients.length === 0}>
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
                          {messages.filter(m => m.status === "sent").length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed</span>
                        <span className="font-semibold text-red-600">
                          {messages.filter(m => m.status === "failed").length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sending</span>
                        <span className="font-semibold text-orange-600">
                          {messages.filter(m => m.status === "sending").length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* Common Templates Section */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Start Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {commonTemplates.map((template, index) => <Card key={index} className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-4" onClick={() => {
                    setSelectedTemplate("");
                    setMessageBody(template.message);
                    if (template.subject) setSubject(template.subject);
                    setSelectedChannel(template.channel as "email" | "sms");
                  }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-2 rounded-lg ${template.channel === "email" ? "bg-blue-500/10" : "bg-purple-500/10"}`}>
                            {getChannelIcon(template.channel)}
                          </div>
                          <h4 className="font-semibold text-sm text-foreground">{template.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{template.message}</p>
                        <Badge className="mt-2 text-xs" variant="outline">{template.category}</Badge>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>

            {/* User Templates Section */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">My Templates</CardTitle>
              </CardHeader>
              <CardContent>
                {templatesLoading ? <p>Loading templates...</p> : templates.length === 0 ? <p className="text-center text-muted-foreground py-8">No custom templates yet. Create your first template!</p> : <div className="grid gap-6 md:grid-cols-2">
                    {templates.map(template => <Card key={template.id} className="shadow-card hover:shadow-primary transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-lg ${template.channel === "email" ? "bg-blue-500/10" : "bg-purple-500/10"}`}>
                                {getChannelIcon(template.channel)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{template.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">{template.channel}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleEditTemplate(template)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {template.subject && <p className="text-sm font-medium text-foreground mb-2">Subject: {template.subject}</p>}
                          <p className="text-sm text-muted-foreground line-clamp-3">{template.message}</p>
                          <Badge className="mt-4" variant="outline">
                            {template.category}
                          </Badge>
                        </CardContent>
                      </Card>)}
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tracking Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Message History</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                      <Filter className="mr-2 h-4 w-4" />
                      {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                  </div>
                </div>
                
                {showFilters && <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
                        {searchQuery && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearchQuery("")}>
                            <X className="h-4 w-4" />
                          </Button>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="sending">Sending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Channel</Label>
                      <Select value={filterChannel} onValueChange={setFilterChannel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="all">All Channels</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>}
              </CardHeader>
              <CardContent>
                {messagesLoading ? <p>Loading messages...</p> : filteredMessages.length === 0 ? <p className="text-center text-muted-foreground py-8">
                    {messages.length === 0 ? "No messages sent yet" : "No messages match your filters"}
                  </p> : <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {filteredMessages.map(message => <div key={message.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${message.channel === "email" ? "bg-blue-500/10" : "bg-purple-500/10"}`}>
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
                      </div>)}
                  </div>}
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
                  {automatedReminders.map(reminder => <div key={reminder.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${reminder.channel === "email" ? "bg-blue-500/10" : "bg-purple-500/10"}`}>
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
                        <Switch checked={reminder.is_active} onCheckedChange={checked => {
                      toggleReminder.mutate({
                        id: reminder.id,
                        isActive: checked
                      });
                    }} />
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Template Dialog */}
      {editingTemplate && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Template</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateTemplate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input value={editingTemplate.name} onChange={e => setEditingTemplate({
                ...editingTemplate,
                name: e.target.value
              })} required />
                </div>
                {editingTemplate.channel === "email" && <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input value={editingTemplate.subject || ""} onChange={e => setEditingTemplate({
                ...editingTemplate,
                subject: e.target.value
              })} />
                  </div>}
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea value={editingTemplate.message} onChange={e => setEditingTemplate({
                ...editingTemplate,
                message: e.target.value
              })} className="min-h-[200px]" required />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditingTemplate(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateTemplate.isPending}>
                    {updateTemplate.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>}
    </div>;
}