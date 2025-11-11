import { Users, Calendar, DollarSign, TrendingUp, Clock, Bell, UserPlus, CreditCard } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSidebar } from "@/components/ui/sidebar";
const COLORS = ["hsl(240 70% 55%)", "hsl(270 60% 60%)", "hsl(45 90% 60%)", "hsl(200 70% 55%)", "hsl(320 65% 60%)"];
export default function Dashboard() {
  const {
    user
  } = useAuth();
  const { state } = useSidebar();

  // Fetch all data
  const {
    data: students = []
  } = useQuery({
    queryKey: ["dashboard-students"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("students").select("*").eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const {
    data: tutors = []
  } = useQuery({
    queryKey: ["dashboard-tutors"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tutors").select("*").eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const {
    data: payments = []
  } = useQuery({
    queryKey: ["dashboard-payments"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("payments").select("*, students(name)").eq("user_id", user?.id).order("created_at", {
        ascending: false
      }).limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const {
    data: leads = []
  } = useQuery({
    queryKey: ["dashboard-leads"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("crm_leads").select("*").eq("user_id", user?.id).order("created_at", {
        ascending: false
      }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const {
    data: notifications = []
  } = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("notifications").select("*").eq("user_id", user?.id).order("created_at", {
        ascending: false
      }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Calculate statistics
  const activeStudents = students.filter(s => s.status === "active").length;
  const activeTutors = tutors.filter(t => t.status === "Active").length;
  const totalRevenue = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const recentLeads = leads.filter(l => l.stage === "new").length;

  // Generate revenue chart data (last 6 months)
  const revenueData = Array.from({
    length: 6
  }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthName = date.toLocaleString("default", {
      month: "short"
    });
    const monthPayments = payments.filter(p => {
      if (!p.payment_date) return false;
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear();
    });
    const revenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      month: monthName,
      revenue
    };
  });

  // Generate student growth chart
  const studentGrowthData = Array.from({
    length: 6
  }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthName = date.toLocaleString("default", {
      month: "short"
    });
    const monthStudents = students.filter(s => {
      const enrollDate = new Date(s.enrollment_date);
      return enrollDate <= date;
    });
    return {
      month: monthName,
      students: monthStudents.length
    };
  });

  // Generate instrument/subject distribution
  const subjectCount: Record<string, number> = {};
  students.forEach(student => {
    if (student.subjects && Array.isArray(student.subjects)) {
      student.subjects.forEach((subject: string) => {
        subjectCount[subject] = (subjectCount[subject] || 0) + 1;
      });
    }
  });
  const instrumentData = Object.entries(subjectCount).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Recent activity combining all sources
  const recentActivity = [...notifications.map(n => ({
    type: "notification",
    title: n.title,
    description: n.message,
    time: new Date(n.created_at).toLocaleString(),
    icon: Bell,
    color: "text-blue-600"
  })), ...leads.slice(0, 3).map(l => ({
    type: "lead",
    title: "New Lead",
    description: `${l.name} - ${l.email}`,
    time: new Date(l.created_at).toLocaleString(),
    icon: UserPlus,
    color: "text-green-600"
  })), ...payments.slice(0, 3).map(p => ({
    type: "payment",
    title: p.status === "completed" ? "Payment Received" : "Payment Pending",
    description: `GH₵ ${p.amount} - ${p.students?.name || "Unknown"}`,
    time: new Date(p.created_at).toLocaleString(),
    icon: CreditCard,
    color: p.status === "completed" ? "text-green-600" : "text-orange-600"
  }))].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
  return <div className="min-h-screen bg-background">
      <div className={`p-8 space-y-8 animate-fade-in ${state === "collapsed" ? "max-w-7xl mx-auto" : ""}`}>
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Here's what's happening at your academy today</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Active Students" value={activeStudents} icon={Users} trend={{
          value: `${students.length} total`,
          isPositive: true
        }} variant="primary" />
          <MetricCard title="Active Tutors" value={activeTutors} icon={Users} trend={{
          value: `${tutors.length} total`,
          isPositive: true
        }} />
          <MetricCard title="Total Revenue" value={`GH₵ ${totalRevenue.toLocaleString()}`} icon={DollarSign} trend={{
          value: `${pendingPayments} pending`,
          isPositive: pendingPayments === 0
        }} variant="accent" />
          <MetricCard title="New Leads" value={recentLeads} icon={UserPlus} trend={{
          value: `${leads.length} total leads`,
          isPositive: true
        }} />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Trend (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.some(d => d.revenue > 0) ? <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{
                  fill: "hsl(var(--primary))",
                  r: 5
                }} />
                  </LineChart>
                </ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No revenue data yet
                </div>}
            </CardContent>
          </Card>

          {/* Student Growth Chart */}
          <Card className="shadow-card animate-slide-up" style={{
          animationDelay: "0.1s"
        }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Student Growth (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentGrowthData.some(d => d.students > 0) ? <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} />
                    <Bar dataKey="students" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No student data yet
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Instrument Distribution */}
          <Card className="shadow-card animate-slide-up" style={{
          animationDelay: "0.2s"
        }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Student Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {instrumentData.length > 0 ? <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={instrumentData} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  percent
                }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {instrumentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No subject data yet
                </div>}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-card animate-slide-up" style={{
          animationDelay: "0.3s"
        }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? <div className="space-y-3">
                  {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${activity.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">{activity.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {activity.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>;
              })}
                </div> : <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No recent activity
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        
      </div>
    </div>;
}