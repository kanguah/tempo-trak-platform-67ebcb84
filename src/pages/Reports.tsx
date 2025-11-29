import { useState } from "react";
import { FileText, Download, Filter, Calendar, Users, DollarSign, Clock, TrendingUp, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type ReportType = "all" | "attendance" | "financial" | "enrollment" | "performance" | "expenses";
type DateRange = "current" | "last" | "last3" | "last6";

const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    Attendance: "bg-primary/10 text-primary border-primary/20",
    Financial: "bg-accent/10 text-accent-foreground border-accent/20",
    Enrollment: "bg-secondary/10 text-secondary-foreground border-secondary/20",
    Performance: "bg-primary-light/10 text-primary border-primary-light/20",
    Expenses: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Badge className={colors[type] || "bg-muted text-muted-foreground"} variant="outline">
      {type}
    </Badge>
  );
};

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(header => `"${row[header] || ""}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
};

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("all");
  const [dateRange, setDateRange] = useState<DateRange>("current");

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "current":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last3":
        return { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(now) };
      case "last6":
        return { start: startOfMonth(subMonths(now, 6)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const dateFilter = getDateRangeFilter();

  // Fetch attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ["attendance", user?.id, dateFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, student_id, tutor_id, students(name), tutors(name)")
        .eq("user_id", user?.id!)
        .gte("lesson_date", format(dateFilter.start, "yyyy-MM-dd"))
        .lte("lesson_date", format(dateFilter.end, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch financial data
  const { data: paymentsData } = useQuery({
    queryKey: ["payments", user?.id, dateFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, students(name)")
        .eq("user_id", user?.id!)
        .gte("due_date", dateFilter.start.toISOString())
        .lte("due_date", dateFilter.end.toISOString());
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch expenses data
  const { data: expensesData } = useQuery({
    queryKey: ["expenses", user?.id, dateFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user?.id!)
        .gte("expense_date", format(dateFilter.start, "yyyy-MM-dd"))
        .lte("expense_date", format(dateFilter.end, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch students data
  const { data: studentsData } = useQuery({
    queryKey: ["students", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user?.id!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch tutors data
  const { data: tutorsData } = useQuery({
    queryKey: ["tutors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutors")
        .select("*")
        .eq("user_id", user?.id!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const generateAttendanceReport = () => {
    if (!attendanceData || attendanceData.length === 0) {
      toast({ title: "No data available", description: "No attendance records found for the selected period.", variant: "destructive" });
      return;
    }

    const reportData = attendanceData.map(record => ({
      Date: format(new Date(record.lesson_date), "MMM dd, yyyy"),
      Student: record.students?.name || "N/A",
      Tutor: record.tutors?.name || "N/A",
      Subject: record.subject,
      Status: record.status,
      Rating: record.rating || "N/A",
      Feedback: record.feedback || "N/A"
    }));

    exportToCSV(reportData, "attendance_report");
    toast({ title: "Report exported", description: "Attendance report downloaded successfully." });
  };

  const generateFinancialReport = () => {
    if (!paymentsData || paymentsData.length === 0) {
      toast({ title: "No data available", description: "No payment records found for the selected period.", variant: "destructive" });
      return;
    }

    const totalRevenue = paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    
    const reportData: any[] = paymentsData.map(payment => ({
      Date: format(new Date(payment.created_at), "MMM dd, yyyy"),
      Student: payment.students?.name || "N/A",
      Amount: `GH₵${Number(payment.amount).toFixed(2)}`,
      Status: payment.status,
      "Due Date": payment.due_date ? format(new Date(payment.due_date), "MMM dd, yyyy") : "N/A",
      Description: payment.description || "N/A"
    }));

    reportData.push({
      Date: "SUMMARY",
      Student: "",
      Amount: "",
      Status: "",
      "Due Date": "",
      Description: ""
    });
    reportData.push({
      Date: "Total Revenue",
      Student: "",
      Amount: `GH₵${totalRevenue.toFixed(2)}`,
      Status: "",
      "Due Date": "",
      Description: ""
    });
    reportData.push({
      Date: "Total Expenses",
      Student: "",
      Amount: `GH₵${totalExpenses.toFixed(2)}`,
      Status: "",
      "Due Date": "",
      Description: ""
    });
    reportData.push({
      Date: "Net Profit",
      Student: "",
      Amount: `GH₵${(totalRevenue - totalExpenses).toFixed(2)}`,
      Status: "",
      "Due Date": "",
      Description: ""
    });

    exportToCSV(reportData, "financial_report");
    toast({ title: "Report exported", description: "Financial report downloaded successfully." });
  };

  const generateEnrollmentReport = () => {
    if (!studentsData || studentsData.length === 0) {
      toast({ title: "No data available", description: "No student records found.", variant: "destructive" });
      return;
    }

    const reportData = studentsData.map(student => ({
      Name: student.name,
      Grade: student.grade || "N/A",
      "Enrollment Date": format(new Date(student.enrollment_date), "MMM dd, yyyy"),
      Status: student.status,
      Subjects: student.subjects?.join(", ") || "N/A",
      "Monthly Fee": student.monthly_fee ? `GH₵${Number(student.monthly_fee).toFixed(2)}` : "N/A",
      "Payment Status": student.payment_status || "N/A"
    }));

    exportToCSV(reportData, "enrollment_report");
    toast({ title: "Report exported", description: "Enrollment report downloaded successfully." });
  };

  const generatePerformanceReport = () => {
    if (!tutorsData || tutorsData.length === 0) {
      toast({ title: "No data available", description: "No tutor records found.", variant: "destructive" });
      return;
    }

    const reportData = tutorsData.map(tutor => {
      const tutorAttendance = attendanceData?.filter(a => a.tutor_id === tutor.id) || [];
      const avgRating = tutorAttendance.length > 0 
        ? tutorAttendance.reduce((sum, a) => sum + (a.rating || 0), 0) / tutorAttendance.filter(a => a.rating).length
        : 0;

      return {
        Name: tutor.name,
        Email: tutor.email || "N/A",
        Status: tutor.status,
        Subjects: tutor.subjects?.join(", ") || "N/A",
        "Lessons Taught": tutorAttendance.length,
        "Average Rating": avgRating > 0 ? avgRating.toFixed(1) : "N/A",
        "Monthly Salary": tutor.monthly_salary ? `GH₵${Number(tutor.monthly_salary).toFixed(2)}` : "N/A"
      };
    });

    exportToCSV(reportData, "tutor_performance_report");
    toast({ title: "Report exported", description: "Tutor performance report downloaded successfully." });
  };

  const generateExpensesReport = () => {
    if (!expensesData || expensesData.length === 0) {
      toast({ title: "No data available", description: "No expense records found for the selected period.", variant: "destructive" });
      return;
    }

    const reportData = expensesData.map(expense => ({
      Date: format(new Date(expense.expense_date), "MMM dd, yyyy"),
      Category: expense.category,
      Amount: `GH₵${Number(expense.amount).toFixed(2)}`,
      Description: expense.description || "N/A",
      Status: expense.status,
      "Payment Method": expense.payment_method || "N/A"
    }));

    const totalExpenses = expensesData.reduce((sum, e) => sum + Number(e.amount), 0);
    reportData.push({
      Date: "TOTAL",
      Category: "",
      Amount: `GH₵${totalExpenses.toFixed(2)}`,
      Description: "",
      Status: "",
      "Payment Method": ""
    });

    exportToCSV(reportData, "expenses_report");
    toast({ title: "Report exported", description: "Expenses report downloaded successfully." });
  };

  // Calculate statistics
  const totalStudents = studentsData?.length || 0;
  const activeStudents = studentsData?.filter(s => s.status === "active").length || 0;
  const totalRevenue = paymentsData?.reduce((sum, p) => sum + Number(p.paid_amount), 0) || 0;
  const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const attendanceRate = attendanceData?.length 
    ? ((attendanceData.filter(a => a.status === "present").length / attendanceData.length) * 100).toFixed(1)
    : "0";

  const reports = [
    {
      id: "attendance",
      title: "Attendance Report",
      description: `${attendanceData?.length || 0} records for selected period`,
      type: "Attendance",
      icon: Clock,
      count: attendanceData?.length || 0,
      onGenerate: generateAttendanceReport,
      stats: `${attendanceRate}% completion rate`
    },
    {
      id: "financial",
      title: "Financial Report",
      description: `Revenue: GH₵${totalRevenue.toLocaleString()} | Expenses: GH₵${totalExpenses.toLocaleString()}`,
      type: "Financial",
      icon: DollarSign,
      count: paymentsData?.length || 0,
      onGenerate: generateFinancialReport,
      stats: `Net: GH₵${(totalRevenue - totalExpenses).toLocaleString()}`
    },
    {
      id: "enrollment",
      title: "Student Enrollment Report",
      description: `${activeStudents} active students out of ${totalStudents} total`,
      type: "Enrollment",
      icon: GraduationCap,
      count: totalStudents,
      onGenerate: generateEnrollmentReport,
      stats: `${((activeStudents / (totalStudents || 1)) * 100).toFixed(0)}% active`
    },
    {
      id: "performance",
      title: "Tutor Performance Report",
      description: `${tutorsData?.length || 0} tutors performance metrics`,
      type: "Performance",
      icon: TrendingUp,
      count: tutorsData?.length || 0,
      onGenerate: generatePerformanceReport,
      stats: `${attendanceData?.length || 0} lessons delivered`
    },
    {
      id: "expenses",
      title: "Expenses Report",
      description: `Total expenses: GH₵${totalExpenses.toLocaleString()}`,
      type: "Expenses",
      icon: DollarSign,
      count: expensesData?.length || 0,
      onGenerate: generateExpensesReport,
      stats: `${expensesData?.length || 0} transactions`
    }
  ];

  const filteredReports = reports.filter(report => 
    reportType === "all" || report.id === reportType
  );
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and export comprehensive reports</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card gradient-card border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium mb-1 text-muted-foreground">Total Students</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-1">{totalStudents}</h3>
                  <p className="text-xs text-muted-foreground">{activeStudents} active</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card gradient-card border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium mb-1 text-muted-foreground">Total Revenue</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-1">GH₵{totalRevenue.toLocaleString()}</h3>
                  <p className="text-xs text-muted-foreground">Selected period</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-accent/10">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card gradient-card border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium mb-1 text-muted-foreground">Total Expenses</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-1">GH₵{totalExpenses.toLocaleString()}</h3>
                  <p className="text-xs text-muted-foreground">Selected period</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-destructive/10">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card gradient-card border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium mb-1 text-muted-foreground">Attendance Rate</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-1">{attendanceRate}%</h3>
                  <p className="text-xs text-muted-foreground">{attendanceData?.length || 0} records</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-secondary/10">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="enrollment">Enrollment</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Month</SelectItem>
                    <SelectItem value="last">Last Month</SelectItem>
                    <SelectItem value="last3">Last 3 Months</SelectItem>
                    <SelectItem value="last6">Last 6 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report, index) => (
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
                    <span className="text-muted-foreground">Records:</span>
                    <span className="font-medium">{report.count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stats:</span>
                    <span className="font-medium text-xs">{report.stats}</span>
                  </div>
                </div>

                <Button 
                  className="w-full gradient-primary text-primary-foreground shadow-primary" 
                  size="sm"
                  onClick={report.onGenerate}
                  disabled={report.count === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or date range.</p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="shadow-card gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              About Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Reports are generated based on your current data and selected date range. All exports are in CSV format for easy analysis in Excel or Google Sheets.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Real-time Data</p>
                  <p className="text-xs text-muted-foreground">Reports reflect current database state</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50">
                <Download className="h-5 w-5 text-accent-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">CSV Format</p>
                  <p className="text-xs text-muted-foreground">Compatible with all spreadsheet apps</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
