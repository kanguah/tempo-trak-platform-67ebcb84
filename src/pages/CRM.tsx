import { useState, useEffect } from "react";
import { Plus, Mail, Phone, MessageSquare, UserPlus, Search, Archive, GripVertical, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import DataImport from "@/components/DataImport";
const initialLeads = [{
  id: 1,
  name: "Alice Thompson",
  email: "alice.t@email.com",
  phone: "+233 24 777 8888",
  stage: "new",
  instrument: "Piano",
  source: "Website Form",
  notes: "Interested in beginner lessons for 7-year-old daughter",
  lastContact: "2 hours ago",
  archived: false
}, {
  id: 2,
  name: "Robert Kim",
  email: "robert.kim@email.com",
  phone: "+233 24 888 9999",
  stage: "contacted",
  instrument: "Guitar",
  source: "Facebook Ad",
  notes: "Adult learner, wants weekend classes",
  lastContact: "1 day ago",
  archived: false
}, {
  id: 3,
  name: "Maria Santos",
  email: "maria.s@email.com",
  phone: "+233 24 999 0000",
  stage: "contacted",
  instrument: "Voice",
  source: "Referral",
  notes: "Professional singer looking for advanced training",
  lastContact: "3 days ago",
  archived: false
}, {
  id: 4,
  name: "John Appiah",
  email: "j.appiah@email.com",
  phone: "+233 24 000 1111",
  stage: "converted",
  instrument: "Drums",
  source: "Walk-in",
  notes: "Enrolled in 8-lesson package",
  lastContact: "1 week ago",
  archived: false
}];
const stages = [{
  id: "new",
  label: "New Leads",
  color: "bg-blue-500"
}, {
  id: "contacted",
  label: "Contacted",
  color: "bg-orange-500"
}, {
  id: "qualified",
  label: "Qualified",
  color: "bg-purple-500"
}, {
  id: "converted",
  label: "Converted",
  color: "bg-green-500"
}, {
  id: "lost",
  label: "Lost",
  color: "bg-slate-500"
}];
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  instrument: string;
  source: string;
  notes: string;
  lastContact: string;
  archived: boolean;
  createdAt: string;
}
interface DraggableLeadCardProps {
  lead: Lead;
  index: number;
  stageIndex: number;
  onArchive: (leadId: string) => void;
  onDelete: (leadId: string) => void;
  onEdit: (lead: Lead) => void;
  onContact: (lead: Lead, method: 'call' | 'email') => void;
  lastContactedAt?: string;
  isSelected: boolean;
  onToggleSelect: (leadId: string, isSelected: boolean) => void;
}
function DraggableLeadCard({
  lead,
  index,
  stageIndex,
  onArchive,
  onDelete,
  onEdit,
  onContact,
  lastContactedAt,
  isSelected,
  onToggleSelect
}: DraggableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `lead-${lead.id}`,
    data: {
      lead
    }
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    animationDelay: `${stageIndex * 0.1 + index * 0.05}s`
  };
  return <Card ref={setNodeRef} style={style} className={`border-2 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing animate-scale-in ${isDragging ? 'shadow-2xl ring-2 ring-primary' : ''} ${isSelected ? 'border-primary ring-2 ring-primary/60' : ''}`} onClick={() => !isDragging && onEdit(lead)}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start gap-2 mb-2">
          <div onClick={e => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={checked => onToggleSelect(lead.id, checked === true)} className="mt-1" aria-label={`Select ${lead.name}`} />
          </div>
          <div {...listeners} {...attributes} className="touch-none mt-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-sm md:text-base text-foreground flex-1 truncate">{lead.name}</h3>
          <div className="flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground" 
              onClick={e => {
                e.stopPropagation();
                onArchive(lead.id);
              }}
            >
              <Archive className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-destructive" 
              onClick={e => {
                e.stopPropagation();
                onDelete(lead.id);
              }}
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
        
        

        

        

        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="outline" className="flex-1 h-9 md:h-8 text-xs" onClick={e => {
          e.stopPropagation();
          toast.success(`Calling ${lead.name}...`);
          onContact(lead, 'call');
        }}>
            <Phone className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Call</span>
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-9 md:h-8 text-xs" onClick={e => {
          e.stopPropagation();
          window.location.href = `mailto:${lead.email}?subject=Follow up - ${lead.instrument} Lessons`;
          onContact(lead, 'email');
        }}>
            <Mail className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Email</span>
          </Button>
        </div>
          <div className=" flex justify-between">
        <span className="text-xs text-muted-foreground">Added {lead.createdAt}</span>
        <span className="text-xs text-muted-foreground mt-1">Last contacted: {lastContactedAt || lead.lastContact || 'Not yet'}</span>
        </div>
      </CardContent>
    </Card>;
}
interface DroppableStageProps {
  stage: {
    id: string;
    label: string;
    color: string;
  };
  leads: Lead[];
  stageIndex: number;
  onArchive: (leadId: string) => void;
  onDelete: (leadId: string) => void;
  onEdit: (lead: Lead) => void;
  onContact: (lead: Lead, method: 'call' | 'email') => void;
  lastContactTimes: Record<string, string | undefined>;
  selectedLeadIds: string[];
  onToggleSelect: (leadId: string, isSelected: boolean) => void;
  onToggleStageSelect: (stageId: string, selectAll: boolean) => void;
}
function DroppableStage({
  stage,
  leads,
  stageIndex,
  onArchive,
  onDelete,
  onEdit,
  onContact,
  lastContactTimes,
  selectedLeadIds,
  onToggleSelect,
  onToggleStageSelect
}: DroppableStageProps) {
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id: stage.id
  });
  const allSelected = leads.length > 0 && leads.every(lead => selectedLeadIds.includes(lead.id));
  const someSelected = leads.some(lead => selectedLeadIds.includes(lead.id));
  return <Card className={`shadow-card animate-slide-up transition-all flex flex-col max-h-[80vh] overflow-hidden ${isOver ? 'ring-2 ring-primary' : ''}`} style={{
    animationDelay: `${stageIndex * 0.1}s`
  }}>
      <CardHeader className={`${stage.color} text-white rounded-t-lg`}>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base md:text-lg flex items-center justify-between">
            <span>{stage.label}</span>
            <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
              {leads.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <button className="text-white/80 hover:text-white transition-colors underline-offset-2 hover:underline disabled:opacity-50" onClick={e => {
            e.preventDefault();
            onToggleStageSelect(stage.id, true);
          }} disabled={leads.length === 0 || allSelected}>
              Select all
            </button>
            <span className="text-white/40">•</span>
            <button className="text-white/80 hover:text-white transition-colors underline-offset-2 hover:underline disabled:opacity-50" onClick={e => {
            e.preventDefault();
            onToggleStageSelect(stage.id, false);
          }} disabled={!someSelected}>
              Clear
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent ref={setNodeRef} className={`p-3 md:p-4 space-y-3 min-h-[300px] md:min-h-[400px] flex-1 overflow-y-auto transition-colors ${isOver ? 'bg-accent/50' : ''}`}>
        {leads.map((lead, index) => <DraggableLeadCard key={lead.id} lead={lead} index={index} stageIndex={stageIndex} onArchive={onArchive} onDelete={onDelete} onEdit={onEdit} onContact={onContact} lastContactedAt={lastContactTimes[lead.id]} isSelected={selectedLeadIds.includes(lead.id)} onToggleSelect={onToggleSelect} />)}

        {leads.length === 0 && <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs md:text-sm">No leads in this stage</p>
            {isOver && <p className="text-xs mt-2">Drop here</p>}
          </div>}
      </CardContent>
    </Card>;
}
export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [lastContactTimes, setLastContactTimes] = useState<Record<string, string | undefined>>({});
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    instrument: "",
    source: "",
    stage: "new",
    notes: ""
  });
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: leads = [],
    isLoading
  } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('crm_leads').select('*').eq('user_id', user?.id).in('stage', ['new', 'contacted', 'qualified', 'converted', 'lost']).order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Map database stages to UI stages
      const stageMap: Record<string, string> = {
        'new': 'new',
        'contacted': 'contacted',
        'qualified': 'qualified',
        'converted': 'converted',
        'lost': 'lost'
      };
      return data.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || "",
        stage: stageMap[lead.stage] || lead.stage,
        instrument: lead.notes?.split(":")[0] || "",
        source: lead.source || "",
        notes: lead.notes || "",
        lastContact: new Date(lead.updated_at).toLocaleDateString(),
        archived: lead.stage === 'lost',
        createdAt: new Date(lead.created_at).toLocaleDateString()
      }));
    },
    enabled: !!user
  });
  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.stage === stage);
  };
  const handleToggleLeadSelection = (leadId: string, isSelected: boolean) => {
    setSelectedLeads(prev => {
      if (isSelected) {
        if (prev.includes(leadId)) return prev;
        return [...prev, leadId];
      }
      return prev.filter(id => id !== leadId);
    });
  };
  const handleToggleStageSelection = (stageId: string, selectAll: boolean) => {
    const stageLeadIds = getLeadsByStage(stageId).map(lead => lead.id);
    setSelectedLeads(prev => {
      if (selectAll) {
        const merged = new Set([...prev, ...stageLeadIds]);
        return Array.from(merged);
      }
      return prev.filter(id => !stageLeadIds.includes(id));
    });
  };
  const handleSelectAllLeads = () => {
    setSelectedLeads(leads.map(lead => lead.id));
  };
  const handleClearSelection = () => setSelectedLeads([]);
  useEffect(() => {
    setLastContactTimes(prev => {
      const next = { ...prev };
      leads.forEach(lead => {
        if (!next[lead.id]) {
          next[lead.id] = lead.lastContact;
        }
      });
      return next;
    });
  }, [leads]);
  useEffect(() => {
    setSelectedLeads(prev => prev.filter(id => leads.some(lead => lead.id === id)));
  }, [leads]);
  const handleContactLead = (lead: Lead, _method: 'call' | 'email') => {
    const timestamp = new Date().toLocaleString();
    setLastContactTimes(prev => ({
      ...prev,
      [lead.id]: timestamp
    }));
  };
  const archiveLeadInSupabase = async (leadId: string, originalStage?: string) => {
    let stageToStore = originalStage;
    if (!stageToStore) {
      const {
        data: currentLead,
        error: fetchError
      } = await supabase.from('crm_leads').select('stage').eq('id', leadId).single();
      if (fetchError) throw fetchError;
      stageToStore = currentLead.stage;
    }
    const {
      error
    } = await supabase.from('crm_leads').update({
      stage: 'lost',
      original_stage: stageToStore
    }).eq('id', leadId);
    if (error) throw error;
  };
  const archiveLeadMutation = useMutation({
    mutationFn: (leadId: string) => archiveLeadInSupabase(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
      queryClient.invalidateQueries({
        queryKey: ['archived-leads']
      });
      toast.success("Lead archived successfully");
    }
  });
  const handleArchiveLead = (leadId: string) => {
    archiveLeadMutation.mutate(leadId);
  };
  const bulkArchiveMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      await Promise.all(leadIds.map(leadId => {
        const originalStage = leads.find(lead => lead.id === leadId)?.stage;
        return archiveLeadInSupabase(leadId, originalStage);
      }));
    },
    onSuccess: (_, leadIds) => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
      queryClient.invalidateQueries({
        queryKey: ['archived-leads']
      });
      toast.success(`Archived ${leadIds.length} lead${leadIds.length === 1 ? '' : 's'}`);
      setSelectedLeads([]);
    },
    onError: () => {
      toast.error("Failed to archive selected leads");
    }
  });
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const {
        error
      } = await supabase.from('crm_leads').delete().eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
      const lead = leads.find(l => l.id === leadId);
      toast.success(`${lead?.name} deleted successfully`);
    },
    onError: () => {
      toast.error("Failed to delete lead");
    },
  });
  const handleDeleteLead = (leadId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this lead?")) {
      deleteLeadMutation.mutate(leadId);
    }
  };
  const bulkDeleteMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const {
        error
      } = await supabase.from('crm_leads').delete().in('id', leadIds);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
      toast.success(`Deleted ${ids.length} lead${ids.length === 1 ? '' : 's'}`);
      setSelectedLeads([]);
    },
    onError: () => {
      toast.error("Failed to delete selected leads");
    }
  });
  const handleBulkArchive = () => {
    if (selectedLeads.length === 0) return;
    bulkArchiveMutation.mutate(selectedLeads);
  };
  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) return;
    if (!window.confirm(`Delete ${selectedLeads.length} selected lead${selectedLeads.length === 1 ? '' : 's'}? This cannot be undone.`)) {
      return;
    }
    bulkDeleteMutation.mutate(selectedLeads);
  };
  const addLeadMutation = useMutation({
    mutationFn: async (newLead: any) => {
      const {
        data,
        error
      } = await supabase.from('crm_leads').insert([{
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        stage: newLead.stage,
        source: newLead.source,
        notes: `${newLead.instrument}: ${newLead.notes}`,
        user_id: user?.id
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
      toast.success("Lead added successfully!");
    }
  });
  const handleAddLead = () => {
    if (!newLead.name || !newLead.email || !newLead.phone || !newLead.instrument || !newLead.source) {
      toast.error("Please fill in all required fields");
      return;
    }
    addLeadMutation.mutate(newLead);
    setAddDialogOpen(false);
    setNewLead({
      name: "",
      email: "",
      phone: "",
      instrument: "",
      source: "",
      stage: "new",
      notes: ""
    });
  };
  const handleOpenEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setEditDialogOpen(true);
  };
  const updateLeadMutation = useMutation({
    mutationFn: async (updatedLead: Lead) => {
      const stageMap: Record<string, string> = {
        'new': 'new',
        'contacted': 'contacted',
        'qualified': 'qualified',
        'converted': 'converted',
        'lost': 'lost'
      };
      const {
        error
      } = await supabase.from('crm_leads').update({
        name: updatedLead.name,
        email: updatedLead.email,
        phone: updatedLead.phone,
        stage: stageMap[updatedLead.stage] as any,
        source: updatedLead.source,
        notes: `${updatedLead.instrument}: ${updatedLead.notes}`
      }).eq('id', updatedLead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
      toast.success("Lead updated successfully!");
    }
  });
  const handleSaveEdit = () => {
    if (!editingLead?.name || !editingLead?.email || !editingLead?.phone || !editingLead?.instrument || !editingLead?.source) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateLeadMutation.mutate(editingLead);
    setEditDialogOpen(false);
    setEditingLead(null);
  };
  const handleDragStart = (event: DragStartEvent) => {
    const {
      active
    } = event;
    const lead = active.data.current?.lead as Lead;
    setActiveLead(lead);
  };
  const updateStageMutation = useMutation({
    mutationFn: async ({
      leadId,
      newStage
    }: {
      leadId: string;
      newStage: string;
    }) => {
      const stageMap: Record<string, string> = {
        'new': 'new',
        'contacted': 'contacted',
        'qualified': 'qualified',
        'converted': 'converted',
        'lost': 'lost'
      };
      const {
        error
      } = await supabase.from('crm_leads').update({
        stage: stageMap[newStage] as any
      }).eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
    }
  });
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    setActiveLead(null);
    if (!over) return;
    const leadId = active.id.toString().replace('lead-', '');
    const newStage = over.id.toString();
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.stage !== newStage) {
      updateStageMutation.mutate({
        leadId: lead.id,
        newStage
      });
      toast.success(`${lead.name} moved to ${stages.find(s => s.id === newStage)?.label}`);
    }
  };
  const hasSelection = selectedLeads.length > 0;
  return <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">CRM & Leads</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage prospects and student recruitment</p>
          </div>
          <div className="flex gap-2">
            <DataImport type="leads" onSuccess={() => queryClient.invalidateQueries({ queryKey: ['crm-leads'] })} />
            <Button className="gradient-primary text-primary-foreground shadow-primary w-full sm:w-auto" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Add Lead Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md w-full mx-4">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Name *</Label>
                <Input id="name" className="h-11 md:h-10" value={newLead.name} onChange={e => setNewLead({
                ...newLead,
                name: e.target.value
              })} placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email *</Label>
                <Input id="email" type="email" className="h-11 md:h-10" value={newLead.email} onChange={e => setNewLead({
                ...newLead,
                email: e.target.value
              })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Phone *</Label>
                <Input id="phone" className="h-11 md:h-10" value={newLead.phone} onChange={e => setNewLead({
                ...newLead,
                phone: e.target.value
              })} placeholder="+233 24 000 0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instrument" className="text-sm">Instrument *</Label>
                <Select value={newLead.instrument} onValueChange={value => setNewLead({
                ...newLead,
                instrument: value
              })}>
                  <SelectTrigger className="h-11 md:h-10">
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
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
                <Select value={newLead.source} onValueChange={value => setNewLead({
                ...newLead,
                source: value
              })}>
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
                <Select value={newLead.stage} onValueChange={value => setNewLead({
                ...newLead,
                stage: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Lead</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={newLead.notes} onChange={e => setNewLead({
                ...newLead,
                notes: e.target.value
              })} placeholder="Add any relevant notes..." rows={3} />
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
            {editingLead && <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input id="edit-name" value={editingLead.name} onChange={e => setEditingLead({
                ...editingLead,
                name: e.target.value
              })} placeholder="Enter full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input id="edit-email" type="email" value={editingLead.email} onChange={e => setEditingLead({
                ...editingLead,
                email: e.target.value
              })} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone *</Label>
                  <Input id="edit-phone" value={editingLead.phone} onChange={e => setEditingLead({
                ...editingLead,
                phone: e.target.value
              })} placeholder="+233 24 000 0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-instrument">Instrument *</Label>
                  <Select value={editingLead.instrument} onValueChange={value => setEditingLead({
                ...editingLead,
                instrument: value
              })}>
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
                  <Select value={editingLead.source} onValueChange={value => setEditingLead({
                ...editingLead,
                source: value
              })}>
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
                  <Select value={editingLead.stage} onValueChange={value => setEditingLead({
                ...editingLead,
                stage: value
              })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Lead</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" value={editingLead.notes} onChange={e => setEditingLead({
                ...editingLead,
                notes: e.target.value
              })} placeholder="Add any relevant notes..." rows={3} />
                </div>
              </div>}
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
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {stages.map((stage, index) => {
          const count = getLeadsByStage(stage.id).length;
          return <Card key={stage.id} className={`shadow-card border-l-4 animate-scale-in`} style={{
            borderLeftColor: `${stage.color.replace("bg-", "var(--")}`,
            animationDelay: `${index * 0.1}s`
          }}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">{stage.label}</p>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">{count}</h3>
                    </div>
                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full ${stage.color}/10 flex items-center justify-center`}>
                      <UserPlus className={`h-5 w-5 md:h-6 md:w-6 ${stage.color.replace("bg-", "text-")}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Search Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 md:h-10" />
            </div>
          </CardContent>
        </Card>
        {hasSelection && <Card className="shadow-card border border-primary/40">
            <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedLeads.length} lead{selectedLeads.length === 1 ? '' : 's'} selected
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAllLeads}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                  Clear
                </Button>
                <Button variant="secondary" size="sm" disabled={bulkArchiveMutation.isPending} onClick={handleBulkArchive}>
                  {bulkArchiveMutation.isPending ? 'Archiving...' : 'Archive Selected'}
                </Button>
                <Button variant="destructive" size="sm" disabled={bulkDeleteMutation.isPending} onClick={handleBulkDelete}>
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                </Button>
              </div>
            </CardContent>
          </Card>}

        {/* Pipeline Board */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stages.map((stage, stageIndex) => <DroppableStage key={stage.id} stage={stage} leads={getLeadsByStage(stage.id)} stageIndex={stageIndex} onArchive={handleArchiveLead} onDelete={handleDeleteLead} onEdit={handleOpenEditDialog} onContact={handleContactLead} lastContactTimes={lastContactTimes} selectedLeadIds={selectedLeads} onToggleSelect={handleToggleLeadSelection} onToggleStageSelect={handleToggleStageSelection} />)}
          </div>
          <DragOverlay>
            {activeLead ? <Card className="border-2 shadow-2xl opacity-90 cursor-grabbing">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-2">{activeLead.name}</h3>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{activeLead.email}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>;
}