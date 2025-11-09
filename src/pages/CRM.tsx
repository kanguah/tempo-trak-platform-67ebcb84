import { useState, useEffect } from "react";
import { Plus, Mail, Phone, MessageSquare, UserPlus, Search, Archive, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const initialLeads = [
  {
    id: 1,
    name: "Alice Thompson",
    email: "alice.t@email.com",
    phone: "+233 24 777 8888",
    stage: "new",
    instrument: "Piano",
    source: "Website Form",
    notes: "Interested in beginner lessons for 7-year-old daughter",
    lastContact: "2 hours ago",
    archived: false,
  },
  {
    id: 2,
    name: "Robert Kim",
    email: "robert.kim@email.com",
    phone: "+233 24 888 9999",
    stage: "contacted",
    instrument: "Guitar",
    source: "Facebook Ad",
    notes: "Adult learner, wants weekend classes",
    lastContact: "1 day ago",
    archived: false,
  },
  {
    id: 3,
    name: "Maria Santos",
    email: "maria.s@email.com",
    phone: "+233 24 999 0000",
    stage: "contacted",
    instrument: "Voice",
    source: "Referral",
    notes: "Professional singer looking for advanced training",
    lastContact: "3 days ago",
    archived: false,
  },
  {
    id: 4,
    name: "John Appiah",
    email: "j.appiah@email.com",
    phone: "+233 24 000 1111",
    stage: "enrolled",
    instrument: "Drums",
    source: "Walk-in",
    notes: "Enrolled in 8-lesson package",
    lastContact: "1 week ago",
    archived: false,
  },
];

const stages = [
  { id: "new", label: "New Leads", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-orange-500" },
  { id: "enrolled", label: "Enrolled", color: "bg-green-500" },
];

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  stage: string;
  instrument: string;
  source: string;
  notes: string;
  lastContact: string;
  archived: boolean;
}

interface DraggableLeadCardProps {
  lead: Lead;
  index: number;
  stageIndex: number;
  onArchive: (leadId: number) => void;
  onEdit: (lead: Lead) => void;
}

function DraggableLeadCard({ lead, index, stageIndex, onArchive, onEdit }: DraggableLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: { lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    animationDelay: `${(stageIndex * 0.1) + (index * 0.05)}s`,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-2 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing animate-scale-in ${isDragging ? 'shadow-2xl ring-2 ring-primary' : ''}`}
      onClick={() => !isDragging && onEdit(lead)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div {...listeners} {...attributes} className="touch-none mt-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-foreground flex-1">{lead.name}</h3>
        </div>
        
        <div className="space-y-2 text-sm mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            {lead.phone}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Instrument:</span>
            <Badge variant="outline">{lead.instrument}</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Source:</span>
            <span className="font-medium">{lead.source}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Last Contact:</span>
            <span className="font-medium">{lead.lastContact}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {lead.notes}
        </p>

        <div className="flex gap-2 mb-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              toast.success(`Calling ${lead.name}...`);
            }}
          >
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              toast.success(`Opening message to ${lead.name}...`);
            }}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Message
          </Button>
        </div>

        <Button 
          size="sm" 
          variant="ghost" 
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(lead.id);
          }}
        >
          <Archive className="h-3 w-3 mr-1" />
          Archive
        </Button>
      </CardContent>
    </Card>
  );
}

interface DroppableStageProps {
  stage: { id: string; label: string; color: string };
  leads: Lead[];
  stageIndex: number;
  onArchive: (leadId: number) => void;
  onEdit: (lead: Lead) => void;
}

function DroppableStage({ stage, leads, stageIndex, onArchive, onEdit }: DroppableStageProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <Card 
      className={`shadow-card animate-slide-up transition-all ${isOver ? 'ring-2 ring-primary' : ''}`} 
      style={{ animationDelay: `${stageIndex * 0.1}s` }}
    >
      <CardHeader className={`${stage.color} text-white rounded-t-lg`}>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{stage.label}</span>
          <Badge className="bg-white/20 text-white border-white/30">
            {leads.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className={`p-4 space-y-3 min-h-[400px] transition-colors ${isOver ? 'bg-accent/50' : ''}`}>
        {leads.map((lead, index) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            index={index}
            stageIndex={stageIndex}
            onArchive={onArchive}
            onEdit={onEdit}
          />
        ))}

        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No leads in this stage</p>
            {isOver && <p className="text-xs mt-2">Drop here</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [leads, setLeads] = useState(() => {
    const savedLeads = localStorage.getItem("crm-leads");
    return savedLeads ? JSON.parse(savedLeads) : initialLeads;
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    instrument: "",
    source: "",
    stage: "new",
    notes: "",
  });

  useEffect(() => {
    localStorage.setItem("crm-leads", JSON.stringify(leads));
  }, [leads]);

  const getLeadsByStage = (stage: string) => {
    return leads.filter((lead) => lead.stage === stage && !lead.archived);
  };

  const handleArchiveLead = (leadId: number) => {
    const lead = leads.find(l => l.id === leadId);
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, archived: true } : lead
    ));
    toast.success(`${lead?.name} archived successfully`);
  };

  const handleAddLead = () => {
    if (!newLead.name || !newLead.email || !newLead.phone || !newLead.instrument || !newLead.source) {
      toast.error("Please fill in all required fields");
      return;
    }

    const leadToAdd = {
      id: Math.max(...leads.map(l => l.id), 0) + 1,
      ...newLead,
      lastContact: "Just now",
      archived: false,
    };

    setLeads([...leads, leadToAdd]);
    setAddDialogOpen(false);
    setNewLead({
      name: "",
      email: "",
      phone: "",
      instrument: "",
      source: "",
      stage: "new",
      notes: "",
    });
    toast.success(`${leadToAdd.name} added successfully`);
  };

  const handleOpenEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingLead?.name || !editingLead?.email || !editingLead?.phone || !editingLead?.instrument || !editingLead?.source) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLeads(leads.map(l => l.id === editingLead.id ? editingLead : l));
    setEditDialogOpen(false);
    setEditingLead(null);
    toast.success(`${editingLead.name} updated successfully`);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = active.data.current?.lead as Lead;
    setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = parseInt(active.id.toString().replace('lead-', ''));
    const newStage = over.id.toString();
    const lead = leads.find(l => l.id === leadId);

    if (lead && lead.stage !== newStage) {
      setLeads(leads.map(l => 
        l.id === leadId ? { ...l, stage: newStage } : l
      ));
      toast.success(`${lead.name} moved to ${stages.find(s => s.id === newStage)?.label}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">CRM & Leads</h1>
            <p className="text-muted-foreground">Manage prospects and student recruitment</p>
          </div>
          <Button 
            className="gradient-primary text-primary-foreground shadow-primary"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Lead
          </Button>
        </div>

        {/* Add Lead Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+233 24 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instrument">Instrument *</Label>
                <Select value={newLead.instrument} onValueChange={(value) => setNewLead({ ...newLead, instrument: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Piano">Piano</SelectItem>
                    <SelectItem value="Guitar">Guitar</SelectItem>
                    <SelectItem value="Voice">Voice</SelectItem>
                    <SelectItem value="Drums">Drums</SelectItem>
                    <SelectItem value="Violin">Violin</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website Form">Website Form</SelectItem>
                    <SelectItem value="Facebook Ad">Facebook Ad</SelectItem>
                    <SelectItem value="Google Ad">Google Ad</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select value={newLead.stage} onValueChange={(value) => setNewLead({ ...newLead, stage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Lead</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Add any relevant notes..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLead}>
                Add Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
            </DialogHeader>
            {editingLead && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingLead.name}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingLead.email}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone *</Label>
                  <Input
                    id="edit-phone"
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    placeholder="+233 24 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-instrument">Instrument *</Label>
                  <Select value={editingLead.instrument} onValueChange={(value) => setEditingLead({ ...editingLead, instrument: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select instrument" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Piano">Piano</SelectItem>
                      <SelectItem value="Guitar">Guitar</SelectItem>
                      <SelectItem value="Voice">Voice</SelectItem>
                      <SelectItem value="Drums">Drums</SelectItem>
                      <SelectItem value="Violin">Violin</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-source">Source *</Label>
                  <Select value={editingLead.source} onValueChange={(value) => setEditingLead({ ...editingLead, source: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website Form">Website Form</SelectItem>
                      <SelectItem value="Facebook Ad">Facebook Ad</SelectItem>
                      <SelectItem value="Google Ad">Google Ad</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stage">Stage</Label>
                  <Select value={editingLead.stage} onValueChange={(value) => setEditingLead({ ...editingLead, stage: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Lead</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingLead.notes}
                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                    placeholder="Add any relevant notes..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => {
                setEditDialogOpen(false);
                setEditingLead(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {stages.map((stage, index) => {
            const count = getLeadsByStage(stage.id).length;
            return (
              <Card
                key={stage.id}
                className={`shadow-card border-l-4 animate-scale-in`}
                style={{
                  borderLeftColor: `${stage.color.replace("bg-", "var(--")}`,
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stage.label}</p>
                      <h3 className="text-3xl font-bold text-foreground">{count}</h3>
                    </div>
                    <div
                      className={`h-12 w-12 rounded-full ${stage.color}/10 flex items-center justify-center`}
                    >
                      <UserPlus className={`h-6 w-6 ${stage.color.replace("bg-", "text-")}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, or instrument..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Board */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-6 md:grid-cols-3">
            {stages.map((stage, stageIndex) => (
              <DroppableStage
                key={stage.id}
                stage={stage}
                leads={getLeadsByStage(stage.id)}
                stageIndex={stageIndex}
                onArchive={handleArchiveLead}
                onEdit={handleOpenEditDialog}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? (
              <Card className="border-2 shadow-2xl opacity-90 cursor-grabbing">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2">{activeLead.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{activeLead.email}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
