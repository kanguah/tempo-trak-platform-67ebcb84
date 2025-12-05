import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GeneratePayrollDialog } from "@/components/payroll/GeneratePayrollDialog";
import { EditPayrollDialog } from "@/components/payroll/EditPayrollDialog";
import { PayrollStatusBadge } from "@/components/payroll/PayrollStatusBadge";
import { Edit, Check, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { stat } from "fs";

export default function Payroll() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateType, setGenerateType] = useState<'tutor' | 'staff'>('tutor');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [editType, setEditType] = useState<'tutor' | 'staff'>('tutor');

  // Generate month options (last 12 months + current)
  const monthOptions = Array.from({ length: 13 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return format(date, 'yyyy-MM');
  });

  // Fetch tutor payroll
  const { data: tutorPayroll = [], isLoading: tutorLoading } = useQuery({
    queryKey: ['payroll', 'tutor', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_payroll')
        .select(`
          *,
          tutors (name, email)
        `)
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  // Fetch staff payroll
  const { data: staffPayroll = [], isLoading: staffLoading } = useQuery({
    queryKey: ['payroll', 'staff', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_payroll')
        .select(`
          *,
          staff (name, email, position)
        `)
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
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
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to add expense");
      },
    });
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, type }: { id: string; status: string; type: 'tutor' | 'staff' }) => {
      const table = type === 'tutor' ? 'tutor_payroll' : 'staff_payroll';
      const updateData: any = { status };
      
      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      if(status==='paid'){
      addExpenseMutation.mutate({
          category: "Tutor Salaries",
          amount: type==='tutor' ? tutorPayroll.find((rec: any) => rec.id === id)?.total_amount : staffPayroll.find((rec: any) => rec.id === id)?.total_amount,
          description: `Salary Payment for ${type==='tutor' ? tutorPayroll.find((rec: any) => rec.id === id)?.tutors?.name : staffPayroll.find((rec: any) => rec.id === id)?.staff?.name} for 
          ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          expense_date: new Date().toISOString().split('T')[0],
          payment_method: "Cash",
          status: "paid",
        });
      }
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    }
  });

  if (adminLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Manage monthly payroll for tutors and staff</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month}>
                {format(new Date(month), 'MMMM yyyy')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="tutors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tutors">Tutor Payroll</TabsTrigger>
          <TabsTrigger value="staff">Staff Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="tutors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tutor Payroll - {format(new Date(selectedMonth), 'MMMM yyyy')}</CardTitle>
              <Button 
                onClick={() => {
                  setGenerateType('tutor');
                  setGenerateDialogOpen(true);
                }}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Generate Payroll
              </Button>
            </CardHeader>
            <CardContent>
              {tutorLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : tutorPayroll.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payroll records for this month. Generate payroll to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tutor Name</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Lessons</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Bonuses</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tutorPayroll.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.tutors?.name}</TableCell>
                        <TableCell>GHS {record.base_salary}</TableCell>
                        <TableCell>{record.lessons_taught}</TableCell>
                        <TableCell>{record.active_students}</TableCell>
                        <TableCell>GHS {(record.lesson_bonus || 0) + (record.student_bonus || 0)}</TableCell>
                        <TableCell>GHS {record.deductions || 0}</TableCell>
                        <TableCell className="font-bold">GHS {record.total_amount}</TableCell>
                        <TableCell>
                          <PayrollStatusBadge status={record.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditRecord(record);
                                setEditType('tutor');
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {record.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus.mutate({ id: record.id, status: 'approved', type: 'tutor' })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {record.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => updateStatus.mutate({ id: record.id, status: 'paid', type: 'tutor' })}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Staff Payroll - {format(new Date(selectedMonth), 'MMMM yyyy')}</CardTitle>
              <Button 
                onClick={() => {
                  setGenerateType('staff');
                  setGenerateDialogOpen(true);
                }}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Generate Payroll
              </Button>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : staffPayroll.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payroll records for this month. Generate payroll to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Bonuses</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffPayroll.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.staff?.name}</TableCell>
                        <TableCell>{record.staff?.position}</TableCell>
                        <TableCell>GHS {record.base_salary}</TableCell>
                        <TableCell>GHS {record.bonuses || 0}</TableCell>
                        <TableCell>GHS {record.deductions || 0}</TableCell>
                        <TableCell className="font-bold">GHS {record.total_amount}</TableCell>
                        <TableCell>
                          <PayrollStatusBadge status={record.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditRecord(record);
                                setEditType('staff');
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {record.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus.mutate({ id: record.id, status: 'approved', type: 'staff' })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {record.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => updateStatus.mutate({ id: record.id, status: 'paid', type: 'staff' })}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <GeneratePayrollDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        month={selectedMonth}
        type={generateType}
      />

      <EditPayrollDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        record={editRecord}
        type={editType}
      />
    </div>
  );
}
