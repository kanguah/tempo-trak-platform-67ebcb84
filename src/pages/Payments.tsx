import { useState } from "react";
import { Search, Filter, Download, CheckCircle, Clock, XCircle, CreditCard, Send, RefreshCw, X, Calendar as CalendarIcon, Trash2, Edit, FileText } from "lucide-react";
import DataImport from "@/components/DataImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { format, set } from "date-fns";
import { cn } from "@/lib/utils";
//const COLORS = ["hsl(240 70% 55%)", "hsl(270 60% 60%)", "hsl(45 90% 60%)", "hsl(200 70% 55%)"];

const COLORS = ["hsl(170 65% 60%)", "hsl(15 95% 68%)", "hsl(265 65% 65%)", "hsl(340 75% 65%)", "hsl(200 70% 60%)"];
export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "part">("full");
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [bulkMarkPaidDialogOpen, setBulkMarkPaidDialogOpen] = useState(false);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState("");
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  // Individual edit states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined);
  const [editPackageType, setEditPackageType] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // Bulk edit states
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState("");
  const [bulkEditValue, setBulkEditValue] = useState("");
  const [bulkEditAmount, setBulkEditAmount] = useState("");
  const [bulkEditDueDate, setBulkEditDueDate] = useState<Date | undefined>(undefined);
  
  // Bulk invoice states
  const [bulkInvoiceDialogOpen, setBulkInvoiceDialogOpen] = useState(false);
  const [invoiceChannel, setInvoiceChannel] = useState<"email" | "sms" | "both">("email");
  
  // Receipt download state
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);
  
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
      const message = variables.isFullPayment ? "Payment verified successfully!" : "Partial payment recorded successfully!";
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
      const { error } = await supabase.from('payments').delete().eq('id', paymentId);
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

  const bulkMarkPaidMutation = useMutation({
    mutationFn: async ({ paymentIds, method }: { paymentIds: string[]; method: string }) => {
      const updates = paymentIds.map(id => {
        const payment = payments.find(p => p.id === id);
        return {
          id,
          status: 'completed' as const,
          payment_date: new Date().toISOString(),
          description: method,
          paid_amount: payment?.amount || 0,
        };
      });

      for (const update of updates) {
        const { error } = await supabase
          .from('payments')
          .update({
            status: update.status,
            payment_date: update.payment_date,
            description: update.description,
            paid_amount: update.paid_amount,
          })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedPayments(new Set());
      setBulkMarkPaidDialogOpen(false);
      setBulkPaymentMethod("");
      toast.success("Payments marked as paid!");
    },
    onError: () => {
      toast.error("Failed to mark payments as paid");
    },
  });

  const bulkDeletePaymentsMutation = useMutation({
    mutationFn: async (paymentIds: string[]) => {
      const { error } = await supabase.from('payments').delete().in('id', paymentIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedPayments(new Set());
      setBulkDeleteDialogOpen(false);
      toast.success("Payments deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete payments");
    },
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

  const handleSelectAll = (checked: boolean, visiblePayments: any[]) => {
    if (checked) {
      setSelectedPayments(new Set(visiblePayments.map(p => p.id)));
    } else {
      setSelectedPayments(new Set());
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    const newSelected = new Set(selectedPayments);
    if (checked) {
      newSelected.add(paymentId);
    } else {
      newSelected.delete(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const handleBulkMarkPaid = () => {
    if (selectedPayments.size === 0) return;
    setBulkMarkPaidDialogOpen(true);
  };

  const confirmBulkMarkPaid = () => {
    if (!bulkPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    bulkMarkPaidMutation.mutate({
      paymentIds: Array.from(selectedPayments),
      method: bulkPaymentMethod,
    });
  };

  const handleBulkDelete = () => {
    if (selectedPayments.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeletePaymentsMutation.mutate(Array.from(selectedPayments));
  };

  // Individual edit mutation
  const editPaymentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("Payment updated successfully!");
      setEditDialogOpen(false);
      setEditingPayment(null);
    },
    onError: () => {
      toast.error("Failed to update payment");
    },
  });

  // Bulk edit mutation
  const bulkEditPaymentsMutation = useMutation({
    mutationFn: async ({ paymentIds, field, value }: { paymentIds: string[]; field: string; value: any }) => {
      const updates: any = {};
      updates[field] = value;

      for (const id of paymentIds) {
        const { error } = await supabase
          .from('payments')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedPayments(new Set());
      setBulkEditDialogOpen(false);
      setBulkEditField("");
      setBulkEditValue("");
      setBulkEditAmount("");
      setBulkEditDueDate(undefined);
      toast.success("Payments updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update payments");
    },
  });

  // Bulk invoice sending mutation
  const bulkSendInvoiceMutation = useMutation({
    mutationFn: async ({ paymentIds, channel }: { paymentIds: string[]; channel: "email" | "sms" | "both" }) => {
      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: { paymentIds, channel }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSelectedPayments(new Set());
      setBulkInvoiceDialogOpen(false);
      toast.success(data.message || "Invoices sent successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send invoices");
    },
  });

  // Download receipt handler
  const handleDownloadReceipt = async (paymentId: string, studentName: string) => {
    setDownloadingReceipt(paymentId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-receipt', {
        body: { paymentId }
      });

      if (error) throw error;

      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename || `Receipt_${studentName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Receipt downloaded successfully!");
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      toast.error(error.message || "Failed to download receipt");
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const openEditDialog = (payment: any) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount?.toString() || "");
    setEditDueDate(payment.due_date ? new Date(payment.due_date) : undefined);
    setEditPackageType(payment.package_type || "");
    setEditDescription(payment.description || "");
    setEditDialogOpen(true);
  };

  const handleEditPayment = () => {
    if (!editingPayment) return;
    
    if (!editAmount || Number(editAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const updates: any = {
      amount: Number(editAmount),
      package_type: editPackageType,
      description: editDescription,
    };

    if (editDueDate) {
      updates.due_date = editDueDate.toISOString();
    }

    editPaymentMutation.mutate({ id: editingPayment.id, updates });
  };

  const handleBulkEdit = () => {
    if (selectedPayments.size === 0) return;
    setBulkEditDialogOpen(true);
  };

  const confirmBulkEdit = () => {
    if (!bulkEditField) {
      toast.error("Please select a field to update");
      return;
    }

    let value: any;
    
    if (bulkEditField === "amount") {
      if (!bulkEditAmount || Number(bulkEditAmount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      value = Number(bulkEditAmount);
    } else if (bulkEditField === "due_date") {
      if (!bulkEditDueDate) {
        toast.error("Please select a due date");
        return;
      }
      value = bulkEditDueDate.toISOString();
    } else if (bulkEditField === "status") {
      value = bulkEditValue;
    } else if (bulkEditField === "package_type") {
      value = bulkEditValue;
    }

    if (!value) {
      toast.error("Please enter a value");
      return;
    }

    bulkEditPaymentsMutation.mutate({
      paymentIds: Array.from(selectedPayments),
      field: bulkEditField,
      value,
    });
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
    const newPayment = paymentType === "full" ? getRemainingBalance(payment) // Pay the remaining balance
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

  // Calculate metrics
  const totalRevenue = filteredPayments.reduce((sum, p) => {
    // Use paid_amount if available, otherwise use amount for completed payments
    const paidAmount = Number(p.paid_amount);
    return sum + paidAmount;
  }, 0);
  const pendingAmount = filteredPayments.filter(p => p.status === "pending" || p.status === "failed").reduce((sum, p) => sum + getRemainingBalance(p), 0);
  const paidCount = filteredPayments.filter(p => p.paid_amount !== null).length;

  // Generate revenue data (last 6 months)
  /*const last6Months = Array.from({
    length: 6
  }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date;
  });*/
  const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth(); // 0-based (0 = January)

const monthsFromStartOfYear = Array.from(
  { length: currentMonth + 1 }, // +1 to include current month
  (_, i) => new Date(currentYear, i, 1) // first day of each month
);
  const revenueData = monthsFromStartOfYear.map(date => {
    const monthName = date.toLocaleString('default', {
      month: 'short'
    });
    const monthPayments = payments.filter(p => {
      if (!p.due_date) return false;
      const paymentDate = new Date(p.due_date);
      return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear();
    });
    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expense_date);
      return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
    });
    return {
      month: monthName,
      revenue: monthPayments.reduce((sum, p) => {
        const paidAmount = Number(p.paid_amount);
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
            <DataImport type="payments" onSuccess={() => queryClient.invalidateQueries({ queryKey: ['payments'] })} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="gradient-primary text-primary-foreground shadow-primary">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm opacity-90 mb-1">Total Revenue</p>
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
                
                Revenue vs Expenses
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
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="MOBILE MONEY">MTN Mobile Money</SelectItem>
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

              {paymentType === "part" && <div className="space-y-2">
                  <Label htmlFor="partial-amount">Amount Paid (GH₵)</Label>
                  <Input id="partial-amount" type="number" placeholder="Enter amount paid" value={partialAmount} onChange={e => setPartialAmount(e.target.value)} min="0" step="0.01" />
                  {selectedPayment && (() => {
                const payment = payments.find(p => p.id === selectedPayment);
                if (payment) {
                  const totalAmount = Number(payment.amount);
                  const previouslyPaid = Number(payment.paid_amount || 0);
                  const remainingBalance = totalAmount - previouslyPaid;
                  return <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Total amount: GH₵{totalAmount.toFixed(2)}
                          </p>
                          {previouslyPaid > 0 && <p className="text-sm text-green-600">
                              Previously paid: GH₵{previouslyPaid.toFixed(2)}
                            </p>}
                          <p className="text-sm font-semibold text-orange-600">
                            Remaining balance: GH₵{remainingBalance.toFixed(2)}
                          </p>
                        </div>;
                }
                return null;
              })()}
                </div>}

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
                return payment ? <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold text-foreground">
                        Student: {payment.students?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Amount: GH₵{payment.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {payment.status}
                      </p>
                    </div> : null;
              })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            {selectedPayments.size > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkEdit}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit ({selectedPayments.size})
                </Button>
                <Button
                  onClick={() => setBulkInvoiceDialogOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice ({selectedPayments.size})
                </Button>
                <Button
                  onClick={handleBulkMarkPaid}
                  variant="outline"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Paid ({selectedPayments.size})
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedPayments.size})
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? <div className="text-center py-8 text-muted-foreground max-h-[200px]">
                No payments yet. Generate monthly payments to get started.
              </div> : filteredPayments.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  No payments match your filters. Try adjusting your search criteria.
                </div> : <>
                <div className="flex items-center gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                  <Checkbox
                    checked={selectedPayments.size === filteredPayments.length && filteredPayments.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked, filteredPayments)}
                  />
                  <span className="text-sm font-medium">
                    {selectedPayments.size > 0 
                      ? `${selectedPayments.size} of ${filteredPayments.length} selected`
                      : "Select all"}
                  </span>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredPayments.map((payment, index) => <Card key={payment.id} className="border-2 animate-scale-in" style={{
              animationDelay: `${index * 0.05}s`
            }}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={selectedPayments.has(payment.id)}
                              onCheckedChange={(checked) => handleSelectPayment(payment.id, !!checked)}
                            />
                            <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-bold text-foreground">
                                {payment.students?.name || "Unknown Student"}
                              </h3>
                              {getStatusBadge(payment.status)}
                        
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <p className="font-medium">Invoice ID</p>
                                <p>{payment.id.slice(0, 8)}</p>
                              </div>
                              <div>
                                <p className="font-medium">Period</p>
                                <p>{payment.created_at ? new Date(payment.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          }) : "-"}</p>
                              </div>
                              <div>
                                <p className="font-medium">Student ID</p>
                                <p className="truncate">{payment.student_id?.slice(0, 8) || "-"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right md:ml-4">
                            <p className="text-xl md:text-2xl font-bold text-foreground">GH₵ {payment.amount}</p>
                            {payment.paid_amount && Number(payment.paid_amount) > 0 && Number(payment.paid_amount) < Number(payment.amount) && <div className="mt-1 space-y-1">
                                <p className="text-sm text-green-600">
                                  Paid: GH₵{Number(payment.paid_amount).toFixed(2)}
                                </p>
                                <p className="text-sm text-orange-600 font-semibold">
                                  Remaining: GH₵{getRemainingBalance(payment).toFixed(2)}
                                </p>
                              </div>}
                            {payment.discount_amount > 0 && <p className="text-xs text-orange-600">Discount: GH₵{payment.discount_amount}</p>}
                            <div className="flex justify-end gap-2 mt-2 flex-wrap">
                              <Button size="sm" title="Edit Payment" variant="outline" onClick={() => openEditDialog(payment)}>
                                <Edit className="h-4 w-4 mr-1" />
                              </Button>
                              {payment.status === "completed" && (
                                <Button 
                                  size="sm" 
                                  title="Download Receipt" 
                                  variant="outline"
                                  onClick={() => handleDownloadReceipt(payment.id, payment.students?.name || 'Student')}
                                  disabled={downloadingReceipt === payment.id}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  {downloadingReceipt === payment.id ? "Downloading..." : "Receipt"}
                                </Button>
                              )}
                              {(payment.status === "pending" || payment.status === "failed") && <>
                                  {payment.status === "pending" && <Button title="Verify Payment" size="sm" onClick={() => openVerifyDialog(payment.id)}>
                                      <CreditCard className="h-4 w-4 mr-1" />
                                    </Button>}
                                  <Button size="sm" title="Send Reminder" variant="outline" onClick={() => sendSingleReminderMutation.mutate(payment.id)} disabled={sendSingleReminderMutation.isPending}>
                                    <Send className="h-4 w-4 mr-1" />
                                  </Button>
                                
                              <Button size="sm" title="Delete Payment" variant="destructive" onClick={() => openDeleteDialog(payment.id)} disabled={deletePaymentMutation.isPending}>
                                <Trash2 className="h-4 w-4 mr-1" />
                              </Button></>}
                            </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
              </div></>}
          </CardContent>
        </Card>

        {/* Bulk Mark Paid Dialog */}
        <Dialog open={bulkMarkPaidDialogOpen} onOpenChange={setBulkMarkPaidDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark {selectedPayments.size} Payments as Paid</DialogTitle>
              <DialogDescription>Select the payment method used</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={bulkPaymentMethod} onValueChange={setBulkPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setBulkMarkPaidDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmBulkMarkPaid}>Mark as Paid</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedPayments.size} Payments?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected payment records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Invoice Dialog */}
        <Dialog open={bulkInvoiceDialogOpen} onOpenChange={setBulkInvoiceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invoices to {selectedPayments.size} Students</DialogTitle>
              <DialogDescription>Select how you want to send the payment invoices</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Delivery Channel</Label>
                <Select value={invoiceChannel} onValueChange={(value: "email" | "sms" | "both") => setInvoiceChannel(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="both">Both Email & SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Invoice will include:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Student name and package details</li>
                  <li>• Amount due and due date</li>
                  <li>• Payment instructions (Bank, Mobile Money, Cash)</li>
                  <li>• Payment status</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setBulkInvoiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => bulkSendInvoiceMutation.mutate({ 
                  paymentIds: Array.from(selectedPayments), 
                  channel: invoiceChannel 
                })}
                disabled={bulkSendInvoiceMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {bulkSendInvoiceMutation.isPending ? "Sending..." : "Send Invoices"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Individual Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
              <DialogDescription>
                Update payment details for {editingPayment?.students?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Amount (GH₵)</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDueDate ? format(editDueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editDueDate}
                      onSelect={setEditDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Package Type</Label>
                <Select value={editPackageType} onValueChange={setEditPackageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x Weekly">1x Weekly</SelectItem>
                    <SelectItem value="2x Weekly">2x Weekly</SelectItem>
                    <SelectItem value="3x Weekly">3x Weekly</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Payment description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPayment}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Dialog */}
        <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit Payments ({selectedPayments.size})</DialogTitle>
              <DialogDescription>
                Update a field for all selected payments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Field to Update</Label>
                <Select value={bulkEditField} onValueChange={setBulkEditField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="package_type">Package Type</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="due_date">Due Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bulkEditField === "status" && (
                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {bulkEditField === "package_type" && (
                <div className="space-y-2">
                  <Label>New Package Type</Label>
                  <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1x Weekly">1x Weekly</SelectItem>
                      <SelectItem value="2x Weekly">2x Weekly</SelectItem>
                      <SelectItem value="3x Weekly">3x Weekly</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {bulkEditField === "amount" && (
                <div className="space-y-2">
                  <Label>New Amount (GH₵)</Label>
                  <Input
                    type="number"
                    value={bulkEditAmount}
                    onChange={(e) => setBulkEditAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              {bulkEditField === "due_date" && (
                <div className="space-y-2">
                  <Label>New Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !bulkEditDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bulkEditDueDate ? format(bulkEditDueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={bulkEditDueDate}
                        onSelect={setBulkEditDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmBulkEdit}>Update Payments</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}