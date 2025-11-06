import { useState } from "react";
import { DollarSign, Search, Filter, Download, CheckCircle, Clock, XCircle, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const payments = [
  {
    id: "INV-001",
    student: "Sarah Johnson",
    amount: "GH₵ 450",
    status: "paid",
    method: "MTN MoMo",
    date: "June 1, 2024",
    dueDate: "June 1, 2024",
    package: "8 Lessons/Month",
  },
  {
    id: "INV-002",
    student: "Michael Chen",
    amount: "GH₵ 450",
    status: "pending",
    method: "Bank Transfer",
    date: "-",
    dueDate: "June 5, 2024",
    package: "8 Lessons/Month",
  },
  {
    id: "INV-003",
    student: "Emma Williams",
    amount: "GH₵ 350",
    status: "paid",
    method: "Cash",
    date: "June 2, 2024",
    dueDate: "June 1, 2024",
    package: "6 Lessons/Month",
  },
  {
    id: "INV-004",
    student: "David Brown",
    amount: "GH₵ 450",
    status: "overdue",
    method: "-",
    date: "-",
    dueDate: "May 28, 2024",
    package: "8 Lessons/Month",
  },
  {
    id: "INV-005",
    student: "Sophia Martinez",
    amount: "GH₵ 550",
    status: "paid",
    method: "Paystack",
    date: "June 1, 2024",
    dueDate: "June 1, 2024",
    package: "10 Lessons/Month",
  },
  {
    id: "INV-006",
    student: "James Wilson",
    amount: "GH₵ 350",
    status: "pending",
    method: "-",
    date: "-",
    dueDate: "June 7, 2024",
    package: "6 Lessons/Month",
  },
];

const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 35000 },
  { month: "Mar", revenue: 48000, expenses: 33000 },
  { month: "Apr", revenue: 61000, expenses: 38000 },
  { month: "May", revenue: 58000, expenses: 36000 },
  { month: "Jun", revenue: 67000, expenses: 40000 },
];

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return null;
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, "")), 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, "")), 0);
  const paidCount = payments.filter((p) => p.status === "paid").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Payments & Fees</h1>
            <p className="text-muted-foreground">Track payments, invoices, and revenue</p>
          </div>
          <Button className="gradient-accent text-accent-foreground shadow-accent">
            <Download className="mr-2 h-5 w-5" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="gradient-primary text-primary-foreground shadow-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Total Revenue (This Month)</p>
                  <h3 className="text-3xl font-bold">GH₵ {totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending/Overdue</p>
                  <h3 className="text-3xl font-bold text-orange-600">
                    GH₵ {pendingAmount.toLocaleString()}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payments Received</p>
                  <h3 className="text-3xl font-bold text-green-600">{paidCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Revenue vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
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
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search payments by student, invoice ID, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <Card
                  key={payment.id}
                  className="border-2 animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-foreground">{payment.student}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p className="font-medium">Invoice ID</p>
                            <p>{payment.id}</p>
                          </div>
                          <div>
                            <p className="font-medium">Package</p>
                            <p>{payment.package}</p>
                          </div>
                          <div>
                            <p className="font-medium">Due Date</p>
                            <p>{payment.dueDate}</p>
                          </div>
                          <div>
                            <p className="font-medium">Payment Method</p>
                            <p>{payment.method || "-"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-foreground">{payment.amount}</p>
                        {payment.status === "pending" && (
                          <Button size="sm" className="mt-2">
                            <CreditCard className="h-4 w-4 mr-1" />
                            Verify Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
