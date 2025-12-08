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
    <div className="container mx-auto p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Payroll Management</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Manage monthly payroll for tutors and staff</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-48 text-xs md:text-sm">
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

      <Tabs defaultValue="tutors" className="space-y-3 md:space-y-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="tutors" className="text-xs md:text-sm">Tutor Payroll</TabsTrigger>
          <TabsTrigger value="staff" className="text-xs md:text-sm">Staff Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="tutors" className="space-y-3 md:space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 lg:p-6">
              <CardTitle className="text-sm md:text-base lg:text-lg">Tutor Payroll - {format(new Date(selectedMonth), 'MMMM yyyy')}</CardTitle>
              <Button 
                onClick={() => {
                  setGenerateType('tutor');
                  setGenerateDialogOpen(true);
                }}
                className="text-xs md:text-sm w-full sm:w-auto"
              >
                Generate
              </Button>
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6">
              {tutorLoading ? (
                <div className="text-center py-6 md:py-8 text-xs md:text-sm">Loading...</div>
              ) : tutorPayroll.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-xs md:text-sm text-muted-foreground">
                  No payroll records for this month. Generate payroll to get started.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
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
                  </div>

                  {/* Mobile/Tablet Cards */}
                  <div className="lg:hidden space-y-3">
                    {tutorPayroll.map((record: any) => (
                      <Card key={record.id} className="border-2">
                        <CardContent className="p-3">
                          <div className="flex flex-col gap-2">
                            {/* Row 1: Name + Status */}
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-bold text-sm md:text-base truncate flex-1">{record.tutors?.name}</h3>
                              <PayrollStatusBadge status={record.status} />
                            </div>

                            {/* Row 2: Details Grid */}
                            <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-md text-xs">
                              <div>
                                <p className="text-muted-foreground">Base Salary</p>
                                <p className="font-medium">GHS {record.base_salary}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Lessons</p>
                                <p className="font-medium">{record.lessons_taught}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Students</p>
                                <p className="font-medium">{record.active_students}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Bonuses</p>
                                <p className="font-medium">GHS {(record.lesson_bonus || 0) + (record.student_bonus || 0)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Deductions</p>
                                <p className="font-medium">GHS {record.deductions || 0}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-bold text-sm">GHS {record.total_amount}</p>
                              </div>
                            </div>

                            {/* Row 3: Actions */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditRecord(record);
                                  setEditType('tutor');
                                  setEditDialogOpen(true);
                                }}
                                className="flex-1 text-xs h-8"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              {record.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus.mutate({ id: record.id, status: 'approved', type: 'tutor' })}
                                  className="flex-1 text-xs h-8"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {record.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateStatus.mutate({ id: record.id, status: 'paid', type: 'tutor' })}
                                  className="flex-1 text-xs h-8"
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-3 md:space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 lg:p-6">
              <CardTitle className="text-sm md:text-base lg:text-lg">Staff Payroll - {format(new Date(selectedMonth), 'MMMM yyyy')}</CardTitle>
              <Button 
                onClick={() => {
                  setGenerateType('staff');
                  setGenerateDialogOpen(true);
                }}
                className="w-full sm:w-auto text-xs md:text-sm"
              >
                Generate
              </Button>
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6">
              {staffLoading ? (
                <div className="text-center py-6 md:py-8 text-xs md:text-sm">Loading...</div>
              ) : staffPayroll.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-xs md:text-sm text-muted-foreground">
                  No payroll records for this month. Generate payroll to get started.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
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
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {staffPayroll.map((record: any) => (
                      <Card key={record.id} className="border-2">
                        <CardContent className="p-3">
                          <div className="space-y-3">
                            {/* Row 1: Name, Position & Status */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">{record.staff?.name}</h3>
                                <p className="text-xs text-muted-foreground">{record.staff?.position}</p>
                              </div>
                              <PayrollStatusBadge status={record.status} />
                            </div>

                            {/* Row 2: Details Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-muted/30 p-2 rounded-md">
                                <div className="text-xs text-muted-foreground">Base Salary</div>
                                <div className="text-xs font-medium">GHS {record.base_salary}</div>
                              </div>
                              <div className="bg-muted/30 p-2 rounded-md">
                                <div className="text-xs text-muted-foreground">Bonuses</div>
                                <div className="text-xs font-medium">GHS {record.bonuses || 0}</div>
                              </div>
                              <div className="bg-muted/30 p-2 rounded-md">
                                <div className="text-xs text-muted-foreground">Deductions</div>
                                <div className="text-xs font-medium">GHS {record.deductions || 0}</div>
                              </div>
                              <div className="bg-muted/30 p-2 rounded-md">
                                <div className="text-xs text-muted-foreground">Total</div>
                                <div className="text-xs font-bold">GHS {record.total_amount}</div>
                              </div>
                            </div>

                            {/* Row 3: Actions */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditRecord(record);
                                  setEditType('staff');
                                  setEditDialogOpen(true);
                                }}
                                className="flex-1 text-xs h-8"
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              {record.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus.mutate({ id: record.id, status: 'approved', type: 'staff' })}
                                  className="flex-1 text-xs h-8"
                                >
                                  <Check className="mr-1 h-3 w-3" />
                                  Approve
                                </Button>
                              )}
                              {record.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateStatus.mutate({ id: record.id, status: 'paid', type: 'staff' })}
                                  className="flex-1 text-xs h-8"
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
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
