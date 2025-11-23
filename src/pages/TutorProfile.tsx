import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, Download, Upload, FileText, Calendar, TrendingUp, Star, Clock, DollarSign, Award, Pencil } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const availableInstruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Bass", "Cello", "Clarinet", "Music Theory", "Choir", "Percussion"];
const editTutorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  phone: z.string().trim().optional().optional().or(z.literal("")),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  status: z.string().min(1, "Status is required"),
  monthly_salary: z.number().min(0, "Salary must be positive").optional(),
  availability: z.string().optional()
});
export default function TutorProfile() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch tutor data
  const {
    data: tutor,
    isLoading: tutorLoading
  } = useQuery({
    queryKey: ["tutor", id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tutors").select("*").eq("id", id).eq("user_id", user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });

  // Fetch lessons for schedule
  const {
    data: lessons = []
  } = useQuery({
    queryKey: ["tutor-lessons", id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("lessons").select(`
          *,
          students (name)
        `).eq("tutor_id", id).eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });

  // Fetch attendance for metrics and feedback
  const {
    data: attendance = []
  } = useQuery({
    queryKey: ["tutor-attendance", id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("attendance").select(`
          *,
          students (name)
        `).eq("tutor_id", id).eq("user_id", user?.id).order("lesson_date", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });

  // Fetch payroll history
  const {
    data: payroll = []
  } = useQuery({
    queryKey: ["tutor-payroll", id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tutor_payroll").select("*").eq("tutor_id", id).eq("user_id", user?.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });

  // Fetch documents
  const {
    data: documents = []
  } = useQuery({
    queryKey: ["tutor-documents", id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tutor_documents").select("*").eq("tutor_id", id).eq("user_id", user?.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subjects: [] as string[],
    status: "",
    monthly_salary: 0,
    availability: ""
  });

  // Initialize form when tutor data loads
  useEffect(() => {
    if (tutor) {
      setFormData({
        name: tutor.name || "",
        email: tutor.email || "",
        phone: tutor.phone || "",
        subjects: tutor.subjects || [],
        status: tutor.status || "",
        monthly_salary: tutor.monthly_salary || 0,
        availability: tutor.availability || ""
      });
    }
  }, [tutor]);

  // Update tutor mutation
  const updateTutorMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const {
        error
      } = await supabase.from("tutors").update(data).eq("id", id).eq("user_id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tutor", id]
      });
      toast.success("Tutor profile updated successfully!");
      setEditDialogOpen(false);
      setErrors({});
    },
    onError: () => {
      toast.error("Failed to update tutor profile");
    }
  });
  const handleEditTutor = () => {
    try {
      const validated = editTutorSchema.parse({
        ...formData,
        monthly_salary: Number(formData.monthly_salary)
      });
      updateTutorMutation.mutate(validated as any);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };
  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject) ? prev.subjects.filter(s => s !== subject) : [...prev.subjects, subject]
    }));
  };

  // Calculate metrics
  const completedLessons = attendance.filter(a => a.status === "present").length;
  const totalScheduled = attendance.length;
  const attendanceRate = totalScheduled > 0 ? Math.round(completedLessons / totalScheduled * 100) : 0;
  const feedbackWithRatings = attendance.filter(a => a.rating && a.feedback);
  const averageRating = feedbackWithRatings.length > 0 ? (feedbackWithRatings.reduce((acc, a) => acc + (a.rating || 0), 0) / feedbackWithRatings.length).toFixed(1) : "N/A";
  const uniqueStudents = new Set(lessons.map(l => l.student_id)).size;
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const thisMonthAttendance = attendance.filter(a => {
    const lessonDate = new Date(a.lesson_date);
    return lessonDate.getMonth() === thisMonth && lessonDate.getFullYear() === thisYear && a.status === "present";
  });
  const hoursThisMonth = thisMonthAttendance.length * 1; // Assuming 1 hour per lesson

  // Group lessons by day for schedule
  const scheduleByDay = daysOfWeek.map(day => ({
    day,
    lessons: lessons.filter(l => l.day_of_week === daysOfWeek.indexOf(day))
  }));
  if (tutorLoading) {
    return <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>;
  }
  if (!tutor) {
    return <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tutor not found</h1>
          <Button onClick={() => navigate("/tutors")}>Back to Tutors</Button>
        </div>
      </div>;
  }
  const avatar = tutor.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return <div className="min-h-screen bg-background">
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
                <Input id="edit-name" placeholder="Enter tutor's full name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" placeholder="tutor@email.com" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" placeholder="+233 24 123 4567" value={formData.phone} onChange={e => setFormData({
                ...formData,
                phone: e.target.value
              })} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/50">
                  {availableInstruments.map(instrument => <div key={instrument} className="flex items-center space-x-2">
                      <Checkbox id={`edit-${instrument}`} checked={formData.subjects.includes(instrument)} onCheckedChange={() => toggleSubject(instrument)} />
                      <Label htmlFor={`edit-${instrument}`} className="text-sm font-normal cursor-pointer">
                        {instrument}
                      </Label>
                    </div>)}
                </div>
                {errors.subjects && <p className="text-sm text-destructive">{errors.subjects}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={value => setFormData({
                ...formData,
                status: value
              })}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-availability">Availability</Label>
                <Textarea id="edit-availability" placeholder="Enter tutor's availability..." value={formData.availability} onChange={e => setFormData({
                ...formData,
                availability: e.target.value
              })} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-monthly-salary">Base Monthly Salary (GH₵)</Label>
                <Input id="edit-monthly-salary" type="number" min="0" step="0.01" placeholder="0.00" value={formData.monthly_salary} onChange={e => setFormData({
                ...formData,
                monthly_salary: parseFloat(e.target.value) || 0
              })} />
                {errors.monthly_salary && <p className="text-sm text-destructive">{errors.monthly_salary}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => {
                setEditDialogOpen(false);
                if (tutor) {
                  setFormData({
                    name: tutor.name || "",
                    email: tutor.email || "",
                    phone: tutor.phone || "",
                    subjects: tutor.subjects || [],
                    status: tutor.status || "",
                    monthly_salary: tutor.monthly_salary || 0,
                    availability: tutor.availability || ""
                  });
                }
                setErrors({});
              }}>
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
                {avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">{tutor.name}</h2>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        
                        <span>{tutor.subjects?.join(", ") || "No subjects"}</span>
                      </div>
                      <span>•</span>
                      <span>Member since {tutor.created_at ? format(new Date(tutor.created_at), "MMMM yyyy") : "Unknown"}</span>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                    {tutor.status}
                  </Badge>
                </div>

                <p className="text-muted-foreground mb-4">{tutor.availability || "No availability information"}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{tutor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{tutor.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-foreground">{averageRating}/5.0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{uniqueStudents} Students</span>
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
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Lesson Attendance</span>
                      <span className="text-sm font-semibold text-blue-600">{attendanceRate}%</span>
                    </div>
                    <Progress value={attendanceRate} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Student Satisfaction</span>
                      <span className="text-sm font-semibold text-purple-600">{typeof averageRating === 'string' ? 'N/A' : `${Math.round(parseFloat(averageRating) * 20)}%`}</span>
                    </div>
                    <Progress value={typeof averageRating === 'string' ? 0 : parseFloat(averageRating) * 20} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Quick Statistics</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span className="text-sm">Active Students</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{uniqueStudents}</p>
                  </div>

                  

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Base Monthly Salary</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">GH₵ {tutor.monthly_salary || 0}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">This Month's Lessons</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{thisMonthAttendance.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <CardContent className="space-y-4">
                {scheduleByDay.map(daySchedule => <div key={daySchedule.day} className="border-b pb-4 last:border-0 last:pb-0">
                    <h4 className="font-semibold text-foreground mb-3">{daySchedule.day}</h4>
                    {daySchedule.lessons.length > 0 ? <div className="space-y-2">
                        {daySchedule.lessons.map((lesson: any) => <div key={lesson.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm text-foreground">
                                  {lesson.start_time} - {lesson.students?.name || "Unknown Student"}
                                </p>
                                <p className="text-xs text-muted-foreground">{lesson.subject}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {lesson.duration || 60}min
                            </Badge>
                          </div>)}
                      </div> : <p className="text-sm text-muted-foreground">No lessons scheduled</p>}
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Student Feedback
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-semibold">{averageRating}/5.0</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedbackWithRatings.length > 0 ? feedbackWithRatings.map((feedback: any) => <div key={feedback.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{feedback.students?.name || "Unknown Student"}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({
                        length: 5
                      }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < (feedback.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />)}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(feedback.lesson_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{feedback.feedback}</p>
                    </div>) : <p className="text-muted-foreground text-center py-8">No feedback yet</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payroll History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payroll.length > 0 ? payroll.map((record: any) => <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-1">{record.month}</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                            <span>Base: GH₵ {record.base_salary}</span>
                            <span>Lessons: {record.lessons_taught}</span>
                            <span>Students: {record.active_students}</span>
                            {(record.lesson_bonus > 0 || record.student_bonus > 0) && <span>Bonuses: GH₵ {(record.lesson_bonus || 0) + (record.student_bonus || 0)}</span>}
                            {record.deductions > 0 && <span>Deductions: GH₵ {record.deductions}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground mb-1">GH₵ {record.total_amount}</p>
                          <Badge className={record.status === "paid" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"} variant="outline">
                            {record.status}
                          </Badge>
                          {record.payment_date && <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(record.payment_date), "MMM d, yyyy")}
                            </p>}
                        </div>
                      </div>) : <p className="text-muted-foreground text-center py-8">No payroll records yet</p>}
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
                    Documents
                  </CardTitle>
                  <Button className="gradient-primary text-primary-foreground">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.length > 0 ? documents.map((doc: any) => <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">{doc.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{doc.file_type}</span>
                              <span>•</span>
                              <span>{doc.file_size}</span>
                              <span>•</span>
                              <span>{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>) : <p className="text-muted-foreground text-center py-8">No documents yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}