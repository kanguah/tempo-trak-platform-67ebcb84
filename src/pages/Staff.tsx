import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Mail, Phone, Eye, Trash2, Briefcase } from "lucide-react";
import DataImport from "@/components/DataImport";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdmin } from "@/hooks/useAdmin";

const addStaffSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  position: z.string().trim().min(1, "Position is required").max(100, "Position must be less than 100 characters"),
  status: z.string().min(1, "Status is required"),
  monthly_salary: z.number().min(0, "Salary must be positive"),
  hire_date: z.string().optional(),
});

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

type SortField = "name" | "status" | "position" | "created_at";
type SortDirection = "asc" | "desc";

export default function Staff() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    status: "active",
    monthly_salary: 0,
    hire_date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const itemsPerPage = 20;
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Redirect non-admins
  if (!adminLoading && !isAdmin) {
    navigate("/");
    return null;
  }

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  const addStaffMutation = useMutation({
    mutationFn: async (newStaff: any) => {
      const { data, error } = await supabase
        .from("staff")
        .insert([{
          ...newStaff,
          user_id: user?.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        status: "active",
        monthly_salary: 0,
        hire_date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
      toast.success("Staff member added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add staff member");
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (staffIds: string[]) => {
      const { error } = await supabase
        .from("staff")
        .delete()
        .in("id", staffIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setSelectedStaff(new Set());
      setDeleteDialogOpen(false);
      toast.success("Staff member(s) deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete staff member(s)");
    },
  });

  const bulkStatusChangeMutation = useMutation({
    mutationFn: async ({ staffIds, status }: { staffIds: string[]; status: string }) => {
      const { error } = await supabase
        .from("staff")
        .update({ status })
        .in("id", staffIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setSelectedStaff(new Set());
      setBulkStatusDialogOpen(false);
      setBulkStatusValue("");
      toast.success("Staff members updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update staff members");
    },
  });

  const handleAddStaff = () => {
    try {
      const validated = addStaffSchema.parse({
        ...formData,
        monthly_salary: Number(formData.monthly_salary),
      });
      addStaffMutation.mutate(validated);
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
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStaff(new Set(paginatedStaff.map((s) => s.id)));
    } else {
      setSelectedStaff(new Set());
    }
  };

  const handleSelectStaff = (staffId: string, checked: boolean) => {
    const newSelected = new Set(selectedStaff);
    if (checked) {
      newSelected.add(staffId);
    } else {
      newSelected.delete(staffId);
    }
    setSelectedStaff(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedStaff.size === 0) return;
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteStaffMutation.mutate(Array.from(selectedStaff));
  };

  const handleBulkStatusChange = () => {
    if (selectedStaff.size === 0) return;
    setBulkStatusDialogOpen(true);
  };

  const confirmBulkStatusChange = () => {
    if (!bulkStatusValue) {
      toast.error("Please select a status");
      return;
    }
    bulkStatusChangeMutation.mutate({
      staffIds: Array.from(selectedStaff),
      status: bulkStatusValue,
    });
  };

  // Filter and sort
  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStaff = [...filteredStaff].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === "name" || sortField === "position") {
      aValue = aValue?.toLowerCase() || "";
      bValue = bValue?.toLowerCase() || "";
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStaff = sortedStaff.slice(startIndex, startIndex + itemsPerPage);
  const allSelected = paginatedStaff.length > 0 && paginatedStaff.every((s) => selectedStaff.has(s.id));

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Staff Management</h1>
            <p className="text-muted-foreground">Manage your administrative staff members</p>
          </div>
          <div className="flex gap-3">
            <Button
              className="gradient-primary text-primary-foreground shadow-primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Add Staff</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Add Staff Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name</Label>
                <Input
                  id="staff-name"
                  placeholder="Enter staff member's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="staff@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone</Label>
                <Input
                  id="staff-phone"
                  placeholder="+233 24 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger id="staff-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
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
                <Label htmlFor="staff-salary">Monthly Salary (GH₵)</Label>
                <Input
                  id="staff-salary"
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
                <Label htmlFor="staff-hire-date">Hire Date</Label>
                <Input
                  id="staff-hire-date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
                {errors.hire_date && <p className="text-sm text-destructive">{errors.hire_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="staff-status">
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

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleAddStaff}>
                  Add Staff
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search and Actions Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {selectedStaff.size > 0 && (
                  <>
                    <Button variant="outline" size="default" onClick={handleBulkStatusChange}>
                      Change Status ({selectedStaff.size})
                    </Button>
                    <Button variant="destructive" size="default" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedStaff.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedStaff.size} staff member(s). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Staff Content */}
        {isLoading ? (
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredStaff.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-6">
                  <Briefcase className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No staff members yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? "No staff members match your search." : "Get started by adding your first staff member."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground">
                      <Plus className="mr-2 h-5 w-5" />
                      Add Your First Staff Member
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isMobile ? (
          // Mobile: Card View
          <div className="space-y-4">
            {paginatedStaff.map((member) => (
              <Card
                key={member.id}
                className="shadow-card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/staff/${member.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedStaff.has(member.id)}
                      onCheckedChange={(checked) => handleSelectStaff(member.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {member.position}
                          </p>
                        </div>
                        <Badge className={getStatusColor(member.status)} variant="outline">
                          {member.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {member.phone}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Monthly Salary:</span>
                          <span className="font-semibold">GH₵ {member.monthly_salary || 0}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/staff/${member.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Desktop: Table View
          <Card className="shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                      Name
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("position")}>
                      Position
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStaff.map((member) => (
                    <TableRow key={member.id} className="cursor-pointer hover:bg-muted/50" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/staff/${member.id}`);
                          }}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedStaff.has(member.id)}
                          onCheckedChange={(checked) => handleSelectStaff(member.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.position}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>GH₵ {member.monthly_salary || 0}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.status)} variant="outline">
                          {member.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedStaff.size} staff member(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Change Dialog */}
      <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status for {selectedStaff.size} Staff Member(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
    </div>
  );
}
