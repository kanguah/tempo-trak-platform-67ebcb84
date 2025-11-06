import { useState } from "react";
import { Check, X, ChevronLeft, ChevronRight, Filter, Download, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const attendanceRecords = [
  {
    id: 1,
    time: "09:00 AM",
    student: "Sarah Johnson",
    instrument: "Piano",
    tutor: "Mr. Kofi",
    status: "present",
    feedback: "Excellent progress on Beethoven's Moonlight Sonata. Ready for performance.",
  },
  {
    id: 2,
    time: "10:30 AM",
    student: "Michael Chen",
    instrument: "Guitar",
    tutor: "Ms. Ama",
    status: "present",
    feedback: "Good fingerpicking technique. Need more practice on chord transitions.",
  },
  {
    id: 3,
    time: "11:00 AM",
    student: "James Wilson",
    instrument: "Piano",
    tutor: "Mr. Kofi",
    status: "absent",
    feedback: "",
  },
  {
    id: 4,
    time: "02:00 PM",
    student: "Emma Williams",
    instrument: "Violin",
    tutor: "Mr. Kwame",
    status: "pending",
    feedback: "",
  },
  {
    id: 5,
    time: "03:00 PM",
    student: "Sophia Martinez",
    instrument: "Voice",
    tutor: "Ms. Abena",
    status: "pending",
    feedback: "",
  },
  {
    id: 6,
    time: "04:00 PM",
    student: "David Brown",
    instrument: "Drums",
    tutor: "Mr. Yaw",
    status: "pending",
    feedback: "",
  },
];

export default function Attendance() {
  const [currentDate, setCurrentDate] = useState("Monday, June 3, 2024");
  const [records, setRecords] = useState(attendanceRecords);
  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);

  const markAttendance = (id: number, status: "present" | "absent") => {
    setRecords(
      records.map((record) => (record.id === id ? { ...record, status } : record))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Absent</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const pendingCount = records.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Attendance & Progress</h1>
            <p className="text-muted-foreground">Track lesson attendance and student feedback</p>
          </div>
          <Button className="gradient-accent text-accent-foreground shadow-accent">
            <Download className="mr-2 h-5 w-5" />
            Export Report
          </Button>
        </div>

        {/* Date Navigation */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">{currentDate}</h2>
                <Button variant="outline" size="icon">
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Present</p>
                  <h3 className="text-3xl font-bold text-green-600">{presentCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Absent</p>
                  <h3 className="text-3xl font-bold text-red-600">{absentCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <h3 className="text-3xl font-bold text-orange-600">{pendingCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Today's Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record, index) => (
                <Card
                  key={record.id}
                  className="border-2 animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-foreground">{record.student}</h3>
                          {getStatusBadge(record.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium">Time:</span> {record.time}
                          </p>
                          <p>
                            <span className="font-medium">Instrument:</span> {record.instrument}
                          </p>
                          <p>
                            <span className="font-medium">Tutor:</span> {record.tutor}
                          </p>
                        </div>
                      </div>

                      {record.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => markAttendance(record.id, "present")}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAttendance(record.id, "absent")}
                            variant="destructive"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      )}
                    </div>

                    {record.status === "present" && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Lesson Feedback
                        </label>
                        {editingFeedback === record.id ? (
                          <div className="space-y-2">
                            <Textarea
                              defaultValue={record.feedback}
                              placeholder="Add feedback about the student's progress..."
                              className="min-h-[100px]"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setEditingFeedback(null)}>
                                Save Feedback
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingFeedback(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : record.feedback ? (
                          <div
                            className="p-3 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => setEditingFeedback(record.id)}
                          >
                            {record.feedback}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFeedback(record.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Feedback
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
