import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Music, Mail, Phone, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";

const initialTutors = [
  {
    id: 1,
    name: "Mr. Kofi Mensah",
    instruments: ["Piano", "Music Theory"],
    email: "kofi.mensah@49ice.com",
    phone: "+233 24 111 2222",
    status: "Active",
    avatar: "KM",
    students: 18,
    hoursPerWeek: 24,
    monthlyPay: "GH₵ 4,200",
    nextLesson: "Today, 9:00 AM",
  },
  {
    id: 2,
    name: "Ms. Ama Osei",
    instruments: ["Guitar", "Bass"],
    email: "ama.osei@49ice.com",
    phone: "+233 24 222 3333",
    status: "Active",
    avatar: "AO",
    students: 15,
    hoursPerWeek: 20,
    monthlyPay: "GH₵ 3,800",
    nextLesson: "Today, 10:30 AM",
  },
  {
    id: 3,
    name: "Mr. Kwame Asante",
    instruments: ["Violin", "Cello"],
    email: "kwame.asante@49ice.com",
    phone: "+233 24 333 4444",
    status: "Active",
    avatar: "KA",
    students: 12,
    hoursPerWeek: 16,
    monthlyPay: "GH₵ 3,200",
    nextLesson: "Tomorrow, 2:00 PM",
  },
  {
    id: 4,
    name: "Mr. Yaw Boateng",
    instruments: ["Drums", "Percussion"],
    email: "yaw.boateng@49ice.com",
    phone: "+233 24 444 5555",
    status: "Active",
    avatar: "YB",
    students: 14,
    hoursPerWeek: 18,
    monthlyPay: "GH₵ 3,500",
    nextLesson: "Today, 4:00 PM",
  },
  {
    id: 5,
    name: "Ms. Abena Owusu",
    instruments: ["Voice", "Choir"],
    email: "abena.owusu@49ice.com",
    phone: "+233 24 555 6666",
    status: "Active",
    avatar: "AO",
    students: 20,
    hoursPerWeek: 22,
    monthlyPay: "GH₵ 4,000",
    nextLesson: "Friday, 3:00 PM",
  },
  {
    id: 6,
    name: "Mr. Kwesi Adjei",
    instruments: ["Saxophone", "Clarinet"],
    email: "kwesi.adjei@49ice.com",
    phone: "+233 24 666 7777",
    status: "On Leave",
    avatar: "KA",
    students: 8,
    hoursPerWeek: 0,
    monthlyPay: "GH₵ 0",
    nextLesson: "Returns June 20",
  },
];

const availableInstruments = [
  "Piano",
  "Guitar",
  "Violin",
  "Drums",
  "Voice",
  "Saxophone",
  "Flute",
  "Bass",
  "Cello",
  "Clarinet",
  "Music Theory",
  "Choir",
  "Percussion",
];

const addTutorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  instruments: z.array(z.string()).min(1, "Select at least one instrument"),
  status: z.string().min(1, "Status is required"),
});

export default function Tutors() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tutors, setTutors] = useState(() => {
    const savedTutors = localStorage.getItem("academy-tutors");
    return savedTutors ? JSON.parse(savedTutors) : initialTutors;
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    instruments: [] as string[],
    status: "Active",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem("academy-tutors", JSON.stringify(tutors));
  }, [tutors]);

  const handleAddTutor = () => {
    try {
      const validated = addTutorSchema.parse(formData);
      
      const newTutor = {
        id: Math.max(...tutors.map((t: any) => t.id), 0) + 1,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        instruments: validated.instruments,
        status: validated.status,
        avatar: validated.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        students: 0,
        hoursPerWeek: 0,
        monthlyPay: "GH₵ 0",
        nextLesson: "Not scheduled",
      };

      setTutors([...tutors, newTutor]);
      setDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        instruments: [],
        status: "Active",
      });
      setErrors({});
      toast.success(`${validated.name} added successfully!`);
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

  const toggleInstrument = (instrument: string) => {
    setFormData((prev) => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter((i) => i !== instrument)
        : [...prev.instruments, instrument],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
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

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Tutors</h1>
            <p className="text-muted-foreground">Manage your academy's teaching staff</p>
          </div>
          <Button 
            className="gradient-primary text-primary-foreground shadow-primary"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Tutor
          </Button>
        </div>

        {/* Add Tutor Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Tutor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tutor-name">Full Name</Label>
                <Input
                  id="tutor-name"
                  placeholder="Enter tutor's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutor-email">Email</Label>
                <Input
                  id="tutor-email"
                  type="email"
                  placeholder="tutor@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutor-phone">Phone</Label>
                <Input
                  id="tutor-phone"
                  placeholder="+233 24 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label>Instruments</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/50">
                  {availableInstruments.map((instrument) => (
                    <div key={instrument} className="flex items-center space-x-2">
                      <Checkbox
                        id={instrument}
                        checked={formData.instruments.includes(instrument)}
                        onCheckedChange={() => toggleInstrument(instrument)}
                      />
                      <Label
                        htmlFor={instrument}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {instrument}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.instruments && <p className="text-sm text-destructive">{errors.instruments}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutor-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
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
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setDialogOpen(false);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      instruments: [],
                      status: "Active",
                    });
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  onClick={handleAddTutor}
                >
                  Add Tutor
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search and Filter Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search tutors by name, instrument, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tutors Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor, index) => (
            <Card
              key={tutor.id}
              className="shadow-card hover:shadow-primary transition-all duration-300 animate-scale-in cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(`/tutors/${tutor.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl ${getAvatarGradient(
                        index
                      )} text-white font-bold text-lg shadow-md`}
                    >
                      {tutor.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{tutor.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Music className="h-4 w-4" />
                        {tutor.instruments.join(", ")}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(tutor.status)} variant="outline">
                    {tutor.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {tutor.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {tutor.phone}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Students</span>
                    <span className="font-semibold text-foreground">{tutor.students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hours/Week</span>
                    <span className="font-semibold text-foreground">{tutor.hoursPerWeek}h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Pay</span>
                    <span className="font-semibold text-accent">{tutor.monthlyPay}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next Lesson</span>
                    <span className="font-semibold text-primary">{tutor.nextLesson}</span>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="outline">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
