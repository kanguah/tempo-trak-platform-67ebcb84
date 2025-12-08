import { useState } from "react";
import { Mail, Phone, Archive, ArchiveRestore, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ArchivedLeads() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: archivedLeads = [], isLoading } = useQuery({
    queryKey: ['archived-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('user_id', user?.id)
        .eq('stage', 'lost')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || "",
        instrument: lead.notes?.split(":")[0] || "",
        source: lead.source || "",
        notes: lead.notes || "",
        lastContact: new Date(lead.created_at).toLocaleDateString(),
        archivedDate: new Date(lead.updated_at).toLocaleDateString(),
        originalStage: lead.original_stage || 'new',
      }));
    },
    enabled: !!user,
  });

  const restoreLeadMutation = useMutation({
    mutationFn: async ({ leadId, originalStage }: { leadId: string; originalStage: string }) => {
      const { error } = await supabase
        .from('crm_leads')
        .update({ 
          stage: originalStage as any,
          original_stage: null
        })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['archived-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      const lead = archivedLeads.find((l: any) => l.id === leadId);
      toast.success(`${lead?.name} restored successfully`);
    },
    onError: () => {
      toast.error("Failed to restore lead");
    },
  });

  const handleRestoreLead = (leadId: string, originalStage: string) => {
    restoreLeadMutation.mutate({ leadId, originalStage });
  };

  const filteredLeads = archivedLeads.filter((lead: any) =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.instrument.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Archived Leads</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-3 md:p-4 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">Archived Leads</h1>
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground">View and manage archived prospects</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
            <Archive className="h-4 md:h-5 w-4 md:w-5" />
            <span className="text-xl md:text-2xl font-bold">{archivedLeads.length}</span>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="shadow-card">
          <CardContent className="p-3 md:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground" />
              <Input
                placeholder="Search archived leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 md:pl-10 h-8 md:h-10 text-xs md:text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Archived Leads List */}
        <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead: any, index: number) => (
            <Card
              key={lead.id}
              className="border-2 hover:shadow-lg transition-all animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
                <CardTitle className="text-sm md:text-base lg:text-lg flex items-start justify-between gap-2">
                  <span className="truncate flex-1">{lead.name}</span>
                  <Badge variant="outline" className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                    Archived
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 md:space-y-3 p-3 md:p-4">
                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  {lead.email && <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>}
                  {lead.phone && <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                    <span className="truncate">{lead.phone}</span>
                  </div>}
                </div>

                <div className="space-y-1.5 md:space-y-2 text-xs">
                  {lead.instrument && <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Instrument:</span>
                    <Badge variant="outline" className="text-xs md:text-sm">{lead.instrument}</Badge>
                  </div>}
                  {lead.source && <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium text-xs md:text-sm">{lead.source}</span>
                  </div>}
                  {lead.lastContact && <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Last Contact:</span>
                    <span className="font-medium text-xs md:text-sm">{lead.lastContact}</span>
                  </div>}
                  {lead.archivedDate && <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Archived:</span>
                    <span className="font-medium text-xs md:text-sm">{lead.archivedDate}</span>
                  </div>}
                </div>

                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                  {lead.notes}
                </p>

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs md:text-sm h-8 md:h-10 mt-2 md:mt-3"
                  onClick={() => handleRestoreLead(lead.id, lead.originalStage)}
                  disabled={restoreLeadMutation.isPending}
                >
                  <ArchiveRestore className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
                  {restoreLeadMutation.isPending ? "Restoring..." : "Restore"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-6 md:p-8 lg:p-12 text-center">
              <Archive className="h-8 md:h-10 lg:h-12 w-8 md:w-10 lg:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">No Archived Leads</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {searchQuery ? "No leads match your search criteria" : "You haven't archived any leads yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
