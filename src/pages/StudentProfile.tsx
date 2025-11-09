import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Music, Calendar, DollarSign, CheckCircle, XCircle, Clock, Edit, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const editStudentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  grade: z.string().min(1, "Grade is required"),
  status: z.string().min(1, "Status is required"),
  date_of_birth: z.string().optional(),
  parent_name: z.string().trim().max(100, "Parent name must be less than 100 characters").optional().or(z.literal("")),
  parent_email: z.string().trim().email("Invalid parent email").max(255, "Parent email must be less than 255 characters").optional().or(z.literal("")),
  parent_phone: z.string().trim().max(20, "Parent phone must be less than 20 characters").optional().or(z.literal("")),
  address: z.string().trim().max(200, "Address must be less than 200 characters").optional().or(z.literal(""))
});

const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"];

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasParent, setHasParent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch student data
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Fetch attendance records
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', id)
        .eq('user_id', user?.id)
        .order('lesson_date', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Fetch payment records
  const { data: paymentRecords = [] } = useQuery({
    queryKey: ['payments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', id)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Fetch lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', id)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    status: "active",
    date_of_birth: "",
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    address: ""
  });

  useEffect(() => {
    if (student) {
      const hasParentInfo = !!(student.parent_name || student.parent_email || student.parent_phone);
      setHasParent(hasParentInfo);
      setFormData({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        grade: student.grade || "",
        status: student.status || "active",
        date_of_birth: student.date_of_birth || "",
        parent_name: student.parent_name || "",
        parent_email: student.parent_email || "",
        parent_phone: student.parent_phone || "",
        address: student.address || ""
      });
    }
  }, [student]);

  const updateStudentMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { data, error } = await supabase
        .from('students')
        .update(updatedData)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDialogOpen(false);
      setErrors({});
      toast.success("Student profile updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update student");
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success("Student deleted successfully!");
      navigate('/students');
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete student");
    }
  });

  const handleUpdateStudent = () => {
    try {
      const dataToValidate = {
        ...formData,
        parent_name: hasParent ? formData.parent_name : "",
        parent_email: hasParent ? formData.parent_email : "",
        parent_phone: hasParent ? formData.parent_phone : ""
      };
      const validated = editStudentSchema.parse(dataToValidate);
      updateStudentMutation.mutate(validated);
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

  const handleDelete = () => {
    deleteStudentMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "present":
      case "completed":
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "absent":
      case "pending":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "inactive":
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
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

  const calculateAttendanceRate = () => {
    if (attendanceRecords.length === 0) return 0;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    return Math.round((present / attendanceRecords.length) * 100);
  };

  const calculateTotalPaid = () => {
    return paymentRecords
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const calculateOutstanding = () => {
    return paymentRecords
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  };

  if (studentLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Student not found</p>
            <Button onClick={() => navigate('/students')}>
              Back to Students
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Student Profile</h1>
            <p className="text-muted-foreground">Comprehensive student information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button className="gradient-primary text-primary-foreground shadow-primary" onClick={() => setDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </div>

        {/* Student Overview Card */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start gap-4">
                <Avatar className="h-24 w-24 gradient-primary text-3xl">
                  <AvatarFallback className="text-primary-foreground font-bold">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <Badge variant="outline" className={getStatusColor(student.status)}>
                  {student.status}
                </Badge>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">{student.name}</h2>
                  <Badge className={getLevelColor(student.grade || "Beginner")} variant="outline">
                    {student.grade || "Beginner"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{student.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{student.phone || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Music className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Instruments</p>
                      <p className="text-sm font-medium">{student.subjects?.join(", ") || "None"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Enrolled</p>
                      <p className="text-sm font-medium">
                        {format(new Date(student.enrollment_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Student Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">
                      {student.date_of_birth ? format(new Date(student.date_of_birth), 'MMM dd, yyyy') : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{student.address || "Not provided"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Parent/Guardian Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{student.parent_name || "Not provided"}</p>
                  </div>
                  {student.parent_email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{student.parent_email}</p>
                    </div>
                  )}
                  {student.parent_phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{student.parent_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Attendance Rate
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateAttendanceRate()}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {attendanceRecords.filter(r => r.status === 'present').length} of {attendanceRecords.length} lessons
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Paid
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GH₵ {calculateTotalPaid().toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {paymentRecords.filter(p => p.status === 'completed').length} payments completed
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GH₵ {calculateOutstanding().toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {paymentRecords.filter(p => p.status === 'pending').length} pending payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Details */}
        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Scheduled Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No lessons scheduled</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lessons.map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][lesson.day_of_week]}
                          </TableCell>
                          <TableCell>{lesson.start_time}</TableCell>
                          <TableCell>{lesson.subject}</TableCell>
                          <TableCell>{lesson.duration} min</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(lesson.status)}>
                              {lesson.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attendance records</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(new Date(record.lesson_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{record.start_time}</TableCell>
                          <TableCell>{record.subject}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(record.status)}>
                              {record.status === 'present' ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.feedback || "No feedback"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payment records</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRecords.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="font-semibold">
                            GH₵ {Number(payment.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{payment.description || "N/A"}</TableCell>
                          <TableCell>
                            {payment.due_date ? format(new Date(payment.due_date), 'MMM dd, yyyy') : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter student's full name"
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
                placeholder="student@email.com"
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
              <Label htmlFor="edit-grade">Grade</Label>
              <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                <SelectTrigger id="edit-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
              {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                placeholder="123 Music Street, Accra"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Parent/Guardian Information</h3>
                  <p className="text-xs text-muted-foreground">Add parent or guardian contact details</p>
                </div>
                <Switch
                  checked={hasParent}
                  onCheckedChange={setHasParent}
                />
              </div>
              
              {hasParent && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="edit-parent-name">Parent/Guardian Name</Label>
                    <Input
                      id="edit-parent-name"
                      placeholder="Jennifer Johnson"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    />
                    {errors.parent_name && <p className="text-sm text-destructive">{errors.parent_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-parent-email">Parent/Guardian Email</Label>
                    <Input
                      id="edit-parent-email"
                      type="email"
                      placeholder="parent@email.com"
                      value={formData.parent_email}
                      onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                    />
                    {errors.parent_email && <p className="text-sm text-destructive">{errors.parent_email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-parent-phone">Parent/Guardian Phone</Label>
                    <Input
                      id="edit-parent-phone"
                      placeholder="+233 24 123 4560"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    />
                    {errors.parent_phone && <p className="text-sm text-destructive">{errors.parent_phone}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                onClick={handleUpdateStudent}
                disabled={updateStudentMutation.isPending}
              >
                {updateStudentMutation.isPending ? "Updating..." : "Update Student"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {student.name}'s profile and all associated records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
