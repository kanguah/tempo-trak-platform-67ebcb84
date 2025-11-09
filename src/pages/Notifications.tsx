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
};

const colorMap: Record<string, string> = {
  payment_reminder: "text-green-600",
  schedule_change: "text-orange-600",
  new_enrollment: "text-blue-600",
  marketing: "text-primary",
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
        .eq('user_id', user?.id)
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
        .eq('user_id', user?.id)
        .single();
      
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
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with academy activities ({unreadCount} unread)
            </p>
          </div>
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        </div>

        {/* Communication Channels */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Notifications</p>
                  <h3 className="text-2xl font-bold text-foreground">{notifications.length}</h3>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Unread</p>
                  <h3 className="text-2xl font-bold text-foreground">{unreadCount}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Pending review</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Read</p>
                  <h3 className="text-2xl font-bold text-foreground">{notifications.length - unreadCount}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Already seen</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-accent" />
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
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${color}`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-foreground">{notification.title}</h3>
                            <div className="flex items-center gap-2">
                              {!notification.is_read && (
                                <Badge className="bg-primary text-primary-foreground">New</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2">
                              {notification.is_read ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsUnread(notification.id);
                                  }}
                                  className="h-8 text-xs"
                                >
                                  Mark Unread
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="h-8 text-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark Read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                                className="h-8 text-xs text-destructive hover:text-destructive"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        {preferences && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">Payment Reminders</p>
                    <p className="text-sm text-muted-foreground">Notify me about pending payments</p>
                  </div>
                  <Switch
                    checked={preferences.payment_reminders}
                    onCheckedChange={() => handlePreferenceToggle("payment_reminders", "Payment reminders")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">Schedule Changes</p>
                    <p className="text-sm text-muted-foreground">Alert me when lessons are rescheduled</p>
                  </div>
                  <Switch
                    checked={preferences.schedule_changes}
                    onCheckedChange={() => handlePreferenceToggle("schedule_changes", "Schedule change alerts")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">New Enrollments</p>
                    <p className="text-sm text-muted-foreground">Notify about new student registrations</p>
                  </div>
                  <Switch
                    checked={preferences.new_enrollments}
                    onCheckedChange={() => handlePreferenceToggle("new_enrollments", "New enrollment notifications")}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">Marketing Updates</p>
                    <p className="text-sm text-muted-foreground">Updates about campaigns and conversions</p>
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
