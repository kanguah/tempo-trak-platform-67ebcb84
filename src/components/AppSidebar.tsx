import { useState } from "react";
import { LayoutDashboard, Users, UserCheck, Calendar, ClipboardCheck, CreditCard, Megaphone, MessageSquare, TrendingUp, FileText, Bell, Settings, Music, Archive, TrendingDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
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
  const [isHovered, setIsHovered] = useState(false);
  return <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className="relative">
      <Sidebar className={`border-r border-sidebar-border transition-all duration-300 ${isHovered ? 'w-64' : 'w-16'}`}>
      <SidebarHeader className={`border-b border-sidebar-border transition-all duration-300 ${isHovered ? 'p-6' : 'p-3'}`}>
        <div className="flex items-center gap-3">
          
          {isHovered && <div>
            <h2 className="text-lg font-bold text-sidebar-foreground whitespace-nowrap">49ice Academy</h2>
            <p className="text-xs text-sidebar-foreground/70 whitespace-nowrap">Music Management</p>
          </div>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {isHovered && <SidebarGroupLabel className="text-sidebar-foreground/60">Main Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {directorItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className={`flex items-center rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isHovered ? 'gap-3 px-3 py-2' : 'justify-center p-3'}`} activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {isHovered && <span className="whitespace-nowrap">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {isHovered && <SidebarGroupLabel className="text-sidebar-foreground/60">System</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={`flex items-center rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isHovered ? 'gap-3 px-3 py-2' : 'justify-center p-3'}`} activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {isHovered && <span className="whitespace-nowrap">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-sidebar-border transition-all duration-300 ${isHovered ? 'p-4' : 'p-2'}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-accent flex-shrink-0 ${isHovered ? '' : 'mx-auto'}`}>
            <span className="text-xs font-bold text-accent-foreground">DA</span>
          </div>
          {isHovered && <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Director Admin</p>
            <p className="truncate text-xs text-sidebar-foreground/60">director@49ice.com</p>
          </div>}
        </div>
      </SidebarFooter>
    </Sidebar>
    </div>;
}