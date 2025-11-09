import { useState } from "react";
import { Mail, Phone, Archive, ArchiveRestore, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const initialArchivedLeads = [
  {
    id: 101,
    name: "Sarah Williams",
    email: "sarah.w@email.com",
    phone: "+233 24 222 3333",
    stage: "contacted",
    instrument: "Violin",
    source: "Instagram Ad",
    notes: "Expressed interest but not ready to commit yet",
    lastContact: "2 weeks ago",
    archivedDate: "1 week ago",
  },
];

export default function ArchivedLeads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [archivedLeads] = useState(initialArchivedLeads);

  const filteredLeads = archivedLeads.filter((lead) =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.instrument.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Archived Leads</h1>
            <p className="text-muted-foreground">View and manage archived prospects</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Archive className="h-5 w-5" />
            <span className="text-2xl font-bold">{archivedLeads.length}</span>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search archived leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Archived Leads List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead, index) => (
            <Card
              key={lead.id}
              className="border-2 hover:shadow-lg transition-all animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{lead.name}</span>
                  <Badge variant="outline" className="text-muted-foreground">
                    Archived
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {lead.phone}
                  </div>
                </div>

                <div className="space-y-2">
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
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Archived:</span>
                    <span className="font-medium">{lead.archivedDate}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {lead.notes}
                </p>

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                >
                  <ArchiveRestore className="h-3 w-3 mr-2" />
                  Restore Lead
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Archived Leads</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No leads match your search criteria" : "You haven't archived any leads yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
