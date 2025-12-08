import { useState } from "react";
import { Bell, Mail, MessageSquare, CheckCircle, Clock, AlertCircle, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const iconMap: Record<string, any> = {
  payment_reminder: CheckCircle,
  schedule_change: Clock,
  new_enrollment: CheckCircle,
  marketing: AlertCircle,
  lead_update: AlertCircle,
  attendance_update: CheckCircle,
  expense_update: AlertCircle,
  message_sent: Mail,
  lesson_update: Clock,
};

const colorMap: Record<string, string> = {
  payment_reminder: "text-green-600",
  schedule_change: "text-orange-600",
  new_enrollment: "text-blue-600",
  marketing: "text-primary",
  lead_update: "text-purple-600",
  attendance_update: "text-teal-600",
  expense_update: "text-red-600",
  message_sent: "text-blue-500",
  lesson_update: "text-yellow-600",
};

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Notification marked as read");
    },
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Notification marked as unread");
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Notification deleted");
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAsUnread = (id: string) => {
    markAsUnreadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleMarkAllAsRead = async () => {
    const updates = notifications.map(n => 
      supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast.success("All notifications marked as read");
  };

  const handlePreferenceToggle = (key: string, label: string) => {
    const newValue = !preferences?.[key];
    updatePreferencesMutation.mutate({ [key]: newValue });
    toast.success(`${label} ${newValue ? "enabled" : "disabled"}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">Notifications</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Stay updated with academy activities ({unreadCount} unread)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="w-full sm:w-auto">
            Mark All as Read
          </Button>
        </div>

        {/* Communication Channels */}
        <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-card border-l-4 border-l-primary">
            <CardContent className="p-4 md:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Notifications</p>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">{notifications.length}</h3>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-secondary">
            <CardContent className="p-4 md:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Unread</p>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">{unreadCount}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Pending review</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-accent">
            <CardContent className="p-4 md:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Read</p>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">{notifications.length - unreadCount}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Already seen</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="shadow-card">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Bell className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <div className="space-y-2 md:space-y-3">
              {notifications.map((notification, index) => {
                const Icon = iconMap[notification.type] || AlertCircle;
                const color = colorMap[notification.type] || "text-primary";
                
                return (
                  <Card
                    key={notification.id}
                    className={`border-2 transition-all cursor-pointer hover:shadow-md animate-scale-in ${
                      !notification.is_read ? "bg-primary/5 border-primary/20" : ""
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-muted ${color} flex-shrink-0`}>
                          <Icon className="h-4 w-4 md:h-5 md:w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start sm:items-center justify-between mb-1 gap-2">
                            <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-1 flex-1">{notification.title}</h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.is_read && (
                                <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">{notification.message}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                              {notification.is_read ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsUnread(notification.id);
                                  }}
                                  className="h-7 md:h-8 text-xs px-2 md:px-3"
                                >
                                  <span className="hidden sm:inline">Mark Unread</span>
                                  <span className="sm:hidden">Unread</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="h-7 md:h-8 text-xs px-2 md:px-3"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Mark Read</span>
                                  <span className="sm:hidden">Read</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                                className="h-7 md:h-8 text-xs px-2 md:px-3 text-destructive hover:text-destructive"
                              >
                                <X className="h-3 w-3 md:mr-1" />
                                <span className="hidden md:inline">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              {notifications.length === 0 && (
                <div className="text-center py-8 md:py-12 text-muted-foreground">
                  <Bell className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                  <p className="text-sm md:text-base">No notifications yet</p>
                  <p className="text-xs md:text-sm">You'll see updates about payments, schedules, and enrollments here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        {preferences && (
          <Card className="shadow-card">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base">Payment Reminders</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Notify me about pending payments</p>
                  </div>
                  <Switch
                    checked={preferences.payment_reminders}
                    onCheckedChange={() => handlePreferenceToggle("payment_reminders", "Payment reminders")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base">Schedule Changes</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Alert me when lessons are rescheduled</p>
                  </div>
                  <Switch
                    checked={preferences.schedule_changes}
                    onCheckedChange={() => handlePreferenceToggle("schedule_changes", "Schedule change alerts")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base">New Enrollments</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Notify about new student registrations</p>
                  </div>
                  <Switch
                    checked={preferences.new_enrollments}
                    onCheckedChange={() => handlePreferenceToggle("new_enrollments", "New enrollment notifications")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base">Marketing Updates</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Updates about campaigns and conversions</p>
                  </div>
                  <Switch
                    checked={preferences.marketing_updates}
                    onCheckedChange={() => handlePreferenceToggle("marketing_updates", "Marketing updates")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
