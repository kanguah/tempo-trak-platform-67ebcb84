import { useState, useEffect } from "react";
import { Plus, DollarSign, TrendingDown, Clock, CheckCircle, Trash2 } from "lucide-react";
import DataImport from "@/components/DataImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { createNotification } from "@/hooks/useNotifications";

const COLORS = ["hsl(170 65% 60%)", "hsl(15 95% 68%)", "hsl(265 65% 65%)", "hsl(340 75% 65%)", "hsl(200 70% 60%)", "hsl(45 90% 62%)"];

const EXPENSE_CATEGORIES = [
  "Tutor Salaries",
  "Facility Rent",
  "Marketing",
  "Equipment",
  "Utilities",
  "Other",
];

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Mobile Money",
];

export default function Expenses() {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: "",
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: "",
    status: "paid",
  });
  
  // Selection and bulk states
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (newExpense: any) => {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          ...newExpense,
          user_id: user?.id,
          approved_by: user?.id,
          paid_by: newExpense.status === 'paid' ? user?.id : null,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setDialogOpen(false);
      const expenseAmount = parseFloat(formData.amount);
      if (user?.id) {
        createNotification(user.id, "expense_update", "Expense Added", `New ${formData.category} expense of GH₵${expenseAmount.toFixed(2)} has been recorded.`);
      }
      setFormData({
        category: "",
        amount: "",
        description: "",
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: "",
        status: "paid",
      });
      toast.success("Expense added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add expense");
    },
  });

  const bulkStatusChangeMutation = useMutation({
    mutationFn: async ({ expenseIds, status }: { expenseIds: string[]; status: string }) => {
      const updateData: any = { status };
      if (status === 'paid') {
        updateData.paid_by = user?.id;
      }

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .in('id', expenseIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setSelectedExpenses(new Set());
      setBulkStatusDialogOpen(false);
      setBulkStatusValue("");
      toast.success("Expenses updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update expenses");
    },
  });

  const bulkDeleteExpensesMutation = useMutation({
    mutationFn: async (expenseIds: string[]) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .in('id', expenseIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setSelectedExpenses(new Set());
      setBulkDeleteDialogOpen(false);
      toast.success("Expenses deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete expenses");
    },
  });

  const handleAddExpense = () => {
    if (!formData.category || !formData.amount || !formData.payment_method) {
      toast.error("Please fill in all required fields");
      return;
    }

    addExpenseMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  const handleSelectAll = (checked: boolean, visibleExpenses: any[]) => {
    if (checked) {
      setSelectedExpenses(new Set(visibleExpenses.map(e => e.id)));
    } else {
      setSelectedExpenses(new Set());
    }
  };

  const handleSelectExpense = (expenseId: string, checked: boolean) => {
    const newSelected = new Set(selectedExpenses);
    if (checked) {
      newSelected.add(expenseId);
    } else {
      newSelected.delete(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const handleBulkStatusChange = () => {
    if (selectedExpenses.size === 0) return;
    setBulkStatusDialogOpen(true);
  };

  const confirmBulkStatusChange = () => {
    if (!bulkStatusValue) {
      toast.error("Please select a status");
      return;
    }
    bulkStatusChangeMutation.mutate({
      expenseIds: Array.from(selectedExpenses),
      status: bulkStatusValue,
    });
  };

  const handleBulkDelete = () => {
    if (selectedExpenses.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteExpensesMutation.mutate(Array.from(selectedExpenses));
  };

  // Calculate totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.expense_date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const yearlyExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.expense_date);
    return expenseDate.getFullYear() === currentYear;
  });

  const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalYearly = yearlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const totalPending = pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category breakdown
  const categoryData: Record<string, number> = {};
  expenses.forEach(expense => {
    categoryData[expense.category] = (categoryData[expense.category] || 0) + Number(expense.amount);
  });

  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Find largest category
  const largestCategory = chartData.length > 0 ? chartData[0].name : "None";

  // Filter expenses for display
  const filteredExpenses = expenses.filter(expense => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.payment_method?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = filterCategory === "all" || expense.category === filterCategory;
    
    // Status filter
    const matchesStatus = filterStatus === "all" || expense.status === filterStatus;
    
    // Payment method filter
    const matchesPaymentMethod = filterPaymentMethod === "all" || expense.payment_method === filterPaymentMethod;
    
    // Date range filter
    const expenseDate = new Date(expense.expense_date);
    const matchesDateFrom = !filterDateFrom || expenseDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || expenseDate <= new Date(filterDateTo);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPaymentMethod && matchesDateFrom && matchesDateTo;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterPaymentMethod("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters = searchQuery || filterCategory !== "all" || filterStatus !== "all" || 
    filterPaymentMethod !== "all" || filterDateFrom || filterDateTo;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Expense Tracking</h1>
            <p className="text-muted-foreground">Monitor and manage all academy expenses</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DataImport type="expenses" onSuccess={() => queryClient.invalidateQueries({ queryKey: ['expenses'] })} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground shadow-primary w-full">
                  <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5 hidden sm:inline" />
                  Add Expense
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (GH₵) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter expense details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense_date">Expense Date *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger id="payment_method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full gradient-primary text-primary-foreground"
                  onClick={handleAddExpense}
                  disabled={addExpenseMutation.isPending}
                >
                  {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">This Month</p>
                  <h3 className="text-xl md:text-3xl font-bold text-foreground">
                    GH₵ {totalMonthly.toLocaleString()}
                  </h3>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Year to Date</p>
                  <h3 className="text-xl md:text-3xl font-bold text-foreground">
                    GH₵ {totalYearly.toLocaleString()}
                  </h3>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Pending Payments</p>
                  <h3 className="text-xl md:text-3xl font-bold text-orange-600">
                    GH₵ {totalPending.toLocaleString()}
                  </h3>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Largest Category</p>
                  <h3 className="text-lg md:text-2xl font-bold text-foreground">
                    {largestCategory}
                  </h3>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Chart */}
        {chartData.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="p-3 md:p-4 lg:p-6">
              <CardTitle className="text-md text-center md:text-base lg:text-lg">Expense Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
                <PieChart margin={{ top: 30, right: 5, bottom: 5, left: 5 }}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy={isMobile ? "38%" : "42%"}
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    innerRadius={55}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `GH₵${Number(value).toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: isMobile ? "11px" : "13px",
                      padding: isMobile ? "6px 8px" : "8px 12px"
                    }}
                    labelStyle={{
                      fontSize: isMobile ? "11px" : "13px",
                      fontWeight: 600
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={isMobile ? 80 : 70}
                    wrapperStyle={{ 
                      fontSize: "12px",
                      paddingTop: isMobile ? "12px" : "18px",
                      lineHeight: isMobile ? "1.5" : "1.7"
                    }}
                    iconSize={isMobile ? 8 : 10}
                    iconType="circle"
                    formatter={(value: string, entry: any) => {
                      const total = chartData.reduce((sum, item) => sum + item.value, 0);
                      const percentage = ((entry.payload.value / total) * 100).toFixed(1);
                      const amount = `GH₵${Number(entry.payload.value).toLocaleString()}`;
                      return isMobile ? `${value} (${percentage}%)` : `${value}: ${amount} (${percentage}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Expenses List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="space-y-3 md:space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-2 flex-wrap">
                  {selectedExpenses.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleBulkStatusChange} className="flex-1 sm:flex-none">
                        Change Status ({selectedExpenses.size})
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="flex-1 sm:flex-none">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete ({selectedExpenses.size})
                      </Button>
                    </>
                  )}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full sm:w-auto"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="filterDateFrom" className="text-xs text-muted-foreground">From Date</Label>
                  <Input
                    id="filterDateFrom"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filterDateTo" className="text-xs text-muted-foreground">To Date</Label>
                  <Input
                    id="filterDateTo"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No expenses recorded yet</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses match your filters
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredExpenses.map((expense, index) => (
                  <Card
                    key={expense.id}
                    className="border-2 animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-bold text-foreground text-sm md:text-base">{expense.category}</h3>
                            <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                              {expense.status === 'paid' ? 'Paid' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-sm text-muted-foreground">
                            <div>
                              <p className="font-medium">Date</p>
                              <p className="truncate">{new Date(expense.expense_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="font-medium">Payment Method</p>
                              <p className="truncate">{expense.payment_method || "-"}</p>
                            </div>
                            <div className="col-span-2 md:col-span-2">
                              <p className="font-medium">Description</p>
                              <p className="truncate">{expense.description || "-"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right md:ml-4 flex-shrink-0">
                          <p className="text-xl md:text-2xl font-bold text-red-600">GH₵ {Number(expense.amount).toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Status Change Dialog */}
        <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Status for {selectedExpenses.size} Expense(s)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setBulkStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={confirmBulkStatusChange} disabled={!bulkStatusValue}>
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedExpenses.size} Expense(s)</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete these expenses? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Expenses
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}