import { FileText, Download, Filter, Calendar, Users, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const reports = [
  {
    id: 1,
    title: "Monthly Attendance Report",
    description: "Complete attendance records for May 2024",
    type: "Attendance",
    date: "June 1, 2024",
    status: "Ready",
    icon: Clock,
  },
  {
    id: 2,
    title: "Revenue & Payment Summary",
    description: "Financial overview for Q2 2024",
    type: "Financial",
    date: "June 1, 2024",
    status: "Ready",
    icon: DollarSign,
  },
  {
    id: 3,
    title: "Student Enrollment Report",
    description: "New enrollments and retention metrics",
    type: "Enrollment",
    date: "May 28, 2024",
    status: "Ready",
    icon: Users,
  },
  {
    id: 4,
    title: "Tutor Performance Analysis",
    description: "Teaching hours, student feedback, and metrics",
    type: "Performance",
    date: "May 25, 2024",
    status: "Ready",
    icon: Users,
  },
  {
    id: 5,
    title: "Marketing Conversion Report",
    description: "Lead sources and conversion rates",
    type: "Marketing",
    date: "May 20, 2024",
    status: "Ready",
    icon: Users,
  },
  {
    id: 6,
    title: "Weekly Schedule Report",
    description: "Lesson scheduling and utilization rates",
    type: "Scheduling",
    date: "Ongoing",
    status: "Auto-Generated",
    icon: Calendar,
  },
];

const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    Attendance: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Financial: "bg-green-500/10 text-green-600 border-green-500/20",
    Enrollment: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    Performance: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    Marketing: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    Scheduling: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  };

  return (
    <Badge className={colors[type] || "bg-muted text-muted-foreground"} variant="outline">
      {type}
    </Badge>
  );
};

export default function Reports() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and export comprehensive reports</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-primary">
            <FileText className="mr-2 h-5 w-5" />
            Generate Custom Report
          </Button>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-card gradient-card">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Button className="h-auto flex-col gap-2 p-4" variant="outline">
                <Clock className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Attendance</span>
              </Button>
              <Button className="h-auto flex-col gap-2 p-4" variant="outline">
                <DollarSign className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium">Financial</span>
              </Button>
              <Button className="h-auto flex-col gap-2 p-4" variant="outline">
                <Users className="h-6 w-6 text-secondary" />
                <span className="text-sm font-medium">Students</span>
              </Button>
              <Button className="h-auto flex-col gap-2 p-4" variant="outline">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Schedule</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                All Types
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report, index) => (
            <Card
              key={report.id}
              className="shadow-card hover:shadow-primary transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  {getTypeBadge(report.type)}
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Generated:</span>
                    <span className="font-medium">{report.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      className={
                        report.status === "Ready"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      }
                      variant="outline"
                    >
                      {report.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button className="flex-1" size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export Options */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Automated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Set up automated report generation and delivery via email
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Weekly Attendance Summary</p>
                    <p className="text-sm text-muted-foreground">Every Monday at 9:00 AM</p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-600">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Monthly Financial Report</p>
                    <p className="text-sm text-muted-foreground">First day of each month</p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-600">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
