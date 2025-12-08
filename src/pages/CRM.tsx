import { useState, useEffect } from "react";
import { Plus, Mail, Phone, MessageSquare, UserPlus, Search, Archive, GripVertical, Trash2, Sparkles, Phone as PhoneIcon, CheckCircle, TrendingUp, XCircle } from "lucide-react";
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
import { createNotification } from "@/hooks/useNotifications";

const stages = [{
  id: "new",
  label: "New Leads",
  color: "bg-[hsl(340,60%,65%)]"
}, {
  id: "contacted",
  label: "Contacted",
  color: "bg-[hsl(15,95%,75%)]"
}, {
  id: "qualified",
  label: "Qualified",
  color: "bg-[hsl(265,65%,72%)]"
}, {
  id: "converted",
  label: "Converted",
  color: "bg-[hsl(170,65%,55%)]"
}, {
  id: "lost",
  label: "Lost",
  color: "bg-[hsl(220,50%,72%)]"
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
      <CardContent className="p-2 md:p-3">
        <div className="flex items-start gap-2 mb-2">
          <div onClick={e => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={checked => onToggleSelect(lead.id, checked === true)} className="mt-1" aria-label={`Select ${lead.name}`} />
          </div>
          <div {...listeners} {...attributes} className="touch-none mt-1">
            <GripVertical className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-xs md:text-sm text-foreground flex-1 truncate">{lead.name}</h3>
          <div className="flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground hover:text-foreground" 
              onClick={e => {
                e.stopPropagation();
                onArchive(lead.id);
              }}
            >
              <Archive className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground hover:text-destructive" 
              onClick={e => {
                e.stopPropagation();
                onDelete(lead.id);
              }}
            >
              <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
          </div>
        </div>
        

        

        

        <div className="flex gap-1.5 mb-2">
          <Button size="sm" variant="outline" className="flex-1 h-7 md:h-8 text-[10px] md:text-xs px-2" onClick={e => {
          e.stopPropagation();
          document.location.href = `tel:+233${lead.phone}`;
          toast.success(`Calling ${lead.name}...`);
          onContact(lead, 'call');
        }}>
            <Phone className="h-2.5 w-2.5 md:h-3 md:w-3" />
            <span className="hidden sm:inline ml-1">Call</span>
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7 md:h-8 text-[10px] md:text-xs px-2" onClick={e => {
          e.stopPropagation();
          window.location.href = `mailto:${lead.email}?subject=Follow up - ${lead.instrument} Lessons`;
          onContact(lead, 'email');
        }}>
            <Mail className="h-2.5 w-2.5 md:h-3 md:w-3" />
            <span className="hidden sm:inline ml-1">Email</span>
          </Button>
        </div>
          <div className=" flex justify-between gap-1 text-[9px] md:text-xs">
        <span className="text-muted-foreground truncate">Added {lead.createdAt}</span>
        <span className="text-muted-foreground truncate">Last: {lastContactedAt || lead.lastContact || 'Not yet'}</span>
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
  return <Card className={`shadow-card animate-slide-up transition-all flex flex-col max-h-[70vh] md:max-h-[80vh] overflow-hidden ${isOver ? 'ring-2 ring-primary' : ''}`} style={{
    animationDelay: `${stageIndex * 0.1}s`
  }}>
      <CardHeader className={`${stage.color} text-white rounded-t-lg p-3 md:p-4`}>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-sm md:text-base lg:text-lg flex items-center justify-between">
            <span className="truncate">{stage.label}</span>
            <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm ml-2">
              {leads.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2 text-xs md:text-sm">
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
      <CardContent ref={setNodeRef} className={`p-2 md:p-3 space-y-2 md:space-y-3 min-h-[200px] md:min-h-[300px] flex-1 overflow-y-auto transition-colors ${isOver ? 'bg-accent/50' : ''}`}>
        {leads.map((lead, index) => <DraggableLeadCard key={lead.id} lead={lead} index={index} stageIndex={stageIndex} onArchive={onArchive} onDelete={onDelete} onEdit={onEdit} onContact={onContact} lastContactedAt={lead.lastContact} isSelected={selectedLeadIds.includes(lead.id)} onToggleSelect={onToggleSelect} />)}

        {leads.length === 0 && <div className="text-center py-6 md:py-8 text-muted-foreground">
            <p className="text-xs md:text-sm">No leads in this stage</p>
            {isOver && <p className="text-sm mt-2">Drop here</p>}
          </div>}
      </CardContent>
    </Card>;
}
export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
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
      } = await supabase.from('crm_leads').select('*').in('stage', ['new', 'contacted', 'qualified', 'converted', 'lost']).order('created_at', {
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
        lastContact: lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleString() : 'Not yet',
        archived: lead.stage === 'lost',
        createdAt: new Date(lead.created_at).toLocaleDateString()
      }));
    },
    enabled: !!user
  });
  // Filter and search leads
  const filteredLeads = leads.filter(lead => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.phone?.toLowerCase().includes(searchLower) ||
      lead.instrument?.toLowerCase().includes(searchLower) ||
      lead.source?.toLowerCase().includes(searchLower) ||
      lead.notes?.toLowerCase().includes(searchLower);

    // Stage filter
    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;

    // Source filter
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

    return matchesSearch && matchesStage && matchesSource;
  });

  const getLeadsByStage = (stage: string) => {
    return filteredLeads.filter(lead => lead.stage === stage);
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
    setSelectedLeads(filteredLeads.map(lead => lead.id));
  };
  const handleClearSelection = () => setSelectedLeads([]);
  // Remove the local state syncing effect since we're using database now
  useEffect(() => {
    setSelectedLeads(prev => prev.filter(id => leads.some(lead => lead.id === id)));
  }, [leads]);
  const contactLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('crm_leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    }
  });

  const handleContactLead = (lead: Lead, _method: 'call' | 'email') => {
    contactLeadMutation.mutate(lead.id);
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
      toast.success("Lead added successfully!");
      if (user?.id) {
        createNotification(user.id, "lead_update", "New Lead Added", `${data.name} has been added to your CRM pipeline.`);
      }
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
      if (user?.id && editingLead) {
        createNotification(user.id, "lead_update", "Lead Updated", `${editingLead.name} has been updated.`);
      }
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['crm-leads']
      });
      
      // Create notification for stage changes, especially conversions
      if (user?.id && variables.newStage === 'converted') {
        const lead = leads.find(l => l.id === variables.leadId);
        if (lead) {
          createNotification(user.id, "lead_update", "Lead Converted", `${lead.name} has been converted to a student!`);
        }
      }
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
      <div className="p-3 md:p-4 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">CRM & Leads</h1>
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground">Manage prospects and student recruitment</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DataImport type="leads" onSuccess={() => queryClient.invalidateQueries({ queryKey: ['crm-leads'] })} />
            <Button className="gradient-primary text-primary-foreground shadow-primary w-full sm:w-auto text-xs md:text-sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
              <span className="hidden sm:inline">Add Lead</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Add Lead Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md w-full mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4 py-3 md:py-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="name" className="text-xs md:text-sm">Name *</Label>
                <Input id="name" className="h-8 md:h-10 text-xs md:text-sm" value={newLead.name} onChange={e => setNewLead({
                ...newLead,
                name: e.target.value
              })} placeholder="Enter full name" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="email" className="text-xs md:text-sm">Email *</Label>
                <Input id="email" type="email" className="h-8 md:h-10 text-xs md:text-sm" value={newLead.email} onChange={e => setNewLead({
                ...newLead,
                email: e.target.value
              })} placeholder="email@example.com" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="phone" className="text-xs md:text-sm">Phone *</Label>
                <Input id="phone" className="h-8 md:h-10 text-xs md:text-sm" value={newLead.phone} onChange={e => setNewLead({
                ...newLead,
                phone: e.target.value
              })} placeholder="+233 24 000 0000" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="instrument" className="text-xs md:text-sm">Instrument *</Label>
                <Select value={newLead.instrument} onValueChange={value => setNewLead({
                ...newLead,
                instrument: value
              })}>
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
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
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="source" className="text-xs md:text-sm">Source *</Label>
                <Select value={newLead.source} onValueChange={value => setNewLead({
                ...newLead,
                source: value
              })}>
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
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
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="stage" className="text-xs md:text-sm">Stage</Label>
                <Select value={newLead.stage} onValueChange={value => setNewLead({
                ...newLead,
                stage: value
              })}>
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
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
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="notes" className="text-xs md:text-sm">Notes</Label>
                <Textarea id="notes" className="text-xs md:text-sm" value={newLead.notes} onChange={e => setNewLead({
                ...newLead,
                notes: e.target.value
              })} placeholder="Add any relevant notes..." rows={3} />
              </div>
            </div>
            <div className="flex gap-2 justify-end flex-wrap">
              <Button variant="outline" className="text-xs md:text-sm h-8 md:h-10" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="text-xs md:text-sm h-8 md:h-10" onClick={handleAddLead}>
                Add Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md w-full mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Edit Lead</DialogTitle>
            </DialogHeader>
            {editingLead && <div className="space-y-3 md:space-y-4 py-3 md:py-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="edit-name" className="text-xs md:text-sm">Name *</Label>
                  <Input id="edit-name" className="h-8 md:h-10 text-xs md:text-sm" value={editingLead.name} onChange={e => setEditingLead({
                ...editingLead,
                name: e.target.value
              })} placeholder="Enter full name" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="edit-email" className="text-xs md:text-sm">Email *</Label>
                  <Input id="edit-email" type="email" className="h-8 md:h-10 text-xs md:text-sm" value={editingLead.email} onChange={e => setEditingLead({
                ...editingLead,
                email: e.target.value
              })} placeholder="email@example.com" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="edit-phone" className="text-xs md:text-sm">Phone *</Label>
                  <Input id="edit-phone" className="h-8 md:h-10 text-xs md:text-sm" value={editingLead.phone} onChange={e => setEditingLead({
                ...editingLead,
                phone: e.target.value
              })} placeholder="+233 24 000 0000" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="edit-instrument" className="text-xs md:text-sm">Instrument *</Label>
                  <Select value={editingLead.instrument} onValueChange={value => setEditingLead({
                ...editingLead,
                instrument: value
              })}>
                    <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
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
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="edit-source" className="text-xs md:text-sm">Source *</Label>
                  <Select value={editingLead.source} onValueChange={value => setEditingLead({
                ...editingLead,
                source: value
              })}>
                    <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
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
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="edit-stage" className="text-xs md:text-sm">Stage</Label>
                  <Select value={editingLead.stage} onValueChange={value => setEditingLead({
                ...editingLead,
                stage: value
              })}>
                    <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
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
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="edit-notes" className="text-xs md:text-sm">Notes</Label>
                  <Textarea id="edit-notes" className="text-xs md:text-sm" value={editingLead.notes} onChange={e => setEditingLead({
                ...editingLead,
                notes: e.target.value
              })} placeholder="Add any relevant notes..." rows={3} />
                </div>
              </div>}
            <div className="flex gap-2 justify-end flex-wrap">
              <Button variant="outline" className="text-xs md:text-sm h-8 md:h-10" onClick={() => {
              setEditDialogOpen(false);
              setEditingLead(null);
            }}>
                Cancel
              </Button>
              <Button className="text-xs md:text-sm h-8 md:h-10" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Summary Cards */}
        <div className="grid gap-2 md:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {stages.map((stage, index) => {
          const count = getLeadsByStage(stage.id).length;
          
          // Get icon for each stage
          const getStageIcon = (stageId: string) => {
            switch(stageId) {
              case 'new':
                return <Sparkles className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${stage.color.replace("bg-", "text-")}`} />;
              case 'contacted':
                return <PhoneIcon className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${stage.color.replace("bg-", "text-")}`} />;
              case 'qualified':
                return <CheckCircle className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${stage.color.replace("bg-", "text-")}`} />;
              case 'converted':
                return <TrendingUp className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${stage.color.replace("bg-", "text-")}`} />;
              case 'lost':
                return <XCircle className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${stage.color.replace("bg-", "text-")}`} />;
              default:
                return <UserPlus className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${stage.color.replace("bg-", "text-")}`} />;
            }
          };
          
          return <Card key={stage.id} className={`shadow-card border-l-4 animate-scale-in`} style={{
            borderLeftColor: `${stage.color.replace("bg-", "var(--")}`,
            animationDelay: `${index * 0.1}s`
          }}>
                <CardContent className="p-3 md:p-4 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground mb-1">{stage.label}</p>
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{count}</h3>
                    </div>
                    <div className={`h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 rounded-full ${stage.color}/10 flex items-center justify-center flex-shrink-0`}>
                      {getStageIcon(stage.id)}
                    </div>
                  </div>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card">
          <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, phone..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-8 md:pl-10 h-8 md:h-10 text-xs md:text-sm" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="new">New Leads</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="Website Form">Website Form</SelectItem>
                  <SelectItem value="Facebook Ad">Facebook Ad</SelectItem>
                  <SelectItem value="Google Ad">Google Ad</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {hasSelection && <Card className="shadow-card border border-primary/40">
            <CardContent className="p-3 md:p-4 flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs md:text-sm text-muted-foreground">
                {selectedLeads.length} lead{selectedLeads.length === 1 ? '' : 's'} selected
              </p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Button variant="outline" size="sm" className="text-xs md:text-sm h-7 md:h-8" onClick={handleSelectAllLeads}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" className="text-xs md:text-sm h-7 md:h-8" onClick={handleClearSelection}>
                  Clear
                </Button>
                <Button variant="secondary" size="sm" className="text-xs md:text-sm h-7 md:h-8" disabled={bulkArchiveMutation.isPending} onClick={handleBulkArchive}>
                  {bulkArchiveMutation.isPending ? 'Archiving...' : 'Archive'}
                </Button>
                <Button variant="destructive" size="sm" className="text-xs md:text-sm h-7 md:h-8" disabled={bulkDeleteMutation.isPending} onClick={handleBulkDelete}>
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>}

        {/* Pipeline Board */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 overflow-x-auto">
            {stages.map((stage, stageIndex) => <DroppableStage key={stage.id} stage={stage} leads={getLeadsByStage(stage.id)} stageIndex={stageIndex} onArchive={handleArchiveLead} onDelete={handleDeleteLead} onEdit={handleOpenEditDialog} onContact={handleContactLead} selectedLeadIds={selectedLeads} onToggleSelect={handleToggleLeadSelection} onToggleStageSelect={handleToggleStageSelection} />)}
          </div>
          <DragOverlay>
            {activeLead ? <Card className="border-2 shadow-2xl opacity-90 cursor-grabbing">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-xs md:text-sm text-foreground mb-2">{activeLead.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 md:h-4 w-3 md:w-4" />
                        <span className="truncate text-xs md:text-sm">{activeLead.email}</span>
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