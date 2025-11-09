import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Mail, Phone, Download, Upload, FileText, Calendar, TrendingUp, Star, Clock, DollarSign, Award, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

const tutorData = {
  id: 1,
  name: "Mr. Kofi Mensah",
  instruments: ["Piano", "Music Theory"],
  email: "kofi.mensah@49ice.com",
  phone: "+233 24 111 2222",
  status: "Active",
  avatar: "KM",
  students: 18,
  hoursPerWeek: 24,
  monthlyPay: "GH₵ 4,200",
  joinDate: "January 2022",
  bio: "Professional pianist with 12+ years of teaching experience. Specializes in classical and contemporary piano styles. Certified music theory instructor.",
  qualifications: [
    "Bachelor of Music - University of Ghana",
    "ABRSM Grade 8 Piano (Distinction)",
    "Certified Music Theory Instructor",
    "Trinity College London Diploma",
  ],
};

const performanceMetrics = [
  { label: "Student Retention", value: 94, color: "text-green-600" },
  { label: "Lesson Attendance", value: 88, color: "text-blue-600" },
  { label: "Student Satisfaction", value: 96, color: "text-purple-600" },
  { label: "Punctuality", value: 92, color: "text-orange-600" },
];

const studentFeedback = [
  {
    id: 1,
    student: "Sarah Osei",
    rating: 5,
    date: "2024-01-15",
    comment: "Excellent teacher! Very patient and explains concepts clearly. My son has improved tremendously.",
  },
  {
    id: 2,
    student: "John Asante",
    rating: 5,
    date: "2024-01-10",
    comment: "Mr. Mensah is fantastic. His teaching style is engaging and my daughter looks forward to every lesson.",
  },
  {
    id: 3,
    student: "Grace Owusu",
    rating: 4,
    date: "2024-01-05",
    comment: "Very knowledgeable and professional. Would recommend to anyone looking for a piano teacher.",
  },
  {
    id: 4,
    student: "Michael Boateng",
    rating: 5,
    date: "2023-12-20",
    comment: "Best music teacher we've ever had. Patient, skilled, and truly cares about student progress.",
  },
];

const payrollHistory = [
  {
    id: 1,
    month: "January 2024",
    hours: 96,
    rate: "GH₵ 45/hr",
    bonuses: "GH₵ 200",
    total: "GH₵ 4,520",
    status: "Paid",
    date: "2024-01-31",
  },
  {
    id: 2,
    month: "December 2023",
    hours: 88,
    rate: "GH₵ 45/hr",
    bonuses: "GH₵ 0",
    total: "GH₵ 3,960",
    status: "Paid",
    date: "2023-12-31",
  },
  {
    id: 3,
    month: "November 2023",
    hours: 92,
    rate: "GH₵ 45/hr",
    bonuses: "GH₵ 150",
    total: "GH₵ 4,290",
    status: "Paid",
    date: "2023-11-30",
  },
];

const weekSchedule = [
  { day: "Monday", lessons: [
    { time: "9:00 AM", student: "Sarah Osei", instrument: "Piano", duration: "1h" },
    { time: "10:30 AM", student: "John Asante", instrument: "Piano", duration: "1h" },
    { time: "2:00 PM", student: "Grace Owusu", instrument: "Music Theory", duration: "1h" },
  ]},
  { day: "Tuesday", lessons: [
    { time: "9:00 AM", student: "Michael Boateng", instrument: "Piano", duration: "1h" },
    { time: "11:00 AM", student: "Emma Mensah", instrument: "Piano", duration: "1h" },
  ]},
  { day: "Wednesday", lessons: [
    { time: "9:00 AM", student: "David Osei", instrument: "Music Theory", duration: "1h" },
    { time: "10:30 AM", student: "Linda Asante", instrument: "Piano", duration: "1h" },
    { time: "2:00 PM", student: "Peter Owusu", instrument: "Piano", duration: "1h" },
  ]},
  { day: "Thursday", lessons: [
    { time: "9:00 AM", student: "Mary Boateng", instrument: "Piano", duration: "1h" },
    { time: "11:00 AM", student: "James Mensah", instrument: "Music Theory", duration: "1h" },
  ]},
  { day: "Friday", lessons: [
    { time: "9:00 AM", student: "Rachel Osei", instrument: "Piano", duration: "1h" },
    { time: "10:30 AM", student: "Daniel Asante", instrument: "Piano", duration: "1h" },
    { time: "2:00 PM", student: "Elizabeth Owusu", instrument: "Music Theory", duration: "1h" },
  ]},
];

const documents = [
  { id: 1, name: "CV - Kofi Mensah.pdf", type: "PDF", size: "245 KB", date: "2022-01-15" },
  { id: 2, name: "Teaching Certificate.pdf", type: "PDF", size: "180 KB", date: "2022-01-15" },
  { id: 3, name: "Contract Agreement.pdf", type: "PDF", size: "320 KB", date: "2022-01-20" },
  { id: 4, name: "ABRSM Grade 8 Certificate.pdf", type: "PDF", size: "210 KB", date: "2022-01-15" },
];

const availableInstruments = [
  "Piano",
  "Guitar",
  "Violin",
  "Drums",
  "Voice",
  "Saxophone",
  "Flute",
  "Bass",
  "Cello",
  "Clarinet",
  "Music Theory",
  "Choir",
  "Percussion",
];

const editTutorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  instruments: z.array(z.string()).min(1, "Select at least one instrument"),
  status: z.string().min(1, "Status is required"),
  bio: z.string().trim().max(500, "Bio must be less than 500 characters").optional(),
});

export default function TutorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: tutorData.name,
    email: tutorData.email,
    phone: tutorData.phone,
    instruments: tutorData.instruments,
    status: tutorData.status,
    bio: tutorData.bio,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const averageRating = (
    studentFeedback.reduce((acc, f) => acc + f.rating, 0) / studentFeedback.length
  ).toFixed(1);

  const handleEditTutor = () => {
    try {
      const validated = editTutorSchema.parse(formData);
      
      // In a real app, this would update the backend
      toast.success("Tutor profile updated successfully!");
      setEditDialogOpen(false);
      setErrors({});
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

  const toggleInstrument = (instrument: string) => {
    setFormData((prev) => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter((i) => i !== instrument)
        : [...prev.instruments, instrument],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/tutors")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-2">Tutor Profile</h1>
            <p className="text-muted-foreground">Detailed information and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button className="gradient-primary text-primary-foreground shadow-primary">
              <Mail className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>

        {/* Edit Tutor Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Tutor Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter tutor's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="tutor@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  placeholder="+233 24 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label>Instruments</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/50">
                  {availableInstruments.map((instrument) => (
                    <div key={instrument} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${instrument}`}
                        checked={formData.instruments.includes(instrument)}
                        onCheckedChange={() => toggleInstrument(instrument)}
                      />
                      <Label htmlFor={`edit-${instrument}`} className="text-sm font-normal cursor-pointer">
                        {instrument}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.instruments && <p className="text-sm text-destructive">{errors.instruments}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea
                  id="edit-bio"
                  placeholder="Enter tutor's bio..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
                {errors.bio && <p className="text-sm text-destructive">{errors.bio}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setFormData({
                      name: tutorData.name,
                      email: tutorData.email,
                      phone: tutorData.phone,
                      instruments: tutorData.instruments,
                      status: tutorData.status,
                      bio: tutorData.bio,
                    });
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleEditTutor}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Header Card */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl gradient-primary text-white font-bold text-3xl shadow-md">
                {tutorData.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">{tutorData.name}</h2>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        <span>{tutorData.instruments.join(", ")}</span>
                      </div>
                      <span>•</span>
                      <span>Member since {tutorData.joinDate}</span>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                    {tutorData.status}
                  </Badge>
                </div>

                <p className="text-muted-foreground mb-4">{tutorData.bio}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{tutorData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{tutorData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-foreground">{averageRating}/5.0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{tutorData.students} Students</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Performance Metrics */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceMetrics.map((metric) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{metric.label}</span>
                        <span className={`text-sm font-semibold ${metric.color}`}>{metric.value}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Quick Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Hours/Week</span>
                    </div>
                    <span className="font-semibold text-foreground">{tutorData.hoursPerWeek}h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <span className="text-sm text-muted-foreground">Monthly Pay</span>
                    </div>
                    <span className="font-semibold text-accent">{tutorData.monthlyPay}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Active Students</span>
                    </div>
                    <span className="font-semibold text-foreground">{tutorData.students}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-muted-foreground">Average Rating</span>
                    </div>
                    <span className="font-semibold text-foreground">{averageRating}/5.0</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Qualifications */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Qualifications & Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {tutorData.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">{qual}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {weekSchedule.map((day) => (
                    <div key={day.day}>
                      <h3 className="font-semibold text-lg text-foreground mb-3">{day.day}</h3>
                      <div className="space-y-2">
                        {day.lessons.map((lesson, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-20 px-2 py-1 bg-primary/10 rounded text-sm font-medium text-primary">
                                {lesson.time}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{lesson.student}</p>
                                <p className="text-sm text-muted-foreground">{lesson.instrument}</p>
                              </div>
                            </div>
                            <Badge variant="outline">{lesson.duration}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Student Feedback ({studentFeedback.length} reviews)
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-foreground">{averageRating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.round(parseFloat(averageRating))
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentFeedback.map((feedback) => (
                  <div key={feedback.id} className="p-4 border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{feedback.student}</p>
                        <p className="text-xs text-muted-foreground">{feedback.date}</p>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < feedback.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-accent" />
                  Payroll History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payrollHistory.map((payroll) => (
                    <div
                      key={payroll.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{payroll.month}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{payroll.hours} hours @ {payroll.rate}</span>
                          {payroll.bonuses !== "GH₵ 0" && (
                            <>
                              <span>•</span>
                              <span>Bonus: {payroll.bonuses}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Paid on {payroll.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-accent">{payroll.total}</p>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 mt-2">
                          {payroll.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Documents & Files
                  </CardTitle>
                  <Button className="gradient-primary text-primary-foreground shadow-primary">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.size} • Uploaded {doc.date}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
