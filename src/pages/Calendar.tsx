import { useState } from "react";
import { Plus, Clock, Music, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = Array.from({
  length: 22
}, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});
const rooms = ["Room 4", "Room 3"];
const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"];
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
  const [newLesson, setNewLesson] = useState({
    studentId: "",
    tutorId: "",
    subject: "",
    day: "",
    time: "",
    duration: "60",
    room: "",
    isRecurring: false,
    repeatPattern: "weekly",
    occurrences: "4"
  });

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
      } = await supabase.from("tutors").select("*").eq("user_id", user?.id).eq("status", "Active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch lessons
  const {
    data: lessonsData = [],
    isLoading
  } = useQuery({
    queryKey: ["lessons", user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("lessons").select(`
          *,
          students (name, subjects),
          tutors (name)
        `).eq("user_id", user?.id).eq("status", "scheduled");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Transform database lessons to UI format with actual dates
  const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const lessonsWithDates: LessonWithDate[] = lessonsData.map((lesson: any) => {
    const lessonDate = addDays(currentWeekStart, lesson.day_of_week);
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
        // Single lesson
        const {
          data,
          error
        } = await supabase.from("lessons").insert({
          user_id: user?.id,
          student_id: lesson.studentId,
          tutor_id: lesson.tutorId,
          subject: lesson.subject,
          day_of_week: parseInt(lesson.day),
          start_time: lesson.time + ":00",
          duration: parseInt(lesson.duration),
          room: lesson.room || null,
          status: "scheduled"
        }).select().single();
        if (error) throw error;
        return data;
      } else {
        // Multiple recurring lessons (4 weeks = 1 month)
        const lessonsToInsert = [];
        const baseDay = parseInt(lesson.day);
        const occurrences = 4; // Fixed to 4 weeks for a month
        const weekIncrement = lesson.repeatPattern === "weekly" ? 1 : lesson.repeatPattern === "biweekly" ? 2 : 4;
        for (let i = 0; i < occurrences; i++) {
          lessonsToInsert.push({
            user_id: user?.id,
            student_id: lesson.studentId,
            tutor_id: lesson.tutorId,
            subject: lesson.subject,
            day_of_week: baseDay,
            start_time: lesson.time + ":00",
            duration: parseInt(lesson.duration),
            room: lesson.room || null,
            status: "scheduled"
          });
        }
        const {
          data,
          error
        } = await supabase.from("lessons").insert(lessonsToInsert).select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ["lessons"]
      });
      const message = newLesson.isRecurring ? `${Array.isArray(data) ? data.length : 1} recurring lessons scheduled successfully!` : "Lesson scheduled successfully!";
      toast.success(message);
      setAddDialogOpen(false);
      setNewLesson({
        studentId: "",
        tutorId: "",
        subject: "",
        day: "",
        time: "",
        duration: "60",
        room: "",
        isRecurring: false,
        repeatPattern: "weekly",
        occurrences: "4"
      });
    },
    onError: error => {
      toast.error("Failed to schedule lesson");
      console.error(error);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your lessons and appointments</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
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
                    setNewLesson({
                      ...newLesson,
                      studentId: value,
                      subject: student?.subjects?.[0] || ""
                    });
                  }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tutor</Label>
                    <Select value={newLesson.tutorId} onValueChange={value => setNewLesson({
                    ...newLesson,
                    tutorId: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tutor" />
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
                    <Label>Room</Label>
                    <Select value={newLesson.room} onValueChange={value => setNewLesson({
                    ...newLesson,
                    room: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map(room => <SelectItem key={room} value={room}>
                            {room}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select value={newLesson.day} onValueChange={value => setNewLesson({
                      ...newLesson,
                      day: value
                    })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map((day, idx) => <SelectItem key={day} value={idx.toString()}>
                              {day}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select value={newLesson.time} onValueChange={value => setNewLesson({
                      ...newLesson,
                      time: value
                    })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(time => <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
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
                    disabled={!newLesson.studentId || !newLesson.tutorId || !newLesson.subject || !newLesson.day || !newLesson.time}
                  >
                    {newLesson.isRecurring ? "Schedule Monthly Lessons" : "Schedule Lesson"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Calendar Picker */}
        <div className="space-y-4">
          <Card className="p-4">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md"
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
            <div className="space-y-2">
              {instruments.map((instrument) => {
                const count = lessonsWithDates.filter((l) => l.instrument === instrument).length;
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
        <Card className="p-6">
          <div className="space-y-6">
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
                                {lesson.room && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{lesson.room}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{lesson.duration}h</span>
                                </div>
                              </div>
                            </div>
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
  </div>
  );
}