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

      const dayOfWeek = selectedDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6

      //alert( selectedDate.toISOString().substring(0, 10));
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select(`
          *,
          students (name),
          tutors (name)
        `)
        .eq("user_id", user.id)
        .eq("lesson_date", selectedDate.toISOString().substring(0, 10))
        .eq("status", "scheduled");
          //alert( lessons[0]?.lesson_date);
      if (lessonsError || !lessons) return;

      // Check which lessons already have attendance records
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("lesson_date", formattedDate);

      const existingLessonIds = new Set(existingAttendance?.map(a => a.lesson_id) || []);

      // Create attendance records for lessons that don't have them
      const newAttendanceRecords = lessons
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance marked successfully!");
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
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Attendance & Progress</h1>
            <p className="text-muted-foreground">Track lesson attendance and student feedback</p>
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <>
                <Button 
                  variant="outline"
                  className="bg-[hsl(170,65%,55%)]/10 hover:bg-[hsl(170,65%,55%)]/20 border-[hsl(170,65%,55%)]/20"
                  onClick={() => markAllAttendanceMutation.mutate("present")}
                  disabled={markAllAttendanceMutation.isPending}
                >
                  <Check className="mr-2 h-5 w-5 text-[hsl(170,65%,45%)]" />
                  Mark All Present
                </Button>
                <Button 
                  variant="outline"
                  className="bg-[hsl(0,75%,55%)]/10 hover:bg-[hsl(0,75%,55%)]/20 border-[hsl(0,75%,55%)]/20"
                  onClick={() => markAllAttendanceMutation.mutate("absent")}
                  disabled={markAllAttendanceMutation.isPending}
                >
                  <X className="mr-2 h-5 w-5 text-[hsl(0,75%,45%)]" />
                  Mark All Absent
                </Button>
              </>
            )}
            <Button className="gradient-accent text-accent-foreground shadow-accent">
              <Download className="mr-2 h-5 w-5" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={handlePreviousDay}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">{displayDate}</h2>
              </div>
              <Button variant="outline" size="icon" onClick={handleNextDay}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card border-l-4" style={{ borderLeftColor: "hsl(170, 65%, 55%)" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Present</p>
                  <h3 className="text-3xl font-bold" style={{ color: "hsl(170, 65%, 45%)" }}>{presentCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(170, 65%, 55% / 0.1)" }}>
                  <Check className="h-6 w-6" style={{ color: "hsl(170, 65%, 45%)" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4" style={{ borderLeftColor: "hsl(0, 75%, 55%)" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Absent</p>
                  <h3 className="text-3xl font-bold" style={{ color: "hsl(0, 75%, 45%)" }}>{absentCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(0, 75%, 55% / 0.1)" }}>
                  <X className="h-6 w-6" style={{ color: "hsl(0, 75%, 45%)" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4" style={{ borderLeftColor: "hsl(15, 95%, 75%)" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <h3 className="text-3xl font-bold" style={{ color: "hsl(15, 80%, 50%)" }}>{pendingCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(15, 95%, 75% / 0.1)" }}>
                  <MessageSquare className="h-6 w-6" style={{ color: "hsl(15, 80%, 50%)" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance List */}
        <div className="max-h-[1000px] overflow-y-auto">
        <Card className="shadow-card" >
          <CardHeader>
            <CardTitle>Today's Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No lessons scheduled for this date
                </div>
              ) : (
                <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {attendanceRecords.map((record: any, index) => (
                <Card
                  key={record.id}
                  className="border-2 animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm md:text-base truncate">{record.students?.name}</h3>
                        {getStatusBadge(record.status)}
                      </div>
                      <div className="space-y-1 text-xs md:text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Time:</span> {record.start_time.substring(0, 5)}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Subject:</span> {record.subject}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Tutor:</span> {record.tutors?.name}
                        </div>
                      </div>

                      {record.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => markAttendanceMutation.mutate({ id: record.id, status: "present" })}
                            style={{ backgroundColor: "hsl(170, 65%, 55%)", color: "white" }}
                            className="hover:opacity-90 text-xs flex-1"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAttendanceMutation.mutate({ id: record.id, status: "absent" })}
                            style={{ backgroundColor: "hsl(0, 75%, 55%)", color: "white" }}
                            className="hover:opacity-90 text-xs flex-1"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Absent
                          </Button>
                        </div>
                      )}
                    </div>

                    {record.status === "present" && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <label className="text-xs md:text-sm font-medium text-foreground mb-2 block">
                          Feedback
                        </label>
                        {editingFeedback === record.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder="Add feedback about the student's progress..."
                              className="min-h-[100px]"
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => updateFeedbackMutation.mutate({ id: record.id, feedback: feedbackText })}
                              >
                                Save Feedback
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingFeedback(null);
                                  setFeedbackText("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : record.feedback ? (
                          <div
                            className="p-3 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted transition-colors"
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
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
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
