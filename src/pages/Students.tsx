import { useState } from "react";
import { Search, Plus, Filter, Music, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const students = [
  {
    id: 1,
    name: "Sarah Johnson",
    instrument: "Piano",
    level: "Advanced",
    email: "sarah.j@email.com",
    phone: "+233 24 123 4567",
    status: "Active",
    avatar: "SJ",
    lessons: 48,
    nextLesson: "Tomorrow, 9:00 AM",
  },
  {
    id: 2,
    name: "Michael Chen",
    instrument: "Guitar",
    level: "Intermediate",
    email: "m.chen@email.com",
    phone: "+233 24 234 5678",
    status: "Active",
    avatar: "MC",
    lessons: 32,
    nextLesson: "Today, 2:00 PM",
  },
  {
    id: 3,
    name: "Emma Williams",
    instrument: "Violin",
    level: "Beginner",
    email: "emma.w@email.com",
    phone: "+233 24 345 6789",
    status: "Active",
    avatar: "EW",
    lessons: 12,
    nextLesson: "Friday, 4:00 PM",
  },
  {
    id: 4,
    name: "David Brown",
    instrument: "Drums",
    level: "Intermediate",
    email: "d.brown@email.com",
    phone: "+233 24 456 7890",
    status: "Active",
    avatar: "DB",
    lessons: 28,
    nextLesson: "Monday, 10:00 AM",
  },
  {
    id: 5,
    name: "Sophia Martinez",
    instrument: "Voice",
    level: "Advanced",
    email: "sophia.m@email.com",
    phone: "+233 24 567 8901",
    status: "Active",
    avatar: "SM",
    lessons: 56,
    nextLesson: "Tomorrow, 3:00 PM",
  },
  {
    id: 6,
    name: "James Wilson",
    instrument: "Piano",
    level: "Beginner",
    email: "j.wilson@email.com",
    phone: "+233 24 678 9012",
    status: "Pending",
    avatar: "JW",
    lessons: 4,
    nextLesson: "Wednesday, 11:00 AM",
  },
];

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Advanced":
        return "bg-accent text-accent-foreground";
      case "Intermediate":
        return "bg-primary text-primary-foreground";
      case "Beginner":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getAvatarGradient = (index: number) => {
    const gradients = [
      "gradient-primary",
      "gradient-accent",
      "bg-secondary",
      "bg-primary",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Students</h1>
            <p className="text-muted-foreground">Manage your academy's students</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-primary">
            <Plus className="mr-2 h-5 w-5" />
            Add Student
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, instrument, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student, index) => (
            <Card
              key={student.id}
              className="shadow-card hover:shadow-primary transition-all duration-300 animate-scale-in cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl ${getAvatarGradient(
                        index
                      )} text-white font-bold text-lg shadow-md`}
                    >
                      {student.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{student.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Music className="h-4 w-4" />
                        {student.instrument}
                      </div>
                    </div>
                  </div>
                  <Badge className={getLevelColor(student.level)}>{student.level}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {student.phone}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Lessons</span>
                    <span className="font-semibold text-foreground">{student.lessons}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Next Lesson</span>
                    <span className="font-semibold text-primary">{student.nextLesson}</span>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="outline">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
