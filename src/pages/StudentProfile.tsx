import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Music, Calendar, DollarSign, Award, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

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
    dateOfBirth: "March 12, 2008",
  }
};

const enrollmentHistory = [
  { date: "Jan 15, 2023", package: "Piano - Beginner Package", status: "Completed", duration: "6 months" },
  { date: "Jul 20, 2023", package: "Piano - Intermediate Package", status: "Completed", duration: "6 months" },
  { date: "Jan 10, 2024", package: "Piano - Advanced Package", status: "Active", duration: "Ongoing" },
];

const paymentRecords = [
  { date: "Nov 15, 2024", amount: "GH₵ 800", method: "MTN MoMo", status: "Paid", invoiceNo: "INV-2024-1145" },
  { date: "Oct 15, 2024", amount: "GH₵ 800", method: "Bank Transfer", status: "Paid", invoiceNo: "INV-2024-1098" },
  { date: "Sep 15, 2024", amount: "GH₵ 800", method: "Cash", status: "Paid", invoiceNo: "INV-2024-1052" },
  { date: "Dec 15, 2024", amount: "GH₵ 800", method: "Pending", status: "Pending", invoiceNo: "INV-2024-1189" },
];

const attendanceTimeline = [
  { date: "Nov 20, 2024", time: "9:00 AM", tutor: "Mr. David", status: "Present", topic: "Sonata in C Major" },
  { date: "Nov 18, 2024", time: "9:00 AM", tutor: "Mr. David", status: "Present", topic: "Bach Prelude No. 1" },
  { date: "Nov 15, 2024", time: "9:00 AM", tutor: "Mr. David", status: "Present", topic: "Scales & Arpeggios" },
  { date: "Nov 13, 2024", time: "9:00 AM", tutor: "Mr. David", status: "Absent", topic: "Chord Progressions" },
  { date: "Nov 11, 2024", time: "9:00 AM", tutor: "Mr. David", status: "Present", topic: "Sight Reading" },
];

const progressReports = [
  { 
    term: "Term 3, 2024", 
    date: "Oct 31, 2024",
    technicalSkills: 95,
    musicTheory: 88,
    performance: 92,
    practice: 85,
    comments: "Exceptional progress! Sarah demonstrates outstanding technique and musicality. Her performance of Chopin's Nocturne was remarkable."
  },
  { 
    term: "Term 2, 2024", 
    date: "Jul 31, 2024",
    technicalSkills: 90,
    musicTheory: 85,
    performance: 88,
    practice: 80,
    comments: "Consistent improvement across all areas. Sarah needs to focus more on sight-reading exercises."
  },
];

const communications = [
  { date: "Nov 22, 2024", type: "Email", from: "Admin", subject: "Upcoming Recital", message: "Reminder about the annual recital on Dec 15th. Sarah will perform Moonlight Sonata." },
  { date: "Nov 10, 2024", type: "WhatsApp", from: "Mr. David", subject: "Practice Recommendation", message: "Please encourage Sarah to practice scales for 15 minutes daily." },
  { date: "Oct 28, 2024", type: "Phone", from: "Parent", subject: "Schedule Change Request", message: "Requested to move lesson from Monday to Wednesday." },
  { date: "Oct 15, 2024", type: "Email", from: "Admin", subject: "Payment Confirmation", message: "Payment received for October tuition. Thank you!" },
];

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const student = studentData[id as keyof typeof studentData];

  if (!student) {
    return <div className="p-8">Student not found</div>;
  }

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

  return (
    <div className="min-h-screen bg-background">
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
          <Button className="gradient-primary text-primary-foreground shadow-primary">
            Edit Profile
          </Button>
        </div>

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
                    {enrollmentHistory.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.package}</TableCell>
                        <TableCell>{record.duration}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    {paymentRecords.map((payment, index) => (
                      <TableRow key={index}>
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
                      </TableRow>
                    ))}
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
                    {attendanceTimeline.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>{record.tutor}</TableCell>
                        <TableCell>{record.topic}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Reports */}
          <TabsContent value="progress">
            <div className="space-y-6">
              {progressReports.map((report, index) => (
                <Card key={index} className="shadow-card">
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
                </Card>
              ))}
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
                  {communications.map((comm, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg space-y-2 hover:shadow-card transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{comm.type}</Badge>
                          <span className="text-sm text-muted-foreground">From: {comm.from}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{comm.date}</span>
                      </div>
                      <h4 className="font-semibold text-foreground">{comm.subject}</h4>
                      <p className="text-sm text-muted-foreground">{comm.message}</p>
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
