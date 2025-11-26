import { useState } from "react";
import { Plus, DollarSign, TrendingDown, Clock, CheckCircle } from "lucide-react";
import DataImport from "@/components/DataImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["hsl(240 70% 55%)", "hsl(270 60% 60%)", "hsl(45 90% 60%)", "hsl(200 70% 55%)", "hsl(320 65% 60%)", "hsl(160 60% 50%)"];

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
  "MTN Mobile Money",
  "Vodafone Cash",
  "AirtelTigo Money",
];

export default function Expenses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: "",
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: "",
    status: "paid",
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
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
                <Button className="gradient-primary text-primary-foreground shadow-primary">
                  <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
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
                  <h3 className="text-lg md:text-2xl font-bold text-foreground truncate">
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
            <CardHeader>
              <CardTitle>Expense Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
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
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No expenses recorded yet</div>
            ) : (
              <div className="space-y-3 max-h-[1000px] overflow-y-auto">
                {expenses.map((expense, index) => (
                  <Card
                    key={expense.id}
                    className="border-2 animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-bold text-foreground">{expense.category}</h3>
                            <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'}>
                              {expense.status === 'paid' ? 'Paid' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p className="font-medium">Date</p>
                              <p>{new Date(expense.expense_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="font-medium">Payment Method</p>
                              <p>{expense.payment_method || "-"}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-medium">Description</p>
                              <p className="truncate">{expense.description || "-"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-red-600">GH₵ {expense.amount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}