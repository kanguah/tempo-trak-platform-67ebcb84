import { TrendingUp, Users, DollarSign, Award, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["hsl(170 65% 60%)", "hsl(15 95% 68%)", "hsl(265 65% 65%)", "hsl(340 75% 65%)", "hsl(200 70% 60%)","hsl(45 90% 62%)"];

export default function Analytics() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: payments = [] } = useQuery({
    queryKey: ['analytics-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['analytics-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['analytics-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tutors = [] } = useQuery({
    queryKey: ['analytics-tutors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutors')
        .select('*, lessons(id, student_id)')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate profit data for last 6 months
  /*const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date;
  });
*/
const today = new Date();
const Year = today.getFullYear();
const Month = today.getMonth(); // 0-based (0 = January)

const monthsFromStartOfYear = Array.from(
  { length: Month + 1 }, // +1 to include current month
  (_, i) => new Date(Year, i, 1) // first day of each month
);
  const profitData = monthsFromStartOfYear.map(date => {
    const monthName = date.toLocaleString('default', { month: 'short' });
    const monthPayments = payments.filter(p => {
      if (!p.due_date) return false;
      const paymentDate = new Date(p.due_date);
      return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear();
    });
    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expense_date);
      return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
    });
    
    const revenue = monthPayments.reduce((sum, p) => sum + Number(p.paid_amount), 0);
    const expenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    return {
      month: monthName,
      revenue,
      expenses: expenseTotal,
      profit: revenue - expenseTotal,
    };
  });

  // Current month metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthData = profitData[profitData.length - 1];
  const previousMonthData = profitData[profitData.length - 2];
  
  const profitGrowth = previousMonthData?.profit 
    ? ((currentMonthData.profit - previousMonthData.profit) / previousMonthData.profit * 100).toFixed(1)
    : 0;

  const revenueGrowth = previousMonthData?.revenue
    ? ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue * 100).toFixed(1)
    : 0;

  // Calculate retention (students active vs total)
  const activeStudents = students.filter(s => s.status === 'active').length;
  const retentionRate = students.length > 0 ? ((activeStudents / students.length) * 100).toFixed(0) : 0;

  // Calculate avg revenue per student
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.paid_amount), 0);
  const avgRevenuePerStudent = activeStudents > 0 ? (currentMonthData.revenue / activeStudents).toFixed(0) : 0;

  // Tutor performance
  const tutorPerformance = tutors.map(tutor => {
    const tutorLessons = tutor.lessons || [];
    const uniqueStudents = new Set(tutorLessons.map((l: any) => l.student_id)).size;
    
    return {
      name: tutor.name,
      students: uniqueStudents,
      revenue: uniqueStudents * 300, // Approximate
      satisfaction: 95 + Math.random() * 5, // Mock satisfaction
    };
  }).sort((a, b) => b.students - a.students).slice(0, 5);

  // Expense breakdown
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach(expense => {
    expenseByCategory[expense.category] = (expenseByCategory[expense.category] || 0) + Number(expense.amount);
  });

  const expenseBreakdown = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Business Analytics</h1>
          <p className="text-muted-foreground">Real-time financial and growth metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Net Profit"
            value={`GH₵ ${currentMonthData.profit.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: `${profitGrowth}% vs last month`, isPositive: Number(profitGrowth) > 0 }}
            variant="accent"
          />
          <MetricCard
            title="Revenue Growth"
            value={`${revenueGrowth}%`}
            icon={TrendingUp}
            trend={{ value: "Month over month", isPositive: Number(revenueGrowth) > 0 }}
            variant="primary"
          />
          <MetricCard
            title="Student Retention"
            value={`${retentionRate}%`}
            icon={Award}
            trend={{ value: `${activeStudents} active students`, isPositive: true }}
          />
          <MetricCard
            title="Avg Revenue/Student"
            value={`GH₵ ${avgRevenuePerStudent}`}
            icon={Target}
            trend={{ value: "This month", isPositive: true }}
          />
        </div>

        {/* Profit & Loss Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Profit & Loss Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profitData.some(d => d.revenue > 0 || d.expenses > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={profitData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No financial data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Tutor Performance */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Tutor Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tutorPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tutorPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" width={80} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="students" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No tutor data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <PieChart margin={{ top: isMobile ? 10 : 20, right: isMobile ? 10 : 20, bottom: isMobile ? 10 : 20, left: isMobile ? 10 : 20 }}>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy={isMobile ? "45%" : "50%"}
                      labelLine={!isMobile}
                      label={isMobile ? undefined : ({ percent }) => ` ${(percent * 100).toFixed(0)}%`}
                      outerRadius={isMobile ? 80 : 90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `GH₵${Number(value).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: isMobile ? "12px" : "14px"
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      height={isMobile ? 40 : 36}
                      wrapperStyle={{ fontSize: isMobile ? "12px" : "14px", paddingTop: isMobile ? "15px" : "0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={`${isMobile ? 'h-[250px]' : 'h-[300px]'} flex items-center justify-center text-muted-foreground`}>
                  No expense data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}