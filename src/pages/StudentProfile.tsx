import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Music, Calendar, DollarSign, Award, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { z } from "zod";
const editStudentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  instrument: z.string().min(1, "Instrument is required"),
  level: z.string().min(1, "Level is required"),
  parentName: z.string().trim().max(100, "Parent name must be less than 100 characters").optional(),
  parentEmail: z.string().trim().email("Invalid parent email").max(255, "Parent email must be less than 255 characters").optional().or(z.literal("")),
  parentPhone: z.string().trim().max(20, "Parent phone must be less than 20 characters").optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().trim().max(200, "Address must be less than 200 characters")
});

// Mock data - replace with actual data fetching
const studentData = {
  "1": {
    id: 1,
    name: "Sarah Johnson",
    instrument: "Piano",
    level: "Advanced",
    email: "sarah.j@email.com",
    phone: "+233 24 123 4567",
    status: "Active",
    avatar: "SJ",
    parentName: "Jennifer Johnson",
    parentEmail: "jennifer.j@email.com",
    parentPhone: "+233 24 123 4560",
    enrollmentDate: "Jan 15, 2023",
    address: "123 Music Street, Accra",
    dateOfBirth: "March 12, 2008"
  }
};
const enrollmentHistory = [{
  date: "Jan 15, 2023",
  package: "Piano - Beginner Package",
  status: "Completed",
  duration: "6 months"
}, {
  date: "Jul 20, 2023",
  package: "Piano - Intermediate Package",
  status: "Completed",
  duration: "6 months"
}, {
  date: "Jan 10, 2024",
  package: "Piano - Advanced Package",
  status: "Active",
  duration: "Ongoing"
}];
const paymentRecords = [{
  date: "Nov 15, 2024",
  amount: "GH₵ 800",
  method: "MTN MoMo",
  status: "Paid",
  invoiceNo: "INV-2024-1145"
}, {
  date: "Oct 15, 2024",
  amount: "GH₵ 800",
  method: "Bank Transfer",
  status: "Paid",
  invoiceNo: "INV-2024-1098"
}, {
  date: "Sep 15, 2024",
  amount: "GH₵ 800",
  method: "Cash",
  status: "Paid",
  invoiceNo: "INV-2024-1052"
}, {
  date: "Dec 15, 2024",
  amount: "GH₵ 800",
  method: "Pending",
  status: "Pending",
  invoiceNo: "INV-2024-1189"
}];
const attendanceTimeline = [{
  date: "Nov 20, 2024",
  time: "9:00 AM",
  tutor: "Mr. David",
  status: "Present",
  topic: "Sonata in C Major"
}, {
  date: "Nov 18, 2024",
  time: "9:00 AM",
  tutor: "Mr. David",
  status: "Present",
  topic: "Bach Prelude No. 1"
}, {
  date: "Nov 15, 2024",
  time: "9:00 AM",
  tutor: "Mr. David",
  status: "Present",
  topic: "Scales & Arpeggios"
}, {
  date: "Nov 13, 2024",
  time: "9:00 AM",
  tutor: "Mr. David",
  status: "Absent",
  topic: "Chord Progressions"
}, {
  date: "Nov 11, 2024",
  time: "9:00 AM",
  tutor: "Mr. David",
  status: "Present",
  topic: "Sight Reading"
}];
const progressReports = [{
  term: "Term 3, 2024",
  date: "Oct 31, 2024",
  technicalSkills: 95,
  musicTheory: 88,
  performance: 92,
  practice: 85,
  comments: "Exceptional progress! Sarah demonstrates outstanding technique and musicality. Her performance of Chopin's Nocturne was remarkable."
}, {
  term: "Term 2, 2024",
  date: "Jul 31, 2024",
  technicalSkills: 90,
  musicTheory: 85,
  performance: 88,
  practice: 80,
  comments: "Consistent improvement across all areas. Sarah needs to focus more on sight-reading exercises."
}];
const communications = [{
  date: "Nov 22, 2024",
  type: "Email",
  from: "Admin",
  subject: "Upcoming Recital",
  message: "Reminder about the annual recital on Dec 15th. Sarah will perform Moonlight Sonata."
}, {
  date: "Nov 10, 2024",
  type: "WhatsApp",
  from: "Mr. David",
  subject: "Practice Recommendation",
  message: "Please encourage Sarah to practice scales for 15 minutes daily."
}, {
  date: "Oct 28, 2024",
  type: "Phone",
  from: "Parent",
  subject: "Schedule Change Request",
  message: "Requested to move lesson from Monday to Wednesday."
}, {
  date: "Oct 15, 2024",
  type: "Email",
  from: "Admin",
  subject: "Payment Confirmation",
  message: "Payment received for October tuition. Thank you!"
}];
export default function StudentProfile() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem("academy-students");
    return savedStudents ? JSON.parse(savedStudents) : [];
  });
  const student = students.find((s: any) => s.id === Number(id)) || studentData[id as keyof typeof studentData];
  const parseDateOfBirth = (dob: string) => {
    if (!dob) return {
      day: "",
      month: "",
      year: ""
    };
    const date = new Date(dob);
    if (!isNaN(date.getTime())) {
      return {
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        year: date.getFullYear().toString()
      };
    }
    return {
      day: "",
      month: "",
      year: ""
    };
  };
  const [hasParent, setHasParent] = useState(true);
  const [formData, setFormData] = useState({
    name: student?.name || "",
    email: student?.email || "",
    phone: student?.phone || "",
    instrument: student?.instrument || "",
    level: student?.level || "",
    parentName: student?.parentName || "",
    parentEmail: student?.parentEmail || "",
    parentPhone: student?.parentPhone || "",
    dateOfBirth: student?.dateOfBirth || "",
    address: student?.address || "",
    dobDay: parseDateOfBirth(student?.dateOfBirth || "").day,
    dobMonth: parseDateOfBirth(student?.dateOfBirth || "").month,
    dobYear: parseDateOfBirth(student?.dateOfBirth || "").year
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    localStorage.setItem("academy-students", JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    if (student) {
      const parsed = parseDateOfBirth(student.dateOfBirth || "");
      setFormData({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        instrument: student.instrument || "",
        level: student.level || "",
        parentName: student.parentName || "",
        parentEmail: student.parentEmail || "",
        parentPhone: student.parentPhone || "",
        dateOfBirth: student.dateOfBirth || "",
        address: student.address || "",
        dobDay: parsed.day,
        dobMonth: parsed.month,
        dobYear: parsed.year
      });
    }
  }, [student]);
  if (!student) {
    return <div className="p-8">Student not found</div>;
  }
  const handleUpdateStudent = () => {
    try {
      const combinedDob = formData.dobDay && formData.dobMonth && formData.dobYear ? `${new Date(parseInt(formData.dobYear), parseInt(formData.dobMonth) - 1, parseInt(formData.dobDay)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}` : formData.dateOfBirth;
      const dataToValidate = {
        ...formData,
        dateOfBirth: combinedDob,
        parentName: hasParent ? formData.parentName : "",
        parentEmail: hasParent ? formData.parentEmail : "",
        parentPhone: hasParent ? formData.parentPhone : ""
      };
      const validated = editStudentSchema.parse(dataToValidate);
      const updatedStudents = students.map((s: any) => s.id === Number(id) ? {
        ...s,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        instrument: validated.instrument,
        level: validated.level,
        parentName: validated.parentName,
        parentEmail: validated.parentEmail,
        parentPhone: validated.parentPhone,
        dateOfBirth: validated.dateOfBirth,
        address: validated.address,
        avatar: validated.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
      } : s);
      setStudents(updatedStudents);
      setDialogOpen(false);
      setErrors({});
      toast.success(`${validated.name}'s profile updated successfully!`);
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
      case "Paid":
      case "Active":
        return "bg-accent text-accent-foreground";
      case "Absent":
      case "Pending":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  return <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground">Student Profile</h1>
            <p className="text-muted-foreground">Comprehensive student information and history</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-primary" onClick={() => setDialogOpen(true)}>
            Edit Profile
          </Button>
        </div>

        {/* Edit Student Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Student Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" placeholder="Enter student's full name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" placeholder="student@email.com" value={formData.email} onChange={e => setFormData({
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
                  <Label htmlFor="edit-instrument">Instrument</Label>
                  <Select value={formData.instrument} onValueChange={value => setFormData({
                  ...formData,
                  instrument: value
                })}>
                    <SelectTrigger id="edit-instrument">
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
                  <Label htmlFor="edit-level">Level</Label>
                  <Select value={formData.level} onValueChange={value => setFormData({
                  ...formData,
                  level: value
                })}>
                    <SelectTrigger id="edit-level">
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

                <div className="space-y-2 col-span-2">
                  <Label>Date of Birth</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={formData.dobMonth} onValueChange={value => setFormData({
                    ...formData,
                    dobMonth: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">January</SelectItem>
                        <SelectItem value="2">February</SelectItem>
                        <SelectItem value="3">March</SelectItem>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="5">May</SelectItem>
                        <SelectItem value="6">June</SelectItem>
                        <SelectItem value="7">July</SelectItem>
                        <SelectItem value="8">August</SelectItem>
                        <SelectItem value="9">September</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                        <SelectItem value="11">November</SelectItem>
                        <SelectItem value="12">December</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={formData.dobDay} onValueChange={value => setFormData({
                    ...formData,
                    dobDay: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                        length: 31
                      }, (_, i) => i + 1).map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    
                    <Select value={formData.dobYear} onValueChange={value => setFormData({
                    ...formData,
                    dobYear: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({
                        length: 100
                      }, (_, i) => new Date().getFullYear() - i).map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" placeholder="123 Music Street, Accra" value={formData.address} onChange={e => setFormData({
                  ...formData,
                  address: e.target.value
                })} />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>

                <div className="col-span-2 pt-2">
                  <div className="flex items-center justify-between mb-3">
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="parent-toggle" className="cursor-pointer">
                        Add parent/guardian
                      </Label>
                      <Switch id="parent-toggle" checked={hasParent} onCheckedChange={setHasParent} />
                    </div>
                  </div>
                </div>

                {hasParent && <>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="edit-parent-name">Parent/Guardian Name</Label>
                      <Input id="edit-parent-name" placeholder="Parent's full name" value={formData.parentName} onChange={e => setFormData({
                    ...formData,
                    parentName: e.target.value
                  })} />
                      {errors.parentName && <p className="text-sm text-destructive">{errors.parentName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-parent-email">Parent Email</Label>
                      <Input id="edit-parent-email" type="email" placeholder="parent@email.com" value={formData.parentEmail} onChange={e => setFormData({
                    ...formData,
                    parentEmail: e.target.value
                  })} />
                      {errors.parentEmail && <p className="text-sm text-destructive">{errors.parentEmail}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-parent-phone">Parent Phone</Label>
                      <Input id="edit-parent-phone" placeholder="+233 24 123 4560" value={formData.parentPhone} onChange={e => setFormData({
                    ...formData,
                    parentPhone: e.target.value
                  })} />
                      {errors.parentPhone && <p className="text-sm text-destructive">{errors.parentPhone}</p>}
                    </div>
                  </>}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleUpdateStudent}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Student Overview Card */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="gradient-primary text-white text-2xl font-bold">
                  {student.avatar}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{student.name}</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Music className="h-4 w-4" />
                      {student.instrument} - {student.level}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {student.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {student.phone}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Parent/Guardian</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-foreground">{student.parentName}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {student.parentEmail}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {student.parentPhone}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      DOB: {student.dateOfBirth}
                    </div>
                    <div className="text-muted-foreground">
                      Enrolled: {student.enrollmentDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="enrollment" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            <TabsTrigger value="enrollment">Enrollment History</TabsTrigger>
            <TabsTrigger value="payments">Payment Records</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Timeline</TabsTrigger>
            <TabsTrigger value="progress">Progress Reports</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>

          {/* Enrollment History */}
          <TabsContent value="enrollment">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Enrollment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollmentHistory.map((record, index) => <TableRow key={index}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.package}</TableCell>
                        <TableCell>{record.duration}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Records */}
          <TabsContent value="payments">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRecords.map((payment, index) => <TableRow key={index}>
                        <TableCell className="font-medium">{payment.invoiceNo}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell className="font-semibold text-primary">{payment.amount}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">View Receipt</Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Timeline */}
          <TabsContent value="attendance">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Attendance Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceTimeline.map((record, index) => <TableRow key={index}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>{record.tutor}</TableCell>
                        <TableCell>{record.topic}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Reports */}
          <TabsContent value="progress">
            <div className="space-y-6">
              {progressReports.map((report, index) => <Card key={index} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        {report.term}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">{report.date}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Technical Skills</span>
                          <span className="font-semibold text-foreground">{report.technicalSkills}%</span>
                        </div>
                        <Progress value={report.technicalSkills} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Music Theory</span>
                          <span className="font-semibold text-foreground">{report.musicTheory}%</span>
                        </div>
                        <Progress value={report.musicTheory} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Performance</span>
                          <span className="font-semibold text-foreground">{report.performance}%</span>
                        </div>
                        <Progress value={report.performance} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Practice Consistency</span>
                          <span className="font-semibold text-foreground">{report.practice}%</span>
                        </div>
                        <Progress value={report.practice} className="h-2" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h4 className="font-semibold text-foreground mb-2">Tutor's Comments</h4>
                      <p className="text-muted-foreground">{report.comments}</p>
                    </div>

                    <Button variant="outline" className="w-full">Download Report PDF</Button>
                  </CardContent>
                </Card>)}
            </div>
          </TabsContent>

          {/* Communications */}
          <TabsContent value="communications">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Communication Logs
                  </CardTitle>
                  <Button className="gradient-primary text-primary-foreground shadow-primary">
                    New Message
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communications.map((comm, index) => <div key={index} className="p-4 border border-border rounded-lg space-y-2 hover:shadow-card transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{comm.type}</Badge>
                          <span className="text-sm text-muted-foreground">From: {comm.from}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{comm.date}</span>
                      </div>
                      <h4 className="font-semibold text-foreground">{comm.subject}</h4>
                      <p className="text-sm text-muted-foreground">{comm.message}</p>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}