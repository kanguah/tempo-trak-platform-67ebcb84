import { useState, useEffect } from "react";
import { Check, Search, User, Users, GraduationCap, Briefcase } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Recipient {
  id: string;
  name: string;
  contact: string;
  type: string;
}

interface IndividualRecipientSelectorProps {
  channel: "email" | "sms";
  onRecipientsChange: (recipients: any[], recipientType: string) => void;
}

export default function IndividualRecipientSelector({ 
  channel, 
  onRecipientsChange 
}: IndividualRecipientSelectorProps) {
  const { user } = useAuth();
  const [recipientType, setRecipientType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [availableRecipients, setAvailableRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipientType && user) {
      fetchRecipients();
    } else {
      setAvailableRecipients([]);
    }
  }, [recipientType, user]);

  useEffect(() => {
    // Convert selected recipients to the format expected by the parent
    const formattedRecipients = selectedRecipients.map(r => ({
      id: r.id,
      name: r.name,
      contact: r.contact,
      type: r.type,
    }));
    onRecipientsChange(formattedRecipients, recipientType);
    
  }, [selectedRecipients, recipientType]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      let recipients: Recipient[] = [];

      switch (recipientType) {
        case "students":
          const { data: students } = await supabase
            .from("students")
            .select("id, name, email, phone")
            .eq("user_id", user?.id)
            .eq("status", "active");
          
          recipients = (students || []).map(s => ({
            id: s.id,
            name: s.name,
            contact: channel === "email" ? s.email || "" : s.phone || "",
            type: "student",
          })).filter(r => r.contact);
          break;

        case "parents":
          const { data: parents } = await supabase
            .from("students")
            .select("id, parent_name, parent_email, parent_phone")
            .eq("user_id", user?.id)
            .eq("status", "active")
            .not("parent_name", "is", null);
          
          recipients = (parents || []).map(p => ({
            id: p.id,
            name: p.parent_name || "",
            contact: channel === "email" ? p.parent_email || "" : p.parent_phone || "",
            type: "parent",
          })).filter(r => r.contact && r.name);
          break;

        case "tutors":
          const { data: tutors } = await supabase
            .from("tutors")
            .select("id, name, email, phone")
            .eq("user_id", user?.id)
            .eq("status", "active");
          
          recipients = (tutors || []).map(t => ({
            id: t.id,
            name: t.name,
            contact: channel === "email" ? t.email || "" : t.phone || "",
            type: "tutor",
          })).filter(r => r.contact);
          break;

        case "staff":
          const { data: staff } = await supabase
            .from("staff")
            .select("id, name, email, phone")
            .eq("user_id", user?.id)
            .eq("status", "active");
          
          recipients = (staff || []).map(s => ({
            id: s.id,
            name: s.name,
            contact: channel === "email" ? s.email || "" : s.phone || "",
            type: "staff",
          })).filter(r => r.contact);
          break;
      }

      setAvailableRecipients(recipients);
    } catch (error) {
      console.error("Error fetching recipients:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (recipient: Recipient) => {
    setSelectedRecipients(prev => {
      const isSelected = prev.some(r => r.id === recipient.id && r.type === recipient.type);
      if (isSelected) {
        return prev.filter(r => !(r.id === recipient.id && r.type === recipient.type));
      } else {
        return [...prev, recipient];
      }
    });
  };

  const removeRecipient = (recipient: Recipient) => {
    setSelectedRecipients(prev => 
      prev.filter(r => !(r.id === recipient.id && r.type === recipient.type))
    );
  };

  const filteredRecipients = availableRecipients.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "student":
        return <GraduationCap className="h-3 w-3" />;
      case "parent":
        return <Users className="h-3 w-3" />;
      case "tutor":
        return <User className="h-3 w-3" />;
      case "staff":
        return <Briefcase className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">Recipient Type</Label>
        <Select value={recipientType} onValueChange={setRecipientType}>
          <SelectTrigger className="h-11 md:h-10">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="students">Students</SelectItem>
            <SelectItem value="parents">Parents</SelectItem>
            <SelectItem value="tutors">Tutors</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recipientType && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <Card className="max-h-[200px] overflow-y-auto">
                <CardContent className="p-2">
                  {filteredRecipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recipients found
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredRecipients.map((recipient) => (
                        <button
                          key={`${recipient.type}-${recipient.id}`}
                          onClick={() => toggleRecipient(recipient)}
                          className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getTypeIcon(recipient.type)}
                            <div className="flex flex-col items-start min-w-0">
                              <span className="text-sm font-medium truncate">{recipient.name}</span>
                              <span className="text-xs text-muted-foreground truncate">{recipient.contact}</span>
                            </div>
                          </div>
                          {selectedRecipients.some(r => r.id === recipient.id && r.type === recipient.type) && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedRecipients.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Selected ({selectedRecipients.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipients.map((recipient) => (
                      <Badge
                        key={`${recipient.type}-${recipient.id}`}
                        variant="secondary"
                        className="gap-1"
                      >
                        {getTypeIcon(recipient.type)}
                        <span className="max-w-[150px] truncate">{recipient.name}</span>
                        <button
                          onClick={() => removeRecipient(recipient)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
