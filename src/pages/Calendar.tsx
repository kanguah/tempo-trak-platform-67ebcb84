import { useState } from "react";
import { Plus, Clock, Music, MapPin, MoreVertical, X, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = Array.from({
  length: 22
}, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});
const rooms = ["Room 4", "Room 3"];
const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Cello", "Trumpet", "Bass"];
type Lesson = {
  id: string;
  day: number;
  time: string;
  student: string;
  studentId: string;
  instrument: string;
  tutor: string;
  tutorId: string;
  duration: number;
  room?: string;
};
type LessonWithDate = {
  id: string;
  date: Date;
  time: string;
  student: string;
  studentId: string;
  instrument: string;
  tutor: string;
  tutorId: string;
  duration: number;
  room?: string;
};

const getInstrumentColor = (instrument: string) => {
  const colors: Record<string, string> = {
    Piano: "240 70% 55%",
    Guitar: "270 60% 60%",
    Violin: "45 90% 60%",
    Drums: "25 85% 55%",
    Voice: "280 65% 60%",
    Saxophone: "210 80% 55%",
    Flute: "330 75% 65%",
    Cello: "35 85% 50%",
    Trumpet: "160 70% 50%",
    Bass: "190 75% 55%"
  };
  return colors[instrument] || "240 10% 50%";
};
export default function Calendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [makeupDialogOpen, setMakeupDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonWithDate | null>(null);
  const [makeupDate, setMakeupDate] = useState<Date | undefined>(undefined);
  const [makeupTime, setMakeupTime] = useState("");
  const [newLesson, setNewLesson] = useState({
    studentId: "",
    tutorId: "",
    subject: "",
    day: "",
    time: "",
    duration: "60",
    room: "Room 4",
    isRecurring: false,
    repeatPattern: "weekly",
    occurrences: "4"
  });
  const [lessonSlots, setLessonSlots] = useState<Array<{
    day: string;
    time: string;
    tutorId: string;
    room: string;
  }>>([{ day: "", time: "", tutorId: "", room: "" }]);

  // Fetch students
  const {
    data: students = []
  } = useQuery({
    queryKey: ["students", user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("students").select("*").eq("user_id", user?.id).eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch tutors
  const {
    data: tutors = []
  } = useQuery({
    queryKey: ["tutors", user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tutors").select("*").eq("user_id", user?.id).eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Generate lesson instances for the current month if needed
  const generateInstancesMutation = useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const { data, error } = await supabase.functions.invoke("generate-lesson-instances", {
        body: { year, month },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log(`Generated ${data.generated} lesson instances`);
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
    onError: (error) => {
      console.error("Error generating lesson instances:", error);
      toast.error("Failed to generate lesson instances");
    },
  });

  // Fetch lessons
  const {
    data: lessonsData = [],
    isLoading
  } = useQuery({
    queryKey: ["lessons", user?.id, selectedDate.getMonth(), selectedDate.getFullYear()],
    queryFn: async () => {
      // Get first and last day of the current month
      const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      // First, try to generate instances for this month
      try {
        await generateInstancesMutation.mutateAsync({
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
        });
      } catch (error) {
        console.error("Error generating instances:", error);
      }
      
      const {
        data,
        error
      } = await supabase.from("lessons").select(`
          *,
          students (name, subjects),
          tutors (name)
        `).eq("user_id", user?.id)
        .eq("status", "scheduled")
        .gte("lesson_date", firstDay.toISOString().split('T')[0])
        .lte("lesson_date", lastDay.toISOString().split('T')[0]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Transform database lessons to UI format with actual dates
  const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const lessonsWithDates: LessonWithDate[] = lessonsData.map((lesson: any) => {
    // Use lesson_date if available, otherwise calculate from day_of_week (for backward compatibility)
    const lessonDate = lesson.lesson_date 
      ? parseISO(lesson.lesson_date)
      : addDays(currentWeekStart, lesson.day_of_week);
    
    return {
      id: lesson.id,
      date: lessonDate,
      time: lesson.start_time.substring(0, 5),
      student: lesson.students?.name || "Unknown",
      studentId: lesson.student_id,
      instrument: lesson.subject,
      tutor: lesson.tutors?.name || "Unknown",
      tutorId: lesson.tutor_id,
      duration: lesson.duration / 60,
      room: lesson.room
    };
  });

  // Group lessons by date
  const lessonsByDate = lessonsWithDates.reduce((acc, lesson) => {
    const dateKey = format(lesson.date, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(lesson);
    return acc;
  }, {} as Record<string, LessonWithDate[]>);

  // Sort dates and get lessons for selected date and upcoming days
  const sortedDates = Object.keys(lessonsByDate).sort();
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");

  // Add lesson mutation
  const addLessonMutation = useMutation({
    mutationFn: async (lesson: typeof newLesson) => {
      if (!lesson.isRecurring) {
        // For single lessons, create instances directly
        const lessonsToInsert = [];
        
        for (const slot of lessonSlots) {
          if (!slot.day || !slot.time) continue;
          
          lessonsToInsert.push({
            user_id: user?.id,
            student_id: lesson.studentId,
            tutor_id: slot.tutorId || lesson.tutorId,
            subject: lesson.subject,
            day_of_week: parseInt(slot.day),
            start_time: slot.time + ":00",
            duration: parseInt(lesson.duration),
            room: slot.room || lesson.room || null,
            status: "scheduled"
          });
        }
        
        if (lessonsToInsert.length === 0) {
          throw new Error("Please complete at least one lesson slot");
        }
        
        const { data, error } = await supabase
          .from("lessons")
          .insert(lessonsToInsert)
          .select();
        
        if (error) throw error;
        return { type: 'lessons', data };
      } else {
        // For recurring lessons, create recurrence rules only
        const rulesToInsert = [];
        const currentDate = new Date();
        
        for (const slot of lessonSlots) {
          if (!slot.day || !slot.time) continue;
          
          rulesToInsert.push({
            user_id: user?.id,
            student_id: lesson.studentId,
            tutor_id: slot.tutorId || lesson.tutorId,
            subject: lesson.subject,
            day_of_week: parseInt(slot.day),
            start_time: slot.time + ":00",
            duration: parseInt(lesson.duration),
            room: slot.room || lesson.room || null,
            recurrence_type: lesson.repeatPattern,
            start_date: format(currentDate, 'yyyy-MM-dd'),
            status: "active"
          });
        }
        
        if (rulesToInsert.length === 0) {
          throw new Error("Please complete at least one lesson slot");
        }
        
        const { data, error } = await supabase
          .from("lesson_recurrence_rules")
          .insert(rulesToInsert)
          .select();
        
        if (error) throw error;
        
        // Generate instances for the current month
        await generateInstancesMutation.mutateAsync({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
        });
        
        return { type: 'rules', data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons"]
      });
      
      const message = result.type === 'rules' 
        ? `Recurring lesson schedule created! Instances will be generated automatically each month.`
        : `${Array.isArray(result.data) ? result.data.length : 1} lesson(s) scheduled successfully!`;
      
      toast.success(message);
      setAddDialogOpen(false);
      setNewLesson({
        studentId: "",
        tutorId: "",
        subject: "",
        day: "",
        time: "",
        duration: "60",
        room: "Room 4",
        isRecurring: false,
        repeatPattern: "weekly",
        occurrences: "4"
      });
      setLessonSlots([{ day: "", time: "", tutorId: "", room: "" }]);
    },
    onError: error => {
      toast.error("Failed to schedule lesson");
      console.error(error);
    }
  });

  // Mutation to cancel lesson
  const cancelLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from("lessons")
        .update({ status: "cancelled" })
        .eq("id", lessonId);
      
      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user?.id,
        type: "schedule_change",
        title: "Lesson Cancelled",
        message: `${selectedLesson?.instrument} lesson with ${selectedLesson?.student} on ${format(selectedLesson?.date || new Date(), "MMM d")} at ${selectedLesson?.time} has been cancelled.`,
        is_read: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson cancelled successfully");
      setCancelDialogOpen(false);
      setSelectedLesson(null);
    },
    onError: (error) => {
      toast.error("Failed to cancel lesson");
      console.error("Error cancelling lesson:", error);
    }
  });

  // Mutation to schedule makeup lesson
  const scheduleMakeupMutation = useMutation({
    mutationFn: async () => {
      if (!makeupDate || !makeupTime || !selectedLesson) return;

      const dayOfWeek = makeupDate.getDay();
      
      const { error } = await supabase.from("lessons").insert({
        user_id: user?.id,
        student_id: selectedLesson.studentId,
        tutor_id: selectedLesson.tutorId,
        subject: selectedLesson.instrument,
        day_of_week: dayOfWeek,
        start_time: makeupTime + ":00",
        lesson_date: format(makeupDate, "yyyy-MM-dd"),
        duration: selectedLesson.duration * 60,
        room: selectedLesson.room,
        status: "scheduled"
      });

      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user?.id,
        type: "schedule_change",
        title: "Makeup Lesson Scheduled",
        message: `Makeup ${selectedLesson.instrument} lesson with ${selectedLesson.student} scheduled for ${format(makeupDate, "MMM d")} at ${makeupTime}.`,
        is_read: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Makeup lesson scheduled successfully");
      setMakeupDialogOpen(false);
      setSelectedLesson(null);
      setMakeupDate(undefined);
      setMakeupTime("");
    },
    onError: (error) => {
      toast.error("Failed to schedule makeup lesson");
      console.error("Error scheduling makeup:", error);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
              <Badge variant="default" className="text-sm px-3 py-1">
                {lessonsByDate[selectedDateKey]?.length || 0}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Manage your lessons and appointments</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Lesson
              </Button>
            </DialogTrigger>
              <DialogContent className="max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Schedule New Lesson</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select value={newLesson.studentId} onValueChange={value => {
                    const student = students.find(s => s.id === value);
                    // Determine number of lessons based on package type
                    let numLessons = 1;
                    if (student?.package_type) {
                      const packageMatch = student.package_type.match(/(\d+)/);
                      if (packageMatch) {
                        numLessons = parseInt(packageMatch[1]);
                      }
                    }
                    
                    // Initialize lesson slots based on package type
                    const slots = Array.from({ length: numLessons }, () => ({
                      day: "",
                      time: "",
                      tutorId: "",
                      room: ""
                    }));
                    
                    setNewLesson({
                      ...newLesson,
                      studentId: value,
                      subject: student?.subjects?.[0] || ""
                    });
                    setLessonSlots(slots);
                  }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => <SelectItem key={student.id} value={student.id}>
                            {student.name} {student.package_type ? `(${student.package_type})` : ""}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Tutor</Label>
                    <Select value={newLesson.tutorId} onValueChange={value => setNewLesson({
                    ...newLesson,
                    tutorId: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {tutors.map(tutor => <SelectItem key={tutor.id} value={tutor.id}>
                            {tutor.name} ({tutor.subjects?.join(", ")})
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Instrument</Label>
                    <Select value={newLesson.subject} onValueChange={value => setNewLesson({
                    ...newLesson,
                    subject: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instrument" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {instruments.map(instrument => <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Room (optional)</Label>
                    <Select value={newLesson.room} onValueChange={value => setNewLesson({
                    ...newLesson,
                    room: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map(room => <SelectItem key={room} value={room}>
                            {room}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lesson Slots based on package type */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Lesson Schedule ({lessonSlots.length} {lessonSlots.length === 1 ? "lesson" : "lessons"} per week)</Label>
                    </div>
                    
                    {lessonSlots.map((slot, index) => (
                      <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Lesson {index + 1}</Label>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Day</Label>
                            <Select 
                              value={slot.day} 
                              onValueChange={value => {
                                const newSlots = [...lessonSlots];
                                newSlots[index].day = value;
                                setLessonSlots(newSlots);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                              <SelectContent>
                                {daysOfWeek.map((day, idx) => (
                                  <SelectItem key={day} value={idx.toString()}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Time</Label>
                            <Select 
                              value={slot.time} 
                              onValueChange={value => {
                                const newSlots = [...lessonSlots];
                                newSlots[index].time = value;
                                setLessonSlots(newSlots);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map(time => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Tutor (override)</Label>
                            <Select 
                              value={slot.tutorId} 
                              onValueChange={value => {
                                const newSlots = [...lessonSlots];
                                newSlots[index].tutorId = value;
                                setLessonSlots(newSlots);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Use default" />
                              </SelectTrigger>
                              <SelectContent>
                                {tutors.map(tutor => (
                                  <SelectItem key={tutor.id} value={tutor.id}>
                                    {tutor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Room (override)</Label>
                            <Select 
                              value={slot.room} 
                              onValueChange={value => {
                                const newSlots = [...lessonSlots];
                                newSlots[index].room = value;
                                setLessonSlots(newSlots);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Use default" />
                              </SelectTrigger>
                              <SelectContent>
                                {rooms.map(room => (
                                  <SelectItem key={room} value={room}>
                                    {room}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Select value={newLesson.duration} onValueChange={value => setNewLesson({
                    ...newLesson,
                    duration: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes (1 hour)</SelectItem>
                        <SelectItem value="90">90 minutes (1.5 hours)</SelectItem>
                        <SelectItem value="120">120 minutes (2 hours)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between space-x-2 border-t pt-4">
                    <Label htmlFor="recurring" className="cursor-pointer">
                      Recurring Lesson
                    </Label>
                    <Switch id="recurring" checked={newLesson.isRecurring} onCheckedChange={checked => setNewLesson({
                    ...newLesson,
                    isRecurring: checked
                  })} />
                  </div>

                  {newLesson.isRecurring && <>
                      <div className="space-y-2">
                        <Label>Repeat Pattern</Label>
                        <Select value={newLesson.repeatPattern} onValueChange={value => setNewLesson({
                      ...newLesson,
                      repeatPattern: value
                    })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pattern" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>}

                  <Button 
                    className="w-full gradient-primary text-primary-foreground" 
                    onClick={() => addLessonMutation.mutate(newLesson)} 
                    disabled={
                      !newLesson.studentId || 
                      !newLesson.subject || 
                      lessonSlots.some(slot => !slot.day || !slot.time) ||
                      (!newLesson.tutorId && lessonSlots.some(slot => !slot.tutorId))
                    }
                  >
                    {newLesson.isRecurring 
                      ? `Create Recurring Schedule` 
                      : `Schedule ${lessonSlots.length} Lesson${lessonSlots.length > 1 ? 's' : ''}`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 auto-rows-start">
        {/* Left: Calendar Picker */}
        <div className="space-y-4 h-[calc(100vh-180px)] overflow-y-auto pr-2">
          <Card className="p-4">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md"
              modifiers={{
                hasLesson: lessonsWithDates.map(lesson => lesson.date)
              }}
              modifiersClassNames={{
                hasLesson: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
              }}
            />
          </Card>

          {/* Room Allocation for Selected Date */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Room Allocation
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {format(selectedDate, "MMMM d, yyyy")}
            </p>
            <div className="space-y-2">
              {rooms.map((room) => {
                const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
                const roomLessons = lessonsWithDates.filter(
                  (l) => l.room === room && format(l.date, "yyyy-MM-dd") === selectedDateKey
                ).length;
                return (
                  <div key={room} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium text-foreground">{room}</span>
                    <span className="text-sm font-semibold text-primary">{roomLessons}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Instrument Legend */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Instruments</h3>
            <div className="space-y-2 max-h-28 overflow-y-auto">
              {[...instruments]
  .map((instrument) => {
    const count = lessonsWithDates.filter(
      (l) => l.instrument === instrument && isSameDay(l.date, selectedDate)
    ).length;

    return { instrument, count };
  })
  .sort((a, b) => b.count - a.count) // DESCENDING (highest count first)
  .map(({ instrument, count }) => {
    const color = getInstrumentColor(instrument);

    return (
      <div key={instrument} className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: `hsl(${color})` }}
          />
          <span className="text-foreground">{instrument}</span>
        </div>
        <span className="text-muted-foreground">{count}</span>
      </div>
    );
  })}

            </div>
          </Card>
        </div>

        {/* Right: Event List */}
        <Card className="p-6 flex flex-col h-[calc(100vh-180px)]">
          <div className="space-y-6 overflow-y-auto pr-2 flex-1">
            {sortedDates
              .filter((dateKey) => {
                const date = parseISO(dateKey);
                return date >= selectedDate || isSameDay(date, selectedDate);
              })
              .slice(0, 7)
              .map((dateKey) => {
                const date = parseISO(dateKey);
                const dayLessons = lessonsByDate[dateKey].sort((a, b) => 
                  a.time.localeCompare(b.time)
                );
                
                return (
                  <div key={dateKey}>
                    {/* Date Header */}
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {format(date, "EEEE d")}
                      </h3>
                    </div>

                    {/* Lessons for this date */}
                    <div className="space-y-3">
                      {dayLessons.map((lesson) => {
                        const color = getInstrumentColor(lesson.instrument);
                        const endTime = `${parseInt(lesson.time.split(':')[0]) + lesson.duration}:${lesson.time.split(':')[1]}`;
                        
                        return (
                          <div
                            key={lesson.id}
                            className="flex gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            {/* Time */}
                            <div className="flex flex-col items-center min-w-[60px]">
                              <span className="text-sm font-medium text-foreground">{lesson.time}</span>
                              <span className="text-xs text-muted-foreground">{endTime}</span>
                            </div>

                            {/* Color indicator */}
                            <div className="flex items-start pt-1">
                              <div 
                                className="w-1 h-full rounded-full" 
                                style={{ backgroundColor: `hsl(${color})` }}
                              />
                            </div>

                            {/* Lesson details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground mb-1">{lesson.student}</h4>
                              <p className="text-sm text-muted-foreground">{lesson.instrument}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Music className="h-3 w-3" />
                                  <span>{lesson.tutor}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{lesson.room || "No room"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{lesson.duration}h</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLesson(lesson);
                                    setCancelDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Lesson
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLesson(lesson);
                                    setMakeupDialogOpen(true);
                                  }}
                                >
                                  <CalendarIcon className="h-4 w-4 mr-2" />
                                  Schedule Makeup
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {sortedDates.length === 0 && (
              <div className="text-center py-12">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No lessons scheduled</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>

    {/* Cancel Lesson Dialog */}
    <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Lesson</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this lesson?
            {selectedLesson && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <p className="font-medium text-foreground">{selectedLesson.student}</p>
                <p className="text-muted-foreground">{selectedLesson.instrument}</p>
                <p className="text-muted-foreground">{format(selectedLesson.date, "MMMM d, yyyy")} at {selectedLesson.time}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Lesson</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => selectedLesson && cancelLessonMutation.mutate(selectedLesson.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Cancel Lesson
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Schedule Makeup Dialog */}
    <Dialog open={makeupDialogOpen} onOpenChange={setMakeupDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Makeup Lesson</DialogTitle>
        </DialogHeader>
        {selectedLesson && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium text-foreground">{selectedLesson.student}</p>
              <p className="text-muted-foreground">{selectedLesson.instrument}</p>
              <p className="text-muted-foreground">Original: {format(selectedLesson.date, "MMM d")} at {selectedLesson.time}</p>
            </div>

            <div className="space-y-2">
              <Label>Select Date</Label>
              <CalendarPicker
                mode="single"
                selected={makeupDate}
                onSelect={setMakeupDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Time</Label>
              <Select value={makeupTime} onValueChange={setMakeupTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={() => scheduleMakeupMutation.mutate()}
              disabled={!makeupDate || !makeupTime}
            >
              Schedule Makeup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>
  );
}