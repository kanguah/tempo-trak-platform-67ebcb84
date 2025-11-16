import { useState } from "react";
import { LayoutDashboard, Users, UserCheck, Briefcase, Calendar, ClipboardCheck, CreditCard, DollarSign, Megaphone, MessageSquare, TrendingUp, FileText, Bell, Settings, Music, Archive, TrendingDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
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
  title: "Settings",
  url: "/settings",
  icon: Settings
}];
export function AppSidebar() {
  const {
    open
  } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const {
    isAdmin,
    isLoading
  } = useAdmin();
  const {
    user
  } = useAuth();

  // When sidebar is open (fully expanded), no hover needed
  // When sidebar is closed (mini mode), enable hover to expand
  const showExpanded = open || isHovered;

  // Filter director items based on admin status
  const filteredDirectorItems = directorItems.filter(item => {
    if (item.title === "Payroll" || item.title === "Staff") {
      return user && !isLoading && isAdmin;
    }
    return true;
  });
  return <div onMouseEnter={() => !open && setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className="relative">
      <Sidebar collapsible="icon" className={`border-r border-sidebar-border transition-all duration-300 ${showExpanded ? 'w-64' : 'w-16'}`}>
        {/* Header: School Management title */}
        <SidebarHeader className={`px-4 py-4 transition-all ${showExpanded ? 'text-left' : 'text-center'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold ${showExpanded ? '' : 'mx-auto'}`}>
              SM
            </div>
            {showExpanded && <div>
              <div className="text-sm font-semibold text-sidebar-foreground">School Management</div>
              <div className="text-xs text-sidebar-foreground/60">Admin Dashboard</div>
            </div>}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            {showExpanded && <SidebarGroupLabel className="text-sidebar-foreground/60">Main Menu</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredDirectorItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end={item.url === "/"} className={`flex items-center rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${showExpanded ? 'gap-3 px-3 py-2' : 'justify-center p-3'}`} activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {showExpanded && <span className="whitespace-nowrap">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            {showExpanded && <SidebarGroupLabel className="text-sidebar-foreground/60">System</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={`flex items-center rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${showExpanded ? 'gap-3 px-3 py-2' : 'justify-center p-3'}`} activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {showExpanded && <span className="whitespace-nowrap">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className={`border-t border-sidebar-border transition-all duration-300 ${showExpanded ? 'p-4' : 'p-2'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-accent flex-shrink-0 ${showExpanded ? '' : 'mx-auto'}`}>
              <span className="text-xs font-bold text-accent-foreground">DA</span>
            </div>
            {showExpanded && <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Director Admin</p>
                <p className="truncate text-xs text-sidebar-foreground/60">director@49ice.com</p>
              </div>}
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>;
}