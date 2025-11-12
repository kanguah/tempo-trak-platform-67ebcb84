import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, DollarSign, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";

const positions = [
  "Administrator",
  "Director",
  "Assistant Director",
  "Office Manager",
  "Accountant",
  "Receptionist",
  "Coordinator",
  "Marketing Manager",
  "IT Support",
  "Other"
];

const editStaffSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  position: z.string().trim().min(1, "Position is required"),
  status: z.string().min(1, "Status is required"),
  monthly_salary: z.number().min(0, "Salary must be positive"),
  hire_date: z.string().optional(),
});

export default function StaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect non-admins
  if (!adminLoading && !isAdmin) {
    navigate("/");
    return null;
  }

  // Fetch staff data
  const { data: staffMember, isLoading: staffLoading } = useQuery({
    queryKey: ["staff", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id && isAdmin,
  });

  // Fetch payroll history
  const { data: payroll = [] } = useQuery({
    queryKey: ["staff-payroll", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_payroll")
        .select("*")
        .eq("staff_id", id)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id && isAdmin,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    status: "",
    monthly_salary: 0,
    hire_date: "",
  });

  // Initialize form when staff data loads
  useEffect(() => {
    if (staffMember) {
      setFormData({
        name: staffMember.name || "",
        email: staffMember.email || "",
        phone: staffMember.phone || "",
        position: staffMember.position || "",
        status: staffMember.status || "",
        monthly_salary: staffMember.monthly_salary || 0,
        hire_date: staffMember.hire_date || "",
      });
    }
  }, [staffMember]);

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("staff")
        .update(data)
        .eq("id", id)
        .eq("user_id", user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", id] });
      toast.success("Staff profile updated successfully!");
      setEditDialogOpen(false);
      setErrors({});
    },
    onError: () => {
      toast.error("Failed to update staff profile");
    },
  });

  const handleEditStaff = () => {
    try {
      const validated = editStaffSchema.parse({
        ...formData,
        monthly_salary: Number(formData.monthly_salary),
      });
      updateStaffMutation.mutate(validated as any);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "inactive":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "on leave":
      case "on_leave":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (adminLoading || staffLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Staff member not found</h1>
          <Button onClick={() => navigate("/staff")}>Back to Staff</Button>
        </div>
      </div>
    );
  }

  const avatar = staffMember.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/staff")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-2">Staff Profile</h1>
            <p className="text-muted-foreground">Detailed information and payroll history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button className="gradient-primary text-primary-foreground shadow-primary">
              <Mail className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>

        {/* Edit Staff Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Staff Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter staff member's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="staff@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  placeholder="+233 24 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger id="edit-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-salary">Monthly Salary (GH₵)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthly_salary}
                  onChange={(e) => setFormData({ ...formData, monthly_salary: parseFloat(e.target.value) || 0 })}
                />
                {errors.monthly_salary && <p className="text-sm text-destructive">{errors.monthly_salary}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-hire-date">Hire Date</Label>
                <Input
                  id="edit-hire-date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
                {errors.hire_date && <p className="text-sm text-destructive">{errors.hire_date}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditDialogOpen(false);
                    if (staffMember) {
                      setFormData({
                        name: staffMember.name || "",
                        email: staffMember.email || "",
                        phone: staffMember.phone || "",
                        position: staffMember.position || "",
                        status: staffMember.status || "",
                        monthly_salary: staffMember.monthly_salary || 0,
                        hire_date: staffMember.hire_date || "",
                      });
                    }
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleEditStaff}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Header Card */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl gradient-primary text-white font-bold text-3xl shadow-md">
                {avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">{staffMember.name}</h2>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{staffMember.position}</span>
                      </div>
                      <span>•</span>
                      <span>
                        Joined {staffMember.hire_date ? format(new Date(staffMember.hire_date), "MMMM yyyy") : "Unknown"}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(staffMember.status)} variant="outline">
                    {staffMember.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{staffMember.email}</span>
                  </div>
                  {staffMember.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{staffMember.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      GH₵ {staffMember.monthly_salary || 0}/month
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll History */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Payroll History</CardTitle>
          </CardHeader>
          <CardContent>
            {payroll.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payroll records yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Bonuses</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.month}</TableCell>
                      <TableCell>GH₵ {record.base_salary}</TableCell>
                      <TableCell>GH₵ {record.bonuses || 0}</TableCell>
                      <TableCell>GH₵ {record.deductions || 0}</TableCell>
                      <TableCell className="font-semibold">GH₵ {record.total_amount}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            record.status === "paid"
                              ? "bg-green-500/10 text-green-600"
                              : record.status === "approved"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-orange-500/10 text-orange-600"
                          }
                          variant="outline"
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.payment_date ? format(new Date(record.payment_date), "MMM dd, yyyy") : "Not paid"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
