import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Music, Users, MapPin, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from "date-fns";
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
const getInstrumentColor = (instrument: string) => {
  const colors: Record<string, string> = {
    Piano: "bg-primary text-primary-foreground",
    Guitar: "bg-secondary text-secondary-foreground",
    Violin: "bg-accent text-accent-foreground",
    Drums: "bg-orange-500 text-white",
    Voice: "bg-purple-500 text-white",
    Saxophone: "bg-blue-500 text-white",
    Flute: "bg-pink-500 text-white",
    Cello: "bg-amber-600 text-white",
    Trumpet: "bg-emerald-500 text-white",
    Bass: "bg-cyan-500 text-white"
  };
  return colors[instrument] || "bg-muted text-muted-foreground";
};
function DraggableLesson({
  lesson
}: {
  lesson: Lesson;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: lesson.id
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined;
  return <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`${getInstrumentColor(lesson.instrument)} p-3 rounded-lg h-full shadow-sm cursor-move hover:scale-105 transition-transform`}>
      <div className="flex items-start justify-between mb-1">
        <Music className="h-4 w-4" />
        <Badge variant="outline" className="text-xs border-current">
          {lesson.duration}h
        </Badge>
      </div>
      <p className="font-semibold text-sm mb-1">{lesson.student}</p>
      <p className="text-xs opacity-90">{lesson.instrument}</p>
      <p className="text-xs opacity-75 mt-1">{lesson.tutor}</p>
      {lesson.room && <div className="flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3 opacity-75" />
          <p className="text-xs opacity-75">{lesson.room}</p>
        </div>}
    </div>;
}
function DroppableSlot({
  dayIndex,
  time,
  children
}: {
  dayIndex: number;
  time: string;
  children?: React.ReactNode;
}) {
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id: `${dayIndex}-${time}`
  });
  return <div ref={setNodeRef} className={`min-h-[80px] border-2 rounded-lg p-2 transition-colors ${isOver ? "bg-primary/10 border-primary" : "border-border hover:bg-muted/50"}`}>
      {children}
    </div>;
}
export default function Calendar() {
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), {
    weekStartsOn: 1
  }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
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

  // Transform database lessons to UI format
  const lessons: Lesson[] = lessonsData.map((lesson: any) => ({
    id: lesson.id,
    day: lesson.day_of_week,
    time: lesson.start_time.substring(0, 5),
    // Convert "HH:MM:SS" to "HH:MM"
    student: lesson.students?.name || "Unknown",
    studentId: lesson.student_id,
    instrument: lesson.subject,
    tutor: lesson.tutors?.name || "Unknown",
    tutorId: lesson.tutor_id,
    duration: lesson.duration / 60,
    // Convert minutes to hours
    room: lesson.room
  }));

  // Filter lessons by selected instrument
  const filteredLessons = selectedInstrument ? lessons.filter(lesson => lesson.instrument === selectedInstrument) : lessons;
  const handleInstrumentClick = (instrument: string) => {
    setSelectedInstrument(selectedInstrument === instrument ? null : instrument);
  };
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };
  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };
  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), {
      weekStartsOn: 1
    }));
  };
  const weekEnd = endOfWeek(currentWeekStart, {
    weekStartsOn: 1
  });
  const currentWeekDisplay = `${format(currentWeekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

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

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({
      id,
      day,
      time
    }: {
      id: string;
      day: number;
      time: string;
    }) => {
      const {
        data,
        error
      } = await supabase.from("lessons").update({
        day_of_week: day,
        start_time: time + ":00"
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lessons"]
      });
      toast.success("Lesson rescheduled successfully!");
    },
    onError: error => {
      toast.error("Failed to reschedule lesson");
      console.error(error);
    }
  });
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }));
  const checkConflict = (updatedLesson: {
    day: number;
    time: string;
    tutorId: string;
    studentId: string;
    room?: string;
  }, excludeId?: string) => {
    return filteredLessons.some(lesson => {
      if (excludeId && lesson.id === excludeId) return false;
      if (lesson.day !== updatedLesson.day || lesson.time !== updatedLesson.time) return false;
      return lesson.tutorId === updatedLesson.tutorId || lesson.studentId === updatedLesson.studentId || lesson.room && lesson.room === updatedLesson.room;
    });
  };
  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    setActiveId(null);
    if (!over) return;
    const lessonId = active.id as string;
    const [dayIndex, time] = (over.id as string).split("-");
    const lesson = filteredLessons.find(l => l.id === lessonId);
    if (!lesson) return;
    const updatedLesson = {
      day: parseInt(dayIndex),
      time,
      tutorId: lesson.tutorId,
      studentId: lesson.studentId,
      room: lesson.room
    };
    if (checkConflict(updatedLesson, lessonId)) {
      toast.error("Conflict detected! Tutor, student, or room already booked at this time.");
      return;
    }
    updateLessonMutation.mutate({
      id: lessonId,
      day: updatedLesson.day,
      time: updatedLesson.time
    });
  };
  const handleAutoMatch = () => {
    toast.success("Auto-matching tutors to students based on availability and expertise...");
    // Simulation of auto-matching
    setTimeout(() => {
      toast.success("3 new lessons scheduled automatically!");
    }, 1500);
  };
  const handleBulkSchedule = () => {
    toast.success("Processing bulk schedule...");
    // Simulation of bulk scheduling
    setTimeout(() => {
      toast.success("15 lessons scheduled across the week!");
      setBulkDialogOpen(false);
    }, 2000);
  };
  const activeDragLesson = activeId ? filteredLessons.find(l => l.id === activeId) : null;
  return <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Intelligent Scheduler</h1>
            <p className="text-muted-foreground">Drag & drop lessons with smart conflict detection</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
              <DialogTrigger asChild>
                
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Automatic Tutor-Student Matching</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Match Criteria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select criteria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="availability">By Availability</SelectItem>
                        <SelectItem value="expertise">By Expertise Match</SelectItem>
                        <SelectItem value="location">By Location</SelectItem>
                        <SelectItem value="student-pref">Student Preferences</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time Range</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="this-week">This Week</SelectItem>
                        <SelectItem value="next-week">Next Week</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAutoMatch} className="w-full gradient-primary text-primary-foreground">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run Auto Match
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="shadow-sm">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Bulk Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Scheduling</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="recurring">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="recurring">Recurring</TabsTrigger>
                    <TabsTrigger value="multiple">Multiple Lessons</TabsTrigger>
                  </TabsList>
                  <TabsContent value="recurring" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Repeat Pattern</Label>
                      <Select>
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
                    <div className="space-y-2">
                      <Label>Number of Occurrences</Label>
                      <Input type="number" placeholder="10" defaultValue="10" />
                    </div>
                    <Button onClick={handleBulkSchedule} className="w-full gradient-primary text-primary-foreground">
                      Schedule Recurring Lessons
                    </Button>
                  </TabsContent>
                  <TabsContent value="multiple" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Students (Multiple)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose students" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          <SelectItem value="piano">Piano Students</SelectItem>
                          <SelectItem value="guitar">Guitar Students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Preference</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (8-12)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12-17)</SelectItem>
                          <SelectItem value="evening">Evening (17-19)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleBulkSchedule} className="w-full gradient-primary text-primary-foreground">
                      Schedule All
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground shadow-primary">
                  <Plus className="mr-2 h-5 w-5" />
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

                  <Button className="w-full gradient-primary text-primary-foreground" onClick={() => addLessonMutation.mutate(newLesson)} disabled={!newLesson.studentId || !newLesson.tutorId || !newLesson.subject || !newLesson.day || !newLesson.time}>
                    {newLesson.isRecurring ? "Schedule Monthly Lessons" : "Schedule Lesson"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{currentWeekDisplay}</CardTitle>
                <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                  Today
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="font-semibold text-center text-muted-foreground">Time</div>
                    {daysOfWeek.map(day => <div key={day} className="font-semibold text-center p-2 rounded-lg bg-muted">
                        {day}
                      </div>)}
                  </div>

                  {/* Time Slots Grid */}
                  <div className="space-y-1">
                    {timeSlots.map(time => <div key={time} className="grid grid-cols-8 gap-2">
                        <div className="text-sm text-muted-foreground text-center py-4 font-medium">{time}</div>
                        {daysOfWeek.map((_, dayIndex) => {
                      const lesson = filteredLessons.find(l => l.day === dayIndex && l.time === time);
                      return <DroppableSlot key={`${dayIndex}-${time}`} dayIndex={dayIndex} time={time}>
                              {lesson && <DraggableLesson lesson={lesson} />}
                            </DroppableSlot>;
                    })}
                      </div>)}
                  </div>
                </div>
              </div>

              <DragOverlay>
                {activeDragLesson && <div className={`${getInstrumentColor(activeDragLesson.instrument)} p-3 rounded-lg shadow-lg w-40`}>
                    <div className="flex items-start justify-between mb-1">
                      <Music className="h-4 w-4" />
                      <Badge variant="outline" className="text-xs border-current">
                        {activeDragLesson.duration}h
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm mb-1">{activeDragLesson.student}</p>
                    <p className="text-xs opacity-90">{activeDragLesson.instrument}</p>
                    <p className="text-xs opacity-75 mt-1">{activeDragLesson.tutor}</p>
                  </div>}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>

        {/* Room Allocation & Legend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Room Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rooms.map(room => {
                // Get current day index (0=Mon, 6=Sun)
                const today = new Date().getDay();
                const currentDayIndex = today === 0 ? 6 : today - 1;
                const roomLessons = lessons.filter(l => l.room === room && l.day === currentDayIndex);
                return <div key={room} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="font-medium">{room}</span>
                      <Badge variant="secondary">{roomLessons.length}</Badge>
                    </div>;
              })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Instrument Legend
                {selectedInstrument && <Badge variant="outline" className="ml-auto">
                    Filtering: {selectedInstrument}
                  </Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"].map(instrument => {
                const count = lessons.filter(l => l.instrument === instrument).length;
                return <Badge key={instrument} className={`${getInstrumentColor(instrument)} cursor-pointer transition-all hover:scale-105 ${selectedInstrument === instrument ? "ring-2 ring-foreground ring-offset-2" : ""} flex items-center gap-2`} onClick={() => handleInstrumentClick(instrument)}>
                      {instrument}
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-xs font-semibold">
                        {count}
                      </span>
                    </Badge>;
              })}
              </div>
              {selectedInstrument && <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setSelectedInstrument(null)}>
                  Clear Filter
                </Button>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}