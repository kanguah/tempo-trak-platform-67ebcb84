import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Music, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";

const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  instrument: z.string().min(1, "Instrument is required"),
  level: z.string().min(1, "Level is required"),
  nextLesson: z.string().min(1, "Next lesson is required"),
});

const initialStudents = [
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem("academy-students");
    return savedStudents ? JSON.parse(savedStudents) : initialStudents;
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    instrument: "",
    level: "",
    nextLesson: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("academy-students", JSON.stringify(students));
  }, [students]);

  const handleAddStudent = () => {
    try {
      const validated = studentSchema.parse(formData);
      
      const newStudent = {
        id: Math.max(...students.map((s: any) => s.id), 0) + 1,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        instrument: validated.instrument,
        level: validated.level,
        nextLesson: validated.nextLesson,
        status: "Active",
        avatar: validated.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        lessons: 0,
      };

      setStudents([...students, newStudent]);
      setDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        instrument: "",
        level: "",
        nextLesson: "",
      });
      setErrors({});
      toast.success(`${validated.name} added successfully!`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground shadow-primary">
                <Plus className="mr-2 h-5 w-5" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter student's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+233 24 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrument">Instrument</Label>
                  <Select value={formData.instrument} onValueChange={(value) => setFormData({ ...formData, instrument: value })}>
                    <SelectTrigger id="instrument">
                      <SelectValue placeholder="Select instrument" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Piano">Piano</SelectItem>
                      <SelectItem value="Guitar">Guitar</SelectItem>
                      <SelectItem value="Violin">Violin</SelectItem>
                      <SelectItem value="Drums">Drums</SelectItem>
                      <SelectItem value="Voice">Voice</SelectItem>
                      <SelectItem value="Saxophone">Saxophone</SelectItem>
                      <SelectItem value="Flute">Flute</SelectItem>
                      <SelectItem value="Bass">Bass</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.instrument && <p className="text-sm text-destructive">{errors.instrument}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.level && <p className="text-sm text-destructive">{errors.level}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextLesson">Next Lesson</Label>
                  <Input
                    id="nextLesson"
                    placeholder="e.g., Monday, 10:00 AM"
                    value={formData.nextLesson}
                    onChange={(e) => setFormData({ ...formData, nextLesson: e.target.value })}
                  />
                  {errors.nextLesson && <p className="text-sm text-destructive">{errors.nextLesson}</p>}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleAddStudent}>
                    Add Student
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
              onClick={() => navigate(`/students/${student.id}`)}
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
