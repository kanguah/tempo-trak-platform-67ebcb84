import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = Array.from({ length: 11 }, (_, i) => `${8 + i}:00`);

const lessons = [
  { day: 0, time: "09:00", student: "Sarah Johnson", instrument: "Piano", tutor: "Mr. Kofi", duration: 1 },
  { day: 0, time: "14:00", student: "Emma Williams", instrument: "Violin", tutor: "Mr. Kwame", duration: 1 },
  { day: 1, time: "10:00", student: "Michael Chen", instrument: "Guitar", tutor: "Ms. Ama", duration: 1.5 },
  { day: 1, time: "15:00", student: "David Brown", instrument: "Drums", tutor: "Mr. Yaw", duration: 1 },
  { day: 2, time: "09:00", student: "Sophia Martinez", instrument: "Voice", tutor: "Ms. Abena", duration: 1 },
  { day: 2, time: "13:00", student: "James Wilson", instrument: "Piano", tutor: "Mr. Kofi", duration: 1 },
  { day: 3, time: "11:00", student: "Sarah Johnson", instrument: "Piano", tutor: "Mr. Kofi", duration: 1 },
  { day: 4, time: "16:00", student: "Emma Williams", instrument: "Violin", tutor: "Mr. Kwame", duration: 1 },
];

const getInstrumentColor = (instrument: string) => {
  const colors: Record<string, string> = {
    Piano: "bg-primary text-primary-foreground",
    Guitar: "bg-secondary text-secondary-foreground",
    Violin: "bg-accent text-accent-foreground",
    Drums: "bg-primary-light text-primary-foreground",
    Voice: "bg-secondary text-secondary-foreground",
  };
  return colors[instrument] || "bg-muted text-muted-foreground";
};

export default function Calendar() {
  const [currentWeek, setCurrentWeek] = useState("June 3-9, 2024");

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Schedule & Calendar</h1>
            <p className="text-muted-foreground">Manage lessons and timetables</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-primary">
            <Plus className="mr-2 h-5 w-5" />
            Add Lesson
          </Button>
        </div>

        {/* Calendar Navigation */}
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
            {/* Calendar Grid */}
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
                          <div
                            key={`${dayIndex}-${time}`}
                            className="min-h-[80px] border-2 border-border rounded-lg p-2 hover:bg-muted/50 transition-colors"
                          >
                            {lesson && (
                              <div
                                className={`${getInstrumentColor(
                                  lesson.instrument
                                )} p-3 rounded-lg h-full shadow-sm animate-scale-in cursor-pointer hover:scale-105 transition-transform`}
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
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
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
  );
}
