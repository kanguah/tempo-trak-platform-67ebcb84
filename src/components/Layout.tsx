import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, PanelLeftClose } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isHidden, setIsHidden] = useState(false);
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {!isHidden && <AppSidebar />}
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6 z-10">
            <div className="flex items-center gap-2 flex-1">
              {!isHidden && <SidebarTrigger />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHidden(!isHidden)}
                title={isHidden ? "Show sidebar" : "Hide sidebar"}
                className="h-9 w-9 md:h-10 md:w-auto md:px-3"
              >
                <PanelLeftClose className={`h-4 w-4 transition-transform ${isHidden ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline truncate max-w-[150px] md:max-w-none">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="h-9 md:h-10">
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Sign Out</span>
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div key={location.pathname} className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
