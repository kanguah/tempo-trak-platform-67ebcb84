import { useState } from "react";
import { DollarSign, Search, Filter, Download, CheckCircle, Clock, XCircle, CreditCard, Send, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
const COLORS = ["hsl(240 70% 55%)", "hsl(270 60% 60%)", "hsl(45 90% 60%)", "hsl(200 70% 55%)"];
export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: payments = [],
    isLoading
  } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('payments').select('*, students(name)').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const {
    data: expenses = []
  } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('expenses').select('amount, expense_date').eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const generatePaymentsMutation = useMutation({
    mutationFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-monthly-payments');
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['payments']
      });
      toast.success(`Generated ${data.paymentsCreated} payments successfully!`);
    },
    onError: () => {
      toast.error("Failed to generate payments");
    }
  });
  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('send-payment-reminders');
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      toast.success(`Sent ${data.remindersSent} reminders successfully!`);
    },
    onError: () => {
      toast.error("Failed to send reminders");
    }
  });
  const sendSingleReminderMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('send-payment-reminders', {
        body: {
          paymentId,
          force: true
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['payments']
      });
      toast.success(data.remindersSent > 0 ? "Reminder sent successfully!" : "No reminder was sent (may not meet reminder criteria)");
    },
    onError: () => {
      toast.error("Failed to send reminder");
    }
  });
  const verifyPaymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      method
    }: {
      paymentId: string;
      method: string;
    }) => {
      const {
        error
      } = await supabase.from('payments').update({
        status: 'completed',
        payment_date: new Date().toISOString(),
        description: method
      }).eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['payments']
      });
      toast.success("Payment verified successfully!");
      setVerifyDialogOpen(false);
      setSelectedPayment(null);
      setPaymentMethod("");
    },
    onError: () => {
      toast.error("Failed to verify payment");
    }
  });
  const openVerifyDialog = (paymentId: string) => {
    setSelectedPayment(paymentId);
    setPaymentMethod("");
    setVerifyDialogOpen(true);
  };
  const handleVerifyPayment = () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!selectedPayment) return;
    verifyPaymentMutation.mutate({
      paymentId: selectedPayment,
      method: paymentMethod
    });
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>;
      case "pending":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>;
      default:
        return null;
    }
  };

  // Calculate metrics
  const totalRevenue = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingAmount = payments.filter(p => p.status === "pending" || p.status === "failed").reduce((sum, p) => sum + Number(p.amount), 0);
  const paidCount = payments.filter(p => p.status === "completed").length;

  // Generate revenue data (last 6 months)
  const last6Months = Array.from({
    length: 6
  }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date;
  });
  const revenueData = last6Months.map(date => {
    const monthName = date.toLocaleString('default', {
      month: 'short'
    });
    const monthPayments = payments.filter(p => {
      if (!p.payment_date) return false;
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear();
    });
    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expense_date);
      return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
    });
    return {
      month: monthName,
      revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      expenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    };
  });

  // Payment method breakdown
  const paymentMethodData: Record<string, number> = {};
  payments.filter(p => p.status === 'completed' && p.description).forEach(p => {
    paymentMethodData[p.description] = (paymentMethodData[p.description] || 0) + Number(p.amount);
  });
  const methodChartData = Object.entries(paymentMethodData).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 5);
  if (isLoading) {
    return <div className="min-h-screen bg-background p-8">Loading...</div>;
  }
  return <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Payments & Fees</h1>
            <p className="text-muted-foreground">Track payments, invoices, and revenue</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => generatePaymentsMutation.mutate()} disabled={generatePaymentsMutation.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Payments
            </Button>
            <Button variant="outline" onClick={() => sendRemindersMutation.mutate()} disabled={sendRemindersMutation.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Send Reminders
            </Button>
            <Button className="gradient-accent text-accent-foreground shadow-accent">
              <Download className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="gradient-primary text-primary-foreground shadow-primary">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm opacity-90 mb-1">Total Revenue (This Month)</p>
                  <h3 className="text-2xl md:text-3xl font-bold">GH₵ {totalRevenue.toLocaleString()}</h3>
                </div>
                
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Pending/Overdue</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-orange-600">
                    GH₵ {pendingAmount.toLocaleString()}
                  </h3>
                </div>
                
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Payments Received</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-green-600">{paidCount}</h3>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue vs Expenses Chart */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Revenue vs Expenses (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.some(d => d.revenue > 0 || d.expenses > 0) ? <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No revenue data yet
                </div>}
            </CardContent>
          </Card>

          {/* Payment Method Breakdown */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {methodChartData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={methodChartData} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  percent
                }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={90} fill="#8884d8" dataKey="value">
                      {methodChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No payment method data yet
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Verify Payment Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Verify Payment</DialogTitle>
              <DialogDescription>
                Select the payment method used by the student to complete this transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer - GTBank">Bank Transfer - GTBank</SelectItem>
                    <SelectItem value="MTN MoMo">MTN Mobile Money</SelectItem>
                    <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
                    <SelectItem value="AirtelTigo Money">AirtelTigo Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => {
                setVerifyDialogOpen(false);
                setSelectedPayment(null);
                setPaymentMethod("");
              }}>
                  Cancel
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleVerifyPayment}>
                  Confirm Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search payments by student, invoice ID, or status..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
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
            {payments.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                No payments yet. Generate monthly payments to get started.
              </div> : <div className="space-y-3">
                {payments.filter(payment => !searchQuery || payment.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) || payment.id.toLowerCase().includes(searchQuery.toLowerCase())).map((payment, index) => <Card key={payment.id} className="border-2 animate-scale-in" style={{
              animationDelay: `${index * 0.05}s`
            }}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-bold text-foreground">
                                {payment.students?.name || "Unknown Student"}
                              </h3>
                              {getStatusBadge(payment.status)}
                              {payment.package_type && <Badge variant="outline">{payment.package_type}</Badge>}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <p className="font-medium">Invoice ID</p>
                                <p>{payment.id.slice(0, 8)}</p>
                              </div>
                              <div>
                                <p className="font-medium">Description</p>
                                <p className="truncate">{payment.description || "Payment"}</p>
                              </div>
                              <div>
                                <p className="font-medium">Due Date</p>
                                <p>{payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "-"}</p>
                              </div>
                              <div>
                                <p className="font-medium">Payment Method</p>
                                <p className="truncate">{payment.description || "-"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right md:ml-4">
                            <p className="text-xl md:text-2xl font-bold text-foreground">GH₵ {payment.amount}</p>
                            {payment.discount_amount > 0 && <p className="text-xs text-orange-600">Discount: GH₵{payment.discount_amount}</p>}
                            {(payment.status === "pending" || payment.status === "failed") && <div className="flex flex-col gap-2 mt-2">
                                {payment.status === "pending" && <Button size="sm" onClick={() => openVerifyDialog(payment.id)}>
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    Verify Payment
                                  </Button>}
                                <Button size="sm" variant="outline" onClick={() => sendSingleReminderMutation.mutate(payment.id)} disabled={sendSingleReminderMutation.isPending}>
                                  <Send className="h-4 w-4 mr-1" />
                                  Send Reminder
                                </Button>
                              </div>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}