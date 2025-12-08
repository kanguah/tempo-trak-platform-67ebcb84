import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Users, UserCheck, Briefcase, Calendar, ClipboardCheck, CreditCard, DollarSign, Megaphone, MessageSquare, TrendingUp, FileText, Bell, Settings, Archive, TrendingDown, Building2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const directorItems = [{
  title: "Dashboard",
  url: "/",
  icon: LayoutDashboard
}, {
  title: "Students",
  url: "/students",
  icon: Users
}, {
  title: "Tutors",
  url: "/tutors",
  icon: UserCheck
}, {
  title: "Staff",
  url: "/staff",
  icon: Briefcase
}, {
  title: "Calendar",
  url: "/calendar",
  icon: Calendar
}, {
  title: "Attendance",
  url: "/attendance",
  icon: ClipboardCheck
}, {
  title: "Payments",
  url: "/payments",
  icon: CreditCard
}, {
  title: "Payroll",
  url: "/payroll",
  icon: DollarSign
}, {
  title: "CRM & Leads",
  url: "/crm",
  icon: Megaphone
}, {
  title: "Archive",
  url: "/archived-leads",
  icon: Archive
}, {
  title: "Messaging",
  url: "/messaging",
  icon: MessageSquare
}, {
  title: "Expenses",
  url: "/expenses",
  icon: TrendingDown
}, {
  title: "Business Analytics",
  url: "/analytics",
  icon: TrendingUp
}, {
  title: "Reports",
  url: "/reports",
  icon: FileText
}];

const settingsItems = [{
  title: "Notifications",
  url: "/notifications",
  icon: Bell
}, {
  title: "Organization",
  url: "/organization-settings",
  icon: Building2
}, {
  title: "Settings",
  url: "/settings",
  icon: Settings
}];

export function AppSidebar() {
  const { open } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const { isAdmin, isLoading } = useAdmin();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !currentOrganization) return;

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
      const fileExt = file.name.split('.').pop();
      const filePath = `organizations/${currentOrganization.id}-logo.${fileExt}`;
      
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
        description: "Your organization logo has been updated.",
      });
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

  return (
    <div className="relative">
      <Sidebar collapsible="icon" className={`border-r border-sidebar-border transition-all duration-300 ${showExpanded ? 'w-64' : 'w-16'}`}>
        <SidebarHeader className={`px-2 py-3 transition-all`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
          <OrganizationSwitcher collapsed={!showExpanded} />
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
                {settingsItems.map(item => (
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
                  {currentOrganization?.name || 'My Organization'}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
