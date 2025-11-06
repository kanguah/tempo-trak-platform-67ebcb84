import { Users, Calendar, DollarSign, TrendingUp, Music2, Clock } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 58000 },
  { month: "Jun", revenue: 67000 },
];

const studentGrowthData = [
  { month: "Jan", students: 120 },
  { month: "Feb", students: 135 },
  { month: "Mar", students: 142 },
  { month: "Apr", students: 156 },
  { month: "May", students: 168 },
  { month: "Jun", students: 183 },
];

const instrumentData = [
  { name: "Piano", value: 45 },
  { name: "Guitar", value: 38 },
  { name: "Violin", value: 22 },
  { name: "Drums", value: 28 },
  { name: "Voice", value: 35 },
];

const COLORS = ["hsl(240 70% 55%)", "hsl(270 60% 60%)", "hsl(45 90% 60%)", "hsl(200 70% 55%)", "hsl(320 65% 60%)"];

const upcomingLessons = [
  { time: "09:00 AM", student: "Sarah Johnson", instrument: "Piano", tutor: "Mr. Kofi" },
  { time: "10:30 AM", student: "Michael Chen", instrument: "Guitar", tutor: "Ms. Ama" },
  { time: "02:00 PM", student: "Emma Williams", instrument: "Violin", tutor: "Mr. Kwame" },
  { time: "04:00 PM", student: "David Brown", instrument: "Drums", tutor: "Mr. Yaw" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, Director! 👋</h1>
          <p className="text-muted-foreground">Here's what's happening at 49ice Academy today</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Active Students"
            value={183}
            icon={Users}
            trend={{ value: "8.2% vs last month", isPositive: true }}
            variant="primary"
          />
          <MetricCard
            title="Lessons Today"
            value={24}
            icon={Calendar}
            trend={{ value: "12 completed", isPositive: true }}
          />
          <MetricCard
            title="Monthly Revenue"
            value="GH₵ 67,000"
            icon={DollarSign}
            trend={{ value: "15.3% vs last month", isPositive: true }}
            variant="accent"
          />
          <MetricCard
            title="Active Tutors"
            value={15}
            icon={Music2}
            trend={{ value: "2 new this month", isPositive: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Student Growth Chart */}
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Student Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="students" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Instrument Distribution */}
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-accent" />
                Instruments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={instrumentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {instrumentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="md:col-span-2 shadow-card animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Today's Upcoming Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingLessons.map((lesson, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{lesson.student}</p>
                        <p className="text-sm text-muted-foreground">
                          {lesson.instrument} with {lesson.tutor}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{lesson.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
