import { useState } from "react";
import { Search, Filter, Download, CheckCircle, Clock, XCircle, CreditCard, Send, RefreshCw, X, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
const COLORS = ["hsl(240 70% 55%)", "hsl(270 60% 60%)", "hsl(45 90% 60%)", "hsl(200 70% 55%)"];
export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "part">("full");
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [packageTypeFilter, setPackageTypeFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [amountRangeFilter, setAmountRangeFilter] = useState<{
    min: string;
    max: string;
  }>({
    min: "",
    max: ""
  });
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
      method,
      paidAmount,
      isFullPayment
    }: {
      paymentId: string;
      method: string;
      paidAmount: number;
      isFullPayment: boolean;
    }) => {
      const updateData: any = {
        payment_date: new Date().toISOString(),
        description: method,
        paid_amount: paidAmount
      };
      
      // Only mark as completed if it's a full payment
      if (isFullPayment) {
        updateData.status = 'completed';
      }
      
      const {
        error
      } = await supabase.from('payments').update(updateData).eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['payments']
      });
      const message = variables.isFullPayment 
        ? "Payment verified successfully!" 
        : "Partial payment recorded successfully!";
      toast.success(message);
      setVerifyDialogOpen(false);
      setSelectedPayment(null);
      setPaymentMethod("");
      setPaymentType("full");
      setPartialAmount("");
    },
    onError: () => {
      toast.error("Failed to verify payment");
    }
  });
  
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("Payment deleted successfully!");
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete payment");
    }
  });
  
  const openDeleteDialog = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setDeleteDialogOpen(true);
  };
  
  const handleDeletePayment = () => {
    if (paymentToDelete) {
      deletePaymentMutation.mutate(paymentToDelete);
    }
  };
  const openVerifyDialog = (paymentId: string) => {
    setSelectedPayment(paymentId);
    setPaymentMethod("");
    setPaymentType("full");
    setPartialAmount("");
    setVerifyDialogOpen(true);
  };
  const handleVerifyPayment = () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    
    if (paymentType === "part") {
      const amount = Number(partialAmount);
      if (!partialAmount || amount <= 0) {
        toast.error("Please enter a valid payment amount");
        return;
      }
      const payment = payments.find(p => p.id === selectedPayment);
      if (payment) {
        const remainingBalance = getRemainingBalance(payment);
        if (amount > remainingBalance) {
          toast.error(`Amount cannot exceed remaining balance of GH₵${remainingBalance.toFixed(2)}`);
          return;
        }
      }
    }
    
    if (!selectedPayment) return;
    
    const payment = payments.find(p => p.id === selectedPayment);
    if (!payment) return;
    
    const previouslyPaid = Number(payment.paid_amount || 0);
    const newPayment = paymentType === "full" 
      ? getRemainingBalance(payment)  // Pay the remaining balance
      : Number(partialAmount);
    
    const totalPaidAmount = previouslyPaid + newPayment;
    const willBeFullyPaid = totalPaidAmount >= Number(payment.amount);
    
    verifyPaymentMutation.mutate({
      paymentId: selectedPayment,
      method: paymentMethod,
      paidAmount: totalPaidAmount,
      isFullPayment: willBeFullyPaid
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

  // Helper function to calculate remaining balance
  const getRemainingBalance = (payment: any) => {
    const totalAmount = Number(payment.amount);
    const paidAmount = Number(payment.paid_amount || 0);
    return totalAmount - paidAmount;
  };

  // Calculate metrics
  const totalRevenue = payments.reduce((sum, p) => {
    // Use paid_amount if available, otherwise use amount for completed payments
    const paidAmount = p.paid_amount ? Number(p.paid_amount) : (p.status === "completed" ? Number(p.amount) : 0);
    return sum + paidAmount;
  }, 0);
  
  const pendingAmount = payments
    .filter(p => p.status === "pending" || p.status === "failed")
    .reduce((sum, p) => sum + getRemainingBalance(p), 0);
  
  const paidCount = payments.filter(p => p.status === "completed").length;
  
  // Count unique students with payments (ensures each payment belongs to unique individual)
  const uniqueStudentsWithPayments = new Set(
    payments.filter(p => p.student_id).map(p => p.student_id)
  ).size;

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
      revenue: monthPayments.reduce((sum, p) => {
        const paidAmount = p.paid_amount ? Number(p.paid_amount) : Number(p.amount);
        return sum + paidAmount;
      }, 0),
      expenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    };
  });

  // Payment method breakdown
  const paymentMethodData: Record<string, number> = {};
  payments.filter(p => p.status === 'completed' && p.description).forEach(p => {
    const paidAmount = p.paid_amount ? Number(p.paid_amount) : Number(p.amount);
    paymentMethodData[p.description] = (paymentMethodData[p.description] || 0) + paidAmount;
  });
  const methodChartData = Object.entries(paymentMethodData).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Extract unique values for filters
  const uniquePackageTypes = Array.from(new Set(payments.map(p => p.package_type).filter(Boolean)));
  const uniquePaymentMethods = Array.from(new Set(payments.filter(p => p.status === 'completed' && p.description).map(p => p.description).filter(Boolean)));

  // Apply all filters
  const filteredPayments = payments.filter(payment => {
    // Search filter
    const matchesSearch = !searchQuery || payment.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) || payment.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    // Date range filter (due_date)
    const matchesDateRange = (!dateRangeFilter.from || payment.due_date && new Date(payment.due_date) >= dateRangeFilter.from) && (!dateRangeFilter.to || payment.due_date && new Date(payment.due_date) <= dateRangeFilter.to);

    // Amount range filter
    const amount = Number(payment.amount);
    const matchesAmountRange = (!amountRangeFilter.min || amount >= Number(amountRangeFilter.min)) && (!amountRangeFilter.max || amount <= Number(amountRangeFilter.max));

    // Package type filter
    const matchesPackageType = packageTypeFilter === 'all' || payment.package_type === packageTypeFilter;

    // Payment method filter
    const matchesPaymentMethod = paymentMethodFilter === 'all' || payment.description === paymentMethodFilter;
    return matchesSearch && matchesStatus && matchesDateRange && matchesAmountRange && matchesPackageType && matchesPaymentMethod;
  });

  // Count active filters
  const activeFilterCount = [statusFilter !== 'all', packageTypeFilter !== 'all', paymentMethodFilter !== 'all', dateRangeFilter.from !== undefined, dateRangeFilter.to !== undefined, amountRangeFilter.min !== '', amountRangeFilter.max !== ''].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setPackageTypeFilter('all');
    setPaymentMethodFilter('all');
    setDateRangeFilter({
      from: undefined,
      to: undefined
    });
    setAmountRangeFilter({
      min: '',
      max: ''
    });
  };
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
                <div className="w-full">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Payments Received</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-green-600">{paidCount}</h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    From {uniqueStudentsWithPayments} unique student{uniqueStudentsWithPayments !== 1 ? 's' : ''}
                  </p>
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

              <div className="space-y-2">
                <Label htmlFor="payment-type">Payment Type</Label>
                <Select value={paymentType} onValueChange={(value: "full" | "part") => {
                  setPaymentType(value);
                  if (value === "full") setPartialAmount("");
                }}>
                  <SelectTrigger id="payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Payment</SelectItem>
                    <SelectItem value="part">Part Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentType === "part" && (
                <div className="space-y-2">
                  <Label htmlFor="partial-amount">Amount Paid (GH₵)</Label>
                  <Input
                    id="partial-amount"
                    type="number"
                    placeholder="Enter amount paid"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {selectedPayment && (() => {
                    const payment = payments.find(p => p.id === selectedPayment);
                    if (payment) {
                      const totalAmount = Number(payment.amount);
                      const previouslyPaid = Number(payment.paid_amount || 0);
                      const remainingBalance = totalAmount - previouslyPaid;
                      return (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Total amount: GH₵{totalAmount.toFixed(2)}
                          </p>
                          {previouslyPaid > 0 && (
                            <p className="text-sm text-green-600">
                              Previously paid: GH₵{previouslyPaid.toFixed(2)}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-orange-600">
                            Remaining balance: GH₵{remainingBalance.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

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

        {/* Delete Payment Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment? This action cannot be undone.
                {paymentToDelete && (() => {
                  const payment = payments.find(p => p.id === paymentToDelete);
                  return payment ? (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold text-foreground">
                        Student: {payment.students?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Amount: GH₵{payment.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {payment.status}
                      </p>
                    </div>
                  ) : null;
                })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeletePayment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Search and Filter Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search payments by student, invoice ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground">
                        {activeFilterCount}
                      </Badge>}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>
            
            {/* Filter Panel */}
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleContent className="space-y-4 pt-4 border-t animate-accordion-down">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Package Type Filter */}
                  <div className="space-y-2">
                    <Label>Package Type</Label>
                    <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All packages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Packages</SelectItem>
                        {uniquePackageTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method Filter */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        {uniquePaymentMethods.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range - From */}
                  <div className="space-y-2">
                    <Label>Due Date From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRangeFilter.from && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRangeFilter.from ? format(dateRangeFilter.from, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateRangeFilter.from} onSelect={date => setDateRangeFilter(prev => ({
                        ...prev,
                        from: date
                      }))} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date Range - To */}
                  <div className="space-y-2">
                    <Label>Due Date To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRangeFilter.to && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRangeFilter.to ? format(dateRangeFilter.to, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateRangeFilter.to} onSelect={date => setDateRangeFilter(prev => ({
                        ...prev,
                        to: date
                      }))} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Amount Range - Min */}
                  <div className="space-y-2">
                    <Label>Min Amount (GH₵)</Label>
                    <Input type="number" placeholder="0" value={amountRangeFilter.min} onChange={e => setAmountRangeFilter(prev => ({
                    ...prev,
                    min: e.target.value
                  }))} />
                  </div>

                  {/* Amount Range - Max */}
                  <div className="space-y-2">
                    <Label>Max Amount (GH₵)</Label>
                    <Input type="number" placeholder="10000" value={amountRangeFilter.max} onChange={e => setAmountRangeFilter(prev => ({
                    ...prev,
                    max: e.target.value
                  }))} />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'} found
                  </p>
                  {activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? <div className="text-center py-8 text-muted-foreground max-h-[200px]">
                No payments yet. Generate monthly payments to get started.
              </div> : filteredPayments.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  No payments match your filters. Try adjusting your search criteria.
                </div> : <div className="space-y-3 max-h-[1000px] overflow-y-auto">
                {filteredPayments.map((payment, index) => <Card key={payment.id} className="border-2 animate-scale-in" style={{
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
                              {payment.package_type}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <p className="font-medium">Invoice ID</p>
                                <p>{payment.id.slice(0, 8)}</p>
                              </div>
                              <div>
                                <p className="font-medium">Period</p>
                                <p>{payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "-"}</p>
                              </div>
                              <div>
                                <p className="font-medium">Due Date</p>
                                <p>{payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "-"}</p>
                              </div>
                              <div>
                                <p className="font-medium">Student ID</p>
                                <p className="truncate">{payment.student_id?.slice(0, 8) || "-"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right md:ml-4">
                            <p className="text-xl md:text-2xl font-bold text-foreground">GH₵ {payment.amount}</p>
                            {payment.paid_amount && Number(payment.paid_amount) > 0 && Number(payment.paid_amount) < Number(payment.amount) && (
                              <div className="mt-1 space-y-1">
                                <p className="text-sm text-green-600">
                                  Paid: GH₵{Number(payment.paid_amount).toFixed(2)}
                                </p>
                                <p className="text-sm text-orange-600 font-semibold">
                                  Remaining: GH₵{getRemainingBalance(payment).toFixed(2)}
                                </p>
                              </div>
                            )}
                            {payment.discount_amount > 0 && <p className="text-xs text-orange-600">Discount: GH₵{payment.discount_amount}</p>}
                            <div className="flex flex-col gap-2 mt-2">
                              {(payment.status === "pending" || payment.status === "failed") && <>
                                  {payment.status === "pending" && <Button size="sm" onClick={() => openVerifyDialog(payment.id)}>
                                      <CreditCard className="h-4 w-4 mr-1" />
                                      Verify Payment
                                    </Button>}
                                  <Button size="sm" variant="outline" onClick={() => sendSingleReminderMutation.mutate(payment.id)} disabled={sendSingleReminderMutation.isPending}>
                                    <Send className="h-4 w-4 mr-1" />
                                    Send Reminder
                                  </Button>
                                </>}
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => openDeleteDialog(payment.id)}
                                disabled={deletePaymentMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
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