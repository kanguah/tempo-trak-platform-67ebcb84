import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Users, UserCheck, Briefcase, Calendar, ClipboardCheck, CreditCard, DollarSign, Megaphone, MessageSquare, TrendingUp, FileText, Bell, Settings, Archive, TrendingDown, Receipt } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

export function AppSidebar() {
  const { open } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const { isAdmin, isLoading } = useAdmin();
  const { user } = useAuth();
  const { currentOrganization, isOrgOwner, terms } = useOrganization();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const trialDaysRemaining = currentOrganization?.trial_ends_at
    ? Math.max(0, differenceInDays(new Date(currentOrganization.trial_ends_at), new Date()))
    : 0;

  const isTrialActive = currentOrganization?.subscription_status === "trial" && trialDaysRemaining > 0;

  const directorItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: terms.students, url: "/students", icon: Users },
    { title: terms.tutors, url: "/tutors", icon: UserCheck },
    { title: "Staff", url: "/staff", icon: Briefcase },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
    { title: "Payments", url: "/payments", icon: CreditCard },
    { title: "Payroll", url: "/payroll", icon: DollarSign },
    { title: "CRM & Leads", url: "/crm", icon: Megaphone },
    { title: "Archive", url: "/archived-leads", icon: Archive },
    { title: "Messaging", url: "/messaging", icon: MessageSquare },
    { title: "Expenses", url: "/expenses", icon: TrendingDown },
    { title: "Business Analytics", url: "/analytics", icon: TrendingUp },
    { title: "Reports", url: "/reports", icon: FileText },
  ];

  const settingsItems = [
    { title: "Billing", url: "/billing", icon: Receipt },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentOrganization?.id) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, WEBP, or SVG image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5242880) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      if (currentOrganization.logo_url) {
        const oldPath = currentOrganization.logo_url.split('/').slice(-2).join('/');
        await supabase.storage.from('logos').remove([oldPath]);
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${currentOrganization.id}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', currentOrganization.id);

      if (updateError) throw updateError;

      toast({
        title: "Logo updated",
        description: "Your organization logo has been successfully uploaded.",
      });
      
      window.location.reload();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const showExpanded = open || isHovered;

  const filteredDirectorItems = directorItems.filter(item => {
    const adminOnlyPages = ["Payroll", "Staff", "Business Analytics", "Reports", "Expenses"];
    if (adminOnlyPages.includes(item.title)) {
      return user && !isLoading && isAdmin;
    }
    return true;
  });

  // Filter billing to only show to org owners
  const filteredSettingsItems = settingsItems.filter(item => {
    if (item.title === "Billing") {
      return isOrgOwner;
    }
    return true;
  });

  return (
    <div className="relative">
      <Sidebar collapsible="icon" className={`border-r border-sidebar-border transition-all duration-300 ${showExpanded ? 'w-64' : 'w-16'}`}>
        <SidebarHeader className={`px-4 py-4 transition-all ${showExpanded ? 'text-left' : 'text-center'}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {showExpanded ? (
            <div className="space-y-3">
              <OrganizationSwitcher />
              {isTrialActive && (
                <Badge variant="secondary" className="w-full justify-center bg-yellow-100 text-yellow-800 text-xs">
                  Trial: {trialDaysRemaining} days left
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogoClick}
                disabled={uploading}
                className={`h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold transition-all hover:bg-primary/20 cursor-pointer flex-shrink-0 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Click to upload logo"
              >
                {currentOrganization?.logo_url ? (
                  <img src={currentOrganization.logo_url} alt="Logo" className="h-full w-full rounded-md object-contain" />
                ) : (
                  currentOrganization?.name?.charAt(0) || 'O'
                )}
              </button>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            {showExpanded && <SidebarGroupLabel className="text-sidebar-foreground/60">Main Menu</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredDirectorItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={`flex items-center rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${showExpanded ? 'gap-3 px-3 py-2' : 'justify-center p-3'}`} 
                        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {showExpanded && <span className="whitespace-nowrap">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            {showExpanded && <SidebarGroupLabel className="text-sidebar-foreground/60">System</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${showExpanded ? 'gap-3 px-3 py-2' : 'justify-center p-3'}`} 
                        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {showExpanded && <span className="whitespace-nowrap">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className={`border-t border-sidebar-border transition-all duration-300 ${showExpanded ? 'p-4' : 'p-2'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-accent flex-shrink-0 ${showExpanded ? '' : 'mx-auto'}`}>
              <span className="text-xs font-bold text-accent-foreground">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {showExpanded && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {currentOrganization?.name || 'Organization'}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
