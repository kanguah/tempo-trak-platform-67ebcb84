import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Music, Users, MapPin, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = Array.from({ length: 11 }, (_, i) => `${8 + i}:00`);

const rooms = ["Room A", "Room B", "Room C", "Studio 1", "Studio 2"];

type Lesson = {
  id: string;
  day: number;
  time: string;
  student: string;
  instrument: string;
  tutor: string;
  duration: number;
  room?: string;
};

const initialLessons: Lesson[] = [
  { id: "1", day: 0, time: "09:00", student: "Sarah Johnson", instrument: "Piano", tutor: "Mr. Kofi", duration: 1, room: "Room A" },
  { id: "2", day: 0, time: "14:00", student: "Emma Williams", instrument: "Violin", tutor: "Mr. Kwame", duration: 1, room: "Studio 1" },
  { id: "3", day: 1, time: "10:00", student: "Michael Chen", instrument: "Guitar", tutor: "Ms. Ama", duration: 1.5, room: "Room B" },
  { id: "4", day: 1, time: "15:00", student: "David Brown", instrument: "Drums", tutor: "Mr. Yaw", duration: 1, room: "Studio 2" },
  { id: "5", day: 2, time: "09:00", student: "Sophia Martinez", instrument: "Voice", tutor: "Ms. Abena", duration: 1, room: "Room C" },
  { id: "6", day: 2, time: "13:00", student: "James Wilson", instrument: "Piano", tutor: "Mr. Kofi", duration: 1, room: "Room A" },
  { id: "7", day: 3, time: "11:00", student: "Sarah Johnson", instrument: "Piano", tutor: "Mr. Kofi", duration: 1, room: "Room A" },
  { id: "8", day: 4, time: "16:00", student: "Emma Williams", instrument: "Violin", tutor: "Mr. Kwame", duration: 1, room: "Studio 1" },
];

const getInstrumentColor = (instrument: string) => {
  const colors: Record<string, string> = {
    Piano: "bg-primary text-primary-foreground",
    Guitar: "bg-secondary text-secondary-foreground",
    Violin: "bg-accent text-accent-foreground",
    Drums: "bg-primary/80 text-primary-foreground",
    Voice: "bg-secondary/70 text-secondary-foreground",
  };
  return colors[instrument] || "bg-muted text-muted-foreground";
};

function DraggableLesson({ lesson }: { lesson: Lesson }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lesson.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${getInstrumentColor(lesson.instrument)} p-3 rounded-lg h-full shadow-sm cursor-move hover:scale-105 transition-transform`}
    >
      <div className="flex items-start justify-between mb-1">
        <Music className="h-4 w-4" />
        <Badge variant="outline" className="text-xs border-current">
          {lesson.duration}h
        </Badge>
      </div>
      <p className="font-semibold text-sm mb-1">{lesson.student}</p>
      <p className="text-xs opacity-90">{lesson.instrument}</p>
      <p className="text-xs opacity-75 mt-1">{lesson.tutor}</p>
      {lesson.room && (
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3 opacity-75" />
          <p className="text-xs opacity-75">{lesson.room}</p>
        </div>
      )}
    </div>
  );
}

function DroppableSlot({ dayIndex, time, children }: { dayIndex: number; time: string; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${dayIndex}-${time}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] border-2 rounded-lg p-2 transition-colors ${
        isOver ? "bg-primary/10 border-primary" : "border-border hover:bg-muted/50"
      }`}
    >
      {children}
    </div>
  );
}

export default function Calendar() {
  const [currentWeek, setCurrentWeek] = useState("June 3-9, 2024");
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const checkConflict = (newLesson: Lesson, excludeId?: string) => {
    return lessons.some((lesson) => {
      if (excludeId && lesson.id === excludeId) return false;
      if (lesson.day !== newLesson.day || lesson.time !== newLesson.time) return false;
      return lesson.tutor === newLesson.tutor || lesson.student === newLesson.student || lesson.room === newLesson.room;
    });
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const lessonId = active.id as string;
    const [dayIndex, time] = (over.id as string).split("-");
    const lesson = lessons.find((l) => l.id === lessonId);

    if (!lesson) return;

    const updatedLesson = {
      ...lesson,
      day: parseInt(dayIndex),
      time,
    };

    if (checkConflict(updatedLesson, lessonId)) {
      toast.error("Conflict detected! Tutor, student, or room already booked at this time.");
      return;
    }

    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? updatedLesson : l))
    );
    toast.success("Lesson rescheduled successfully!");
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

  const activeDragLesson = activeId ? lessons.find((l) => l.id === activeId) : null;

  return (
    <div className="min-h-screen bg-background">
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
                <Button variant="outline" className="shadow-sm">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Auto Match
                </Button>
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Lesson</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="emma">Emma Williams</SelectItem>
                        <SelectItem value="michael">Michael Chen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tutor</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kofi">Mr. Kofi (Piano)</SelectItem>
                        <SelectItem value="kwame">Mr. Kwame (Violin)</SelectItem>
                        <SelectItem value="ama">Ms. Ama (Guitar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room} value={room.toLowerCase()}>
                            {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select>
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
                      <Label>Time</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Time" />
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
                  </div>
                  <Button className="w-full gradient-primary text-primary-foreground">
                    Schedule Lesson
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
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-2xl">{currentWeek}</CardTitle>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="font-semibold text-center text-muted-foreground">Time</div>
                    {daysOfWeek.map((day) => (
                      <div key={day} className="font-semibold text-center p-2 rounded-lg bg-muted">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Time Slots Grid */}
                  <div className="space-y-1">
                    {timeSlots.map((time) => (
                      <div key={time} className="grid grid-cols-8 gap-2">
                        <div className="text-sm text-muted-foreground text-center py-4 font-medium">
                          {time}
                        </div>
                        {daysOfWeek.map((_, dayIndex) => {
                          const lesson = lessons.find(
                            (l) => l.day === dayIndex && l.time === time
                          );

                          return (
                            <DroppableSlot key={`${dayIndex}-${time}`} dayIndex={dayIndex} time={time}>
                              {lesson && <DraggableLesson lesson={lesson} />}
                            </DroppableSlot>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DragOverlay>
                {activeDragLesson && (
                  <div className={`${getInstrumentColor(activeDragLesson.instrument)} p-3 rounded-lg shadow-lg w-40`}>
                    <div className="flex items-start justify-between mb-1">
                      <Music className="h-4 w-4" />
                      <Badge variant="outline" className="text-xs border-current">
                        {activeDragLesson.duration}h
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm mb-1">{activeDragLesson.student}</p>
                    <p className="text-xs opacity-90">{activeDragLesson.instrument}</p>
                    <p className="text-xs opacity-75 mt-1">{activeDragLesson.tutor}</p>
                  </div>
                )}
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
                {rooms.map((room) => {
                  const roomLessons = lessons.filter((l) => l.room === room);
                  return (
                    <div key={room} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="font-medium">{room}</span>
                      <Badge variant="secondary">{roomLessons.length} lessons</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Instrument Legend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {["Piano", "Guitar", "Violin", "Drums", "Voice"].map((instrument) => (
                  <Badge key={instrument} className={getInstrumentColor(instrument)}>
                    {instrument}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
