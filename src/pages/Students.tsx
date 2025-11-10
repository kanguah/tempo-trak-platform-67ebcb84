import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Eye, Trash2, ArrowUpDown, UserPlus } from "lucide-react";
import DataImport from "@/components/DataImport";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  grade: z.string().min(1, "Grade is required"),
  instrument: z.string().min(1, "Please select an instrument"),
  date_of_birth: z.string().optional(),
  parent_name: z.string().trim().max(100, "Parent name must be less than 100 characters").optional().or(z.literal("")),
  parent_email: z
    .string()
    .trim()
    .email("Invalid parent email")
    .max(255, "Parent email must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  parent_phone: z.string().trim().max(20, "Parent phone must be less than 20 characters").optional().or(z.literal("")),
  address: z.string().trim().max(200, "Address must be less than 200 characters").optional().or(z.literal("")),
});
const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"];
type SortField = "name" | "grade" | "created_at";
type SortDirection = "asc" | "desc";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    instrument: "",
    date_of_birth: "",
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const itemsPerPage = 20;

  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("user_id", user?.id).order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  const addStudentMutation = useMutation({
    mutationFn: async (newStudent: any) => {
      const { instrument, ...studentData } = newStudent;
      const { data, error } = await supabase
        .from("students")
        .insert([
          {
            ...studentData,
            subjects: [instrument],
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        grade: "",
        instrument: "",
        date_of_birth: "",
        parent_name: "",
        parent_email: "",
        parent_phone: "",
        address: "",
      });
      setErrors({});
      toast.success("Student added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add student");
    },
  });

  const deleteStudentsMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const { error } = await supabase.from("students").delete().in("id", studentIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setSelectedStudents(new Set());
      setDeleteDialogOpen(false);
      toast.success("Students deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete students");
    },
  });
  const handleAddStudent = () => {
    try {
      const validated = studentSchema.parse(formData);
      addStudentMutation.mutate(validated);
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
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Advanced":
        return "bg-accent text-accent-foreground";
      case "Intermediate":
        return "bg-primary text-primary-foreground";
      case "Beginner":
        return "bg-secondary text-secondary-foreground";
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
      setSelectedStudents(new Set(paginatedStudents.map((s) => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedStudents.size === 0) return;
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteStudentsMutation.mutate(Array.from(selectedStudents));
  };

  // Filter and sort
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.subjects && student.subjects.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))),
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + itemsPerPage);

  const allSelected = paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedStudents.has(s.id));
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Students</h1>
            <p className="text-muted-foreground">Manage your academy's students</p>
          </div>
          <div className="flex gap-3">
            <DataImport type="students" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground shadow-primary">
                  <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Add Student</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter student's full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+233 24 123 4567"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          grade: value,
                        })
                      }
                    >
                      <SelectTrigger id="grade">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instrument">Instrument</Label>
                    <Select
                      value={formData.instrument}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          instrument: value,
                        })
                      }
                    >
                      <SelectTrigger id="instrument">
                        <SelectValue placeholder="Select instrument" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {instruments.map((instrument) => (
                          <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.instrument && <p className="text-sm text-destructive">{errors.instrument}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                    {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Input
                      id="address"
                      placeholder="123 Music Street, Accra"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: e.target.value,
                        })
                      }
                    />
                    {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h3 className="text-sm font-semibold">Parent/Guardian Information (Optional)</h3>

                    <div className="space-y-2">
                      <Label htmlFor="parent_name">Parent/Guardian Name</Label>
                      <Input
                        id="parent_name"
                        placeholder="Jennifer Johnson"
                        value={formData.parent_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parent_name: e.target.value,
                          })
                        }
                      />
                      {errors.parent_name && <p className="text-sm text-destructive">{errors.parent_name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parent_email">Parent/Guardian Email</Label>
                      <Input
                        id="parent_email"
                        type="email"
                        placeholder="parent@email.com"
                        value={formData.parent_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parent_email: e.target.value,
                          })
                        }
                      />
                      {errors.parent_email && <p className="text-sm text-destructive">{errors.parent_email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parent_phone">Parent/Guardian Phone</Label>
                      <Input
                        id="parent_phone"
                        placeholder="+233 24 123 4560"
                        value={formData.parent_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parent_phone: e.target.value,
                          })
                        }
                      />
                      {errors.parent_phone && <p className="text-sm text-destructive">{errors.parent_phone}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleAddStudent}>
                      Add Student
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {selectedStudents.size > 0 && (
                  <Button variant="destructive" size="default" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedStudents.size})
                  </Button>
                )}
                <Button variant="outline" size="icon">
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Content */}
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
        ) : filteredStudents.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-6">
                  <UserPlus className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No students yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? "No students match your search."
                      : "Get started by adding your first student or importing from CSV."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground">
                      <Plus className="mr-2 h-5 w-5" />
                      Add Your First Student
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isMobile ? (
          // Mobile: Card View
          <div className="space-y-4">
            {paginatedStudents.map((student, index) => (
              <Card
                key={student.id}
                className="shadow-card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{student.name}</h3>
                        </div>
                        <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">Instrument:</span>
                          <p className="font-medium">{student.subjects?.join(", ") || "N/A"}</p>
                        </div>
                        <div>
                          <p>
                            <Badge className={getLevelColor(student.grade || "Beginner")}>
                              {student.grade || "Beginner"}
                            </Badge>
                          </p>
                        </div>
                      </div>
                      
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
                    <TableHead className="w-[50px]">
                      <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead className="w-[250px] cursor-pointer" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-2">
                        Student
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("grade")}>
                      <div className="flex items-center gap-2">
                        Grade
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{student.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{student.subjects?.join(", ") || "No instrument"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelColor(student.grade || "Beginner")}>
                          {student.grade || "Beginner"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm truncate max-w-[200px]">{student.email}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm">{student.phone || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
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

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <PaginationEllipsis key={page} />;
                }
                return null;
              })}

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
              This will permanently delete {selectedStudents.size} student{selectedStudents.size > 1 ? "s" : ""}. This
              action cannot be undone.
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
    </div>
  );
}
