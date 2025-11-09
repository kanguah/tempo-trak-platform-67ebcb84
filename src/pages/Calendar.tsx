import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, startOfWeek, addDays, isSameWeek } from "date-fns";

const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"];

type Lesson = {
  id: string;
  day: number;
  time: string;
  date: Date;
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
    Piano: "hsl(240 70% 55%)",
    Guitar: "hsl(270 60% 60%)",
    Violin: "hsl(45 90% 60%)",
    Drums: "hsl(25 85% 55%)",
    Voice: "hsl(280 65% 60%)",
    Saxophone: "hsl(210 75% 55%)",
    Flute: "hsl(330 70% 60%)",
    Cello: "hsl(35 80% 50%)",
    Trumpet: "hsl(160 70% 45%)",
    Bass: "hsl(190 75% 50%)",
  };
  return colors[instrument] || "hsl(240 10% 50%)";
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
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch tutors
  const { data: tutors = [] } = useQuery({
    queryKey: ["tutors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tutors").select("*").eq("user_id", user?.id).eq("status", "Active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch lessons
  const { data: lessonsData = [] } = useQuery({
    queryKey: ["lessons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select(`*, students (name, subjects), tutors (name)`)
        .eq("user_id", user?.id)
        .eq("status", "scheduled");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Transform database lessons to UI format with actual dates
  const lessons: Lesson[] = lessonsData.map((lesson: any) => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const lessonDate = addDays(weekStart, lesson.day_of_week - 1);

    return {
      id: lesson.id,
      day: lesson.day_of_week,
      time: lesson.start_time.substring(0, 5),
      date: lessonDate,
      student: lesson.students?.name || "Unknown",
      studentId: lesson.student_id,
      instrument: lesson.subject,
      tutor: lesson.tutors?.name || "Unknown",
      tutorId: lesson.tutor_id,
      duration: lesson.duration,
      room: lesson.room,
    };
  });

  // Get lessons for the week of selected date
  const weekLessons = lessons.filter((lesson) => isSameWeek(lesson.date, selectedDate, { weekStartsOn: 1 }));

  // Group lessons by date
  const lessonsByDate = weekLessons.reduce((acc, lesson) => {
    const dateKey = format(lesson.date, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  // Sort dates and lessons
  const sortedDates = Object.keys(lessonsByDate).sort();
  sortedDates.forEach((date) => {
    lessonsByDate[date].sort((a, b) => a.time.localeCompare(b.time));
  });

  // Add lesson mutation
  const addLessonMutation = useMutation({
    mutationFn: async (lesson: typeof newLesson) => {
      if (!lesson.isRecurring) {
        const { data, error } = await supabase
          .from("lessons")
          .insert({
            user_id: user?.id,
            student_id: lesson.studentId,
            tutor_id: lesson.tutorId,
            subject: lesson.subject,
            day_of_week: parseInt(lesson.day),
            start_time: lesson.time + ":00",
            duration: parseInt(lesson.duration),
            room: lesson.room || null,
            status: "scheduled",
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const lessonsToInsert = [];
        const baseDay = parseInt(lesson.day);
        const occurrences = 4;

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
            status: "scheduled",
          });
        }

        const { data, error } = await supabase.from("lessons").insert(lessonsToInsert).select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      const message = newLesson.isRecurring
        ? `${Array.isArray(data) ? data.length : 1} recurring lessons scheduled!`
        : "Lesson scheduled successfully!";
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
      });
    },
    onError: () => {
      toast.error("Failed to schedule lesson");
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* Left Column - Calendar Picker */}
          <div className="space-y-6">
            <Card className="p-4 shadow-card">
              <CalendarPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
              />
            </Card>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gradient-primary text-primary-foreground shadow-primary h-12 text-base font-semibold">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule New Lesson</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select value={newLesson.studentId} onValueChange={(value) => setNewLesson({ ...newLesson, studentId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tutor</Label>
                    <Select value={newLesson.tutorId} onValueChange={(value) => setNewLesson({ ...newLesson, tutorId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {tutors.map((tutor: any) => (
                          <SelectItem key={tutor.id} value={tutor.id}>
                            {tutor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Instrument</Label>
                    <Select value={newLesson.subject} onValueChange={(value) => setNewLesson({ ...newLesson, subject: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instrument" />
                      </SelectTrigger>
                      <SelectContent>
                        {instruments.map((instrument) => (
                          <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select value={newLesson.day} onValueChange={(value) => setNewLesson({ ...newLesson, day: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                          <SelectItem value="7">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={newLesson.time}
                        onChange={(e) => setNewLesson({ ...newLesson, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={newLesson.duration} onValueChange={(value) => setNewLesson({ ...newLesson, duration: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">120 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Room (Optional)</Label>
                    <Input
                      value={newLesson.room}
                      onChange={(e) => setNewLesson({ ...newLesson, room: e.target.value })}
                      placeholder="e.g., Room 4"
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 border-t pt-4">
                    <Label htmlFor="recurring" className="cursor-pointer">
                      Recurring Lesson
                    </Label>
                    <Switch
                      id="recurring"
                      checked={newLesson.isRecurring}
                      onCheckedChange={(checked) => setNewLesson({ ...newLesson, isRecurring: checked })}
                    />
                  </div>

                  {newLesson.isRecurring && (
                    <div className="space-y-2">
                      <Label>Repeat Pattern</Label>
                      <Select
                        value={newLesson.repeatPattern}
                        onValueChange={(value) => setNewLesson({ ...newLesson, repeatPattern: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly (4 weeks)</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    className="w-full gradient-primary text-primary-foreground"
                    onClick={() => addLessonMutation.mutate(newLesson)}
                    disabled={!newLesson.studentId || !newLesson.tutorId || !newLesson.subject || !newLesson.day || !newLesson.time}
                  >
                    {newLesson.isRecurring ? "Schedule Recurring Lessons" : "Schedule Lesson"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Column - Event List */}
          <div className="space-y-4">
            {sortedDates.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No lessons scheduled for this week</p>
              </Card>
            ) : (
              sortedDates.map((dateKey) => {
                const date = new Date(dateKey);
                const dayLessons = lessonsByDate[dateKey];

                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="sticky top-0 bg-background z-10 py-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {format(date, "EEEE d")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {dayLessons.map((lesson) => (
                        <Card key={lesson.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="text-sm font-medium text-muted-foreground min-w-[60px]">
                              {lesson.time}
                            </div>

                            <div
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: getInstrumentColor(lesson.instrument) }}
                            />

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground mb-1">{lesson.student}</h4>
                              <p className="text-sm text-muted-foreground">{lesson.instrument}</p>
                              {lesson.room && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{lesson.room}</span>
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground text-right">
                              {lesson.duration} min
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
