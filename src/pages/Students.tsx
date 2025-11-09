import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Eye } from "lucide-react";
import DataImport from "@/components/DataImport";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  grade: z.string().min(1, "Grade is required"),
  instrument: z.string().min(1, "Please select an instrument")
});
const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"];
export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    instrument: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: students = [],
    isLoading
  } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('students').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const addStudentMutation = useMutation({
    mutationFn: async (newStudent: any) => {
      const {
        instrument,
        ...studentData
      } = newStudent;
      const {
        data,
        error
      } = await supabase.from('students').insert([{
        ...studentData,
        subjects: [instrument],
        // Convert instrument to subjects array
        user_id: user?.id
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['students']
      });
      setDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        grade: "",
        instrument: ""
      });
      setErrors({});
      toast.success("Student added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add student");
    }
  });
  const handleAddStudent = () => {
    try {
      const validated = studentSchema.parse(formData);
      addStudentMutation.mutate(validated);
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
  const filteredStudents = students.filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.email.toLowerCase().includes(searchQuery.toLowerCase()) || student.subjects && student.subjects.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())));
  if (isLoading) {
    return <div className="min-h-screen bg-background p-8">Loading...</div>;
  }
  return <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Students</h1>
            <p className="text-muted-foreground">Manage your academy's students</p>
          </div>
          <div className="flex gap-3">
            <DataImport type="students" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground shadow-primary">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Student
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter student's full name" value={formData.name} onChange={e => setFormData({
                    ...formData,
                    name: e.target.value
                  })} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="student@email.com" value={formData.email} onChange={e => setFormData({
                    ...formData,
                    email: e.target.value
                  })} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+233 24 123 4567" value={formData.phone} onChange={e => setFormData({
                    ...formData,
                    phone: e.target.value
                  })} />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select value={formData.grade} onValueChange={value => setFormData({
                    ...formData,
                    grade: value
                  })}>
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
                  <Select value={formData.instrument} onValueChange={value => setFormData({
                    ...formData,
                    instrument: value
                  })}>
                    <SelectTrigger id="instrument">
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

        {/* Search and Filter Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Search students by name, instrument, or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Student</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No students found. Add your first student or import from CSV.
                    </TableCell>
                  </TableRow> : filteredStudents.map((student, index) => <TableRow key={student.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/students/${student.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{student.name}</p>
                            
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          
                          <span className="text-sm">{student.subjects?.join(", ") || "No instrument"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelColor(student.grade || "Beginner")}>
                          {student.grade || "Beginner"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          
                          <span className="text-sm truncate max-w-[200px]">{student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          
                          <span className="text-sm">{student.phone || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === "active" ? "default" : "secondary"}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={e => {
                    e.stopPropagation();
                    navigate(`/students/${student.id}`);
                  }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>;
}