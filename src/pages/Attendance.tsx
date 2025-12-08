import { useState, useEffect } from "react";
import { Check, X, ChevronLeft, ChevronRight, Filter, Download, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, addDays, subDays } from "date-fns";
import { createNotification } from "@/hooks/useNotifications";

export default function Attendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "EEEE, MMMM d, yyyy");

  // Fetch attendance records for the selected date

  // Fetch attendance records for the selected date
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ["attendance", formattedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          students (name),
          tutors (name)
        `)
        .eq("lesson_date", formattedDate)
        .order("start_time");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch scheduled lessons for the selected date and create attendance records if they don't exist
  useEffect(() => {
    const createAttendanceRecords = async () => {
      if (!user?.id) return;

      // Fetch scheduled lessons for the selected date (only for active students)
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select(`
          *,
          students (name, status),
          tutors (name)
        `)
        .eq("user_id", user.id)
        .eq("lesson_date", selectedDate.toISOString().substring(0, 10))
        .eq("status", "scheduled");

      if (lessonsError || !lessons) return;

      // Filter out lessons where student is inactive
      const activeLessons = lessons.filter((lesson: any) => lesson.students?.status === "active");

      // Check which lessons already have attendance records
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("lesson_date", formattedDate);

      const existingLessonIds = new Set(existingAttendance?.map(a => a.lesson_id) || []);

      // Create attendance records for lessons that don't have them
      const newAttendanceRecords = activeLessons
        .filter(lesson => !existingLessonIds.has(lesson.id))
        .map(lesson => ({
          user_id: user.id,
          lesson_id: lesson.id,
          student_id: lesson.student_id,
          tutor_id: lesson.tutor_id,
          subject: lesson.subject,
          lesson_date: formattedDate,
          start_time: lesson.start_time,
          status: "pending",
        }));

      if (newAttendanceRecords.length > 0) {
        await supabase.from("attendance").insert(newAttendanceRecords);
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }

      // Clean up attendance records for inactive students or deleted lessons
      const activelessonIds = new Set(activeLessons.map((l: any) => l.id));
      const orphanedRecords = existingAttendance?.filter(
        (a: any) => !activelessonIds.has(a.lesson_id)
      ) || [];

      if (orphanedRecords.length > 0) {
        const orphanedIds = orphanedRecords.map((r: any) => r.id);
        await supabase
          .from("attendance")
          .delete()
          .in("id", orphanedIds);
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }
    };

    createAttendanceRecords();
  }, [selectedDate, user?.id, formattedDate, queryClient]);

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("attendance")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance marked successfully!");
      if (user?.id) {
        const record = attendanceRecords.find((r: any) => r.id === variables.id);
        const studentName = record?.students?.name || "Student";
        createNotification(user.id, "attendance_update", "Attendance Marked", `${studentName} marked as ${variables.status} for ${formattedDate}.`);
      }
    },
    onError: (error) => {
      toast.error("Failed to mark attendance");
      console.error(error);
    },
  });

  // Update feedback mutation
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      const { data, error } = await supabase
        .from("attendance")
        .update({ feedback })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Feedback saved successfully!");
      setEditingFeedback(null);
      setFeedbackText("");
    },
    onError: (error) => {
      toast.error("Failed to save feedback");
      console.error(error);
    },
  });

  // Bulk mark all mutation
  const markAllAttendanceMutation = useMutation({
    mutationFn: async (status: string) => {
      const pendingIds = attendanceRecords
        .filter((r: any) => r.status === "pending")
        .map((r: any) => r.id);

      if (pendingIds.length === 0) return;

      const { error } = await supabase
        .from("attendance")
        .update({ status })
        .in("id", pendingIds);

      if (error) throw error;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(`Marked all pending as ${status}!`);
    },
    onError: (error) => {
      toast.error("Failed to mark attendance");
      console.error(error);
    },
  });

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-[hsl(170,65%,55%)]/10 text-[hsl(170,65%,45%)] border-[hsl(170,65%,55%)]/20">
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-[hsl(0,75%,55%)]/10 text-[hsl(0,75%,45%)] border-[hsl(0,75%,55%)]/20">Absent</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-[hsl(15,95%,75%)]/10 text-[hsl(15,80%,50%)] border-[hsl(15,95%,75%)]/20">
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
  const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
  const pendingCount = attendanceRecords.filter((r) => r.status === "pending").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 md:mb-2">Attendance & Progress</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Track lesson attendance and student feedback</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {pendingCount > 0 && (
              <>
                <Button 
                  variant="outline"
                  className="bg-[hsl(170,65%,55%)]/10 hover:bg-[hsl(170,65%,55%)]/20 border-[hsl(170,65%,55%)]/20 text-xs md:text-sm flex-1 sm:flex-initial"
                  onClick={() => markAllAttendanceMutation.mutate("present")}
                  disabled={markAllAttendanceMutation.isPending}
                >
                  <Check className="h-3.5 md:h-4 w-3.5 md:w-4 mr-1 md:mr-2"/>
                  <span className="hidden md:inline">Mark All Present</span>
                  <span className="md:hidden">All Present</span>
                </Button>
                <Button 
                  variant="outline"
                  className="bg-[hsl(0,75%,55%)]/10 hover:bg-[hsl(0,75%,55%)]/20 border-[hsl(0,75%,55%)]/20 text-xs md:text-sm flex-1 sm:flex-initial"
                  onClick={() => markAllAttendanceMutation.mutate("absent")}
                  disabled={markAllAttendanceMutation.isPending}
                >
                  <X className="h-3.5 md:h-4 w-3.5 md:w-4 mr-1 md:mr-2"/>
                  <span className="hidden md:inline">Mark All Absent</span>
                  <span className="md:hidden">All Absent</span>
                </Button>
              </>
            )}
            <Button className="gradient-accent text-accent-foreground shadow-accent text-xs md:text-sm flex-1 sm:flex-initial">
              <Download className="h-3.5 md:h-4 w-3.5 md:w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Export Report</span>
              <span className="md:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        <Card className="shadow-card">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              <Button variant="outline" size="icon" onClick={handlePreviousDay} className="h-8 md:h-10 w-8 md:w-10">
                <ChevronLeft className="h-4 md:h-5 w-4 md:w-5" />
              </Button>
              <div className="flex-1 text-center min-w-0">
                <h2 className="text-sm md:text-lg lg:text-xl font-semibold truncate">{displayDate}</h2>
              </div>
              <Button variant="outline" size="icon" onClick={handleNextDay} className="h-8 md:h-10 w-8 md:w-10">
                <ChevronRight className="h-4 md:h-5 w-4 md:w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-3">
          <Card className="shadow-card border-l-4" style={{ borderLeftColor: "hsl(170, 65%, 55%)" }}>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Present</p>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: "hsl(170, 65%, 45%)" }}>{presentCount}</h3>
                </div>
                <div className="h-10 md:h-12 w-10 md:w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(170, 65%, 55% / 0.1)" }}>
                  <Check className="h-5 md:h-6 w-5 md:w-6" style={{ color: "hsl(170, 65%, 45%)" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4" style={{ borderLeftColor: "hsl(0, 75%, 55%)" }}>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Absent</p>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: "hsl(0, 75%, 45%)" }}>{absentCount}</h3>
                </div>
                <div className="h-10 md:h-12 w-10 md:w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(0, 75%, 55% / 0.1)" }}>
                  <X className="h-5 md:h-6 w-5 md:w-6" style={{ color: "hsl(0, 75%, 45%)" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4" style={{ borderLeftColor: "hsl(15, 95%, 75%)" }}>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Pending</p>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: "hsl(15, 80%, 50%)" }}>{pendingCount}</h3>
                </div>
                <div className="h-10 md:h-12 w-10 md:w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(15, 95%, 75% / 0.1)" }}>
                  <MessageSquare className="h-5 md:h-6 w-5 md:w-6" style={{ color: "hsl(15, 80%, 50%)" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance List */}
        <div className="max-h-[1000px] overflow-y-auto">
        <Card className="shadow-card" >
          <CardHeader className="p-3 md:p-4 lg:p-6">
            <CardTitle className="text-lg md:text-xl">Today's Lessons</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="space-y-4">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No lessons scheduled for this date
                </div>
              ) : (
                <div className="grid gap-2 md:gap-3 lg:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {attendanceRecords.map((record: any, index) => (
                <Card
                  key={record.id}
                  className="border-2 animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-2 md:p-3 lg:p-4">
                    <div className="space-y-2">
                      {/* Row 1: Student name and Status */}
                      <div className="flex items-center gap-2 justify-between">
                        <h3 className="font-bold text-foreground text-xs md:text-sm lg:text-base truncate flex-1">{record.students?.name}</h3>
                        {getStatusBadge(record.status)}
                      </div>
                      {/* Row 2: Time and Subject */}
                      <div className="text-xs md:text-sm text-muted-foreground space-y-0.5">
                        <div className="flex gap-2">
                          <span className="font-medium flex-shrink-0">Time:</span>
                          <span>{record.start_time.substring(0, 5)}</span>
                        </div>
                        <div className="flex gap-2 truncate">
                          <span className="font-medium flex-shrink-0">Subject:</span>
                          <span className="truncate">{record.subject}</span>
                        </div>
                      </div>
                      {/* Row 3: Tutor */}
                      <div className="text-xs md:text-sm text-muted-foreground flex gap-2 truncate">
                        <span className="font-medium flex-shrink-0">Tutor:</span>
                        <span className="truncate">{record.tutors?.name}</span>
                      </div>

                      {record.status === "pending" && (
                        <div className="flex gap-1.5 pt-1.5">
                          <Button
                            size="sm"
                            onClick={() => markAttendanceMutation.mutate({ id: record.id, status: "present" })}
                            style={{ backgroundColor: "hsl(170, 65%, 55%)", color: "white" }}
                            className="hover:opacity-90 text-xs flex-1 h-7 md:h-8"
                          >
                            <Check className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Present</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAttendanceMutation.mutate({ id: record.id, status: "absent" })}
                            style={{ backgroundColor: "hsl(0, 75%, 55%)", color: "white" }}
                            className="hover:opacity-90 text-xs flex-1 h-7 md:h-8"
                          >
                            <X className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Absent</span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {record.status === "present" && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <label className="text-xs font-medium text-foreground mb-1.5 block">
                          Feedback
                        </label>
                        {editingFeedback === record.id ? (
                          <div className="space-y-1.5">
                            <Textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder="Add feedback about the student's progress..."
                              className="min-h-[80px] text-xs"
                            />
                            <div className="flex gap-1.5">
                              <Button 
                                size="sm" 
                                onClick={() => updateFeedbackMutation.mutate({ id: record.id, feedback: feedbackText })}
                                className="text-xs h-7"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingFeedback(null);
                                  setFeedbackText("");
                                }}
                                className="text-xs h-7"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : record.feedback ? (
                          <div
                            className="p-2 rounded-lg bg-muted/50 text-xs cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              setEditingFeedback(record.id);
                              setFeedbackText(record.feedback || "");
                            }}
                          >
                            {record.feedback}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingFeedback(record.id);
                              setFeedbackText("");
                            }}
                            className="text-xs h-7 w-full"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Add Feedback
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))
                }
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
