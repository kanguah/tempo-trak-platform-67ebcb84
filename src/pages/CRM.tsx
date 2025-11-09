import { useState } from "react";
import { Plus, Mail, Phone, MessageSquare, UserPlus, Search, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [leads, setLeads] = useState(initialLeads);

  const getLeadsByStage = (stage: string) => {
    return leads.filter((lead) => lead.stage === stage && !lead.archived);
  };

  const handleArchiveLead = (leadId: number) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, archived: true } : lead
    ));
  };

  const getStageBadge = (stage: string) => {
    const stageInfo = stages.find((s) => s.id === stage);
    if (!stageInfo) return null;

    return (
      <Badge className={`${stageInfo.color} text-white`}>
        {stageInfo.label}
      </Badge>
    );
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
          <Button className="gradient-primary text-primary-foreground shadow-primary">
            <Plus className="mr-2 h-5 w-5" />
            Add Lead
          </Button>
        </div>

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
        <div className="grid gap-6 md:grid-cols-3">
          {stages.map((stage, stageIndex) => (
            <Card key={stage.id} className="shadow-card animate-slide-up" style={{ animationDelay: `${stageIndex * 0.1}s` }}>
              <CardHeader className={`${stage.color} text-white rounded-t-lg`}>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{stage.label}</span>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {getLeadsByStage(stage.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {getLeadsByStage(stage.id).map((lead, index) => (
                  <Card
                    key={lead.id}
                    className="border-2 hover:shadow-lg transition-all cursor-pointer animate-scale-in"
                    style={{ animationDelay: `${(stageIndex * 0.1) + (index * 0.05)}s` }}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-bold text-foreground mb-2">{lead.name}</h3>
                      
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
                        <Button size="sm" variant="outline" className="flex-1">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      </div>

                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => handleArchiveLead(lead.id)}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {getLeadsByStage(stage.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No leads in this stage</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
