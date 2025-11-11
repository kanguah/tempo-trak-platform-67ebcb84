import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Music, Mail, Phone, Eye, Trash2, ArrowUpDown, UserPlus } from "lucide-react";
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
const addTutorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  instrument: z.string().min(1, "Please select an instrument"),
  status: z.string().min(1, "Status is required"),
  hourly_rate: z.number().optional()
});
const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"];
type SortField = "name" | "status" | "created_at";
type SortDirection = "asc" | "desc";
export default function Tutors() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    instrument: "",
    status: "Active",
    hourly_rate: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedTutors, setSelectedTutors] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const itemsPerPage = 20;
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const {
    data: tutors = [],
    isLoading
  } = useQuery({
    queryKey: ["tutors"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tutors").select("*").eq("user_id", user?.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const addTutorMutation = useMutation({
    mutationFn: async (newTutor: any) => {
      const {
        instrument,
        ...tutorData
      } = newTutor;
      const {
        data,
        error
      } = await supabase.from("tutors").insert([{
        ...tutorData,
        subjects: [instrument],
        user_id: user?.id
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tutors"]
      });
      setDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        instrument: "",
        status: "Active",
        hourly_rate: 0
      });
      setErrors({});
      toast.success("Tutor added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add tutor");
    }
  });
  const deleteTutorsMutation = useMutation({
    mutationFn: async (tutorIds: string[]) => {
      const {
        error
      } = await supabase.from("tutors").delete().in("id", tutorIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tutors"]
      });
      setSelectedTutors(new Set());
      setDeleteDialogOpen(false);
      toast.success("Tutors deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete tutors");
    }
  });
  const handleAddTutor = () => {
    try {
      const validated = addTutorSchema.parse(formData);
      addTutorMutation.mutate(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Inactive":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "On Leave":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  const getAvatarGradient = (index: number) => {
    const gradients = ["gradient-primary", "gradient-accent", "bg-secondary", "bg-primary"];
    return gradients[index % gradients.length];
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
      setSelectedTutors(new Set(paginatedTutors.map(t => t.id)));
    } else {
      setSelectedTutors(new Set());
    }
  };
  const handleSelectTutor = (tutorId: string, checked: boolean) => {
    const newSelected = new Set(selectedTutors);
    if (checked) {
      newSelected.add(tutorId);
    } else {
      newSelected.delete(tutorId);
    }
    setSelectedTutors(newSelected);
  };
  const handleBulkDelete = () => {
    if (selectedTutors.size === 0) return;
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    deleteTutorsMutation.mutate(Array.from(selectedTutors));
  };

  // Filter and sort
  const filteredTutors = tutors.filter(tutor => tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) || tutor.email.toLowerCase().includes(searchQuery.toLowerCase()) || tutor.subjects && tutor.subjects.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())));
  const sortedTutors = [...filteredTutors].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    if (sortField === "name") {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    }
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedTutors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTutors = sortedTutors.slice(startIndex, startIndex + itemsPerPage);
  const allSelected = paginatedTutors.length > 0 && paginatedTutors.every(t => selectedTutors.has(t.id));
  return <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Tutors</h1>
            <p className="text-muted-foreground">Manage your academy's teaching staff</p>
          </div>
          <div className="flex gap-3">
            <DataImport type="tutors" />
            <Button className="gradient-primary text-primary-foreground shadow-primary" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Add Tutor</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Add Tutor Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Tutor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tutor-name">Full Name</Label>
                <Input id="tutor-name" placeholder="Enter tutor's full name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutor-email">Email</Label>
                <Input id="tutor-email" type="email" placeholder="tutor@email.com" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutor-phone">Phone</Label>
                <Input id="tutor-phone" placeholder="+233 24 123 4567" value={formData.phone} onChange={e => setFormData({
                ...formData,
                phone: e.target.value
              })} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutor-instrument">Instrument</Label>
                <Select value={formData.instrument} onValueChange={value => setFormData({
                ...formData,
                instrument: value
              })}>
                  <SelectTrigger id="tutor-instrument">
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {instruments.map(instrument => <SelectItem key={instrument} value={instrument}>
                        {instrument}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.instrument && <p className="text-sm text-destructive">{errors.instrument}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutor-status">Status</Label>
                <Select value={formData.status} onValueChange={value => setFormData({
                ...formData,
                status: value
              })}>
                  <SelectTrigger id="tutor-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleAddTutor}>
                  Add Tutor
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
                <Input placeholder="Search tutors..." value={searchQuery} onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }} className="pl-10" />
              </div>
              <div className="flex gap-2">
                {selectedTutors.size > 0 && <Button variant="destructive" size="default" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedTutors.size})
                  </Button>}
                <Button variant="outline" size="icon">
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tutors Content */}
        {isLoading ? <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card> : filteredTutors.length === 0 ? <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-6">
                  <UserPlus className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No tutors yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? "No tutors match your search." : "Get started by adding your first tutor or importing from CSV."}
                  </p>
                  {!searchQuery && <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground">
                      <Plus className="mr-2 h-5 w-5" />
                      Add Your First Tutor
                    </Button>}
                </div>
              </div>
            </CardContent>
          </Card> : isMobile ?
      // Mobile: Card View
      <div className="space-y-4">
            {paginatedTutors.map((tutor, index) => <Card key={tutor.id} className="shadow-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/tutors/${tutor.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={selectedTutors.has(tutor.id)} onCheckedChange={checked => handleSelectTutor(tutor.id, checked as boolean)} onClick={e => e.stopPropagation()} />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{tutor.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {tutor.subjects?.join(", ") || "No subjects"}
                          </p>
                        </div>
                        <Badge className={getStatusColor(tutor.status)} variant="outline">
                          {tutor.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{tutor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {tutor.phone || "No phone"}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Hourly Rate:</span>
                          <span className="font-semibold">GH₵ {tutor.hourly_rate || 0}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={e => {
                  e.stopPropagation();
                  navigate(`/tutors/${tutor.id}`);
                }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div> :
      // Desktop: Table View
      <Card className="shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead className="w-[250px] cursor-pointer" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-2">
                        Tutor
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                      <div className="flex items-center gap-2">
                        Status
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTutors.map(tutor => <TableRow key={tutor.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/tutors/${tutor.id}`)}>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Checkbox checked={selectedTutors.has(tutor.id)} onCheckedChange={checked => handleSelectTutor(tutor.id, checked as boolean)} />
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{tutor.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          
                          <span className="text-sm">{tutor.subjects?.join(", ") || "No subjects"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tutor.status)} variant="outline">
                          {tutor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[200px]">{tutor.email}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{tutor.phone || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">GH₵ {tutor.hourly_rate || 0}</span>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>}

        {/* Pagination */}
        {totalPages > 1 && <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            if (page === 1 || page === totalPages || page >= currentPage - 1 && page <= currentPage + 1) {
              return <PaginationItem key={page}>
                      <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                        {page}
                      </PaginationLink>
                    </PaginationItem>;
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <PaginationEllipsis key={page} />;
            }
            return null;
          })}

              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedTutors.size} tutor{selectedTutors.size > 1 ? "s" : ""}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}