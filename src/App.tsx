import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OrganizationProvider, useOrganization } from "./contexts/OrganizationContext";
import { Layout } from "@/components/Layout";
import { AdminRoute } from "@/components/AdminRoute";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import Tutors from "./pages/Tutors";
import TutorProfile from "./pages/TutorProfile";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
import Calendar from "./pages/Calendar";
import Attendance from "./pages/Attendance";
import Payments from "./pages/Payments";
import CRM from "./pages/CRM";
import ArchivedLeads from "./pages/ArchivedLeads";
import Messaging from "./pages/Messaging";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Expenses from "./pages/Expenses";
import NotFound from "./pages/NotFound";
import Payroll from "./pages/Payroll";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function OrganizationRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentOrganization, isLoading } = useOrganization();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  // If no organization, redirect to onboarding
  if (!currentOrganization) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
    <Route path="/billing" element={<OrganizationRoute><Layout><Billing /></Layout></OrganizationRoute>} />
    <Route path="/" element={<OrganizationRoute><Layout><Dashboard /></Layout></OrganizationRoute>} />
    <Route path="/students" element={<OrganizationRoute><Layout><Students /></Layout></OrganizationRoute>} />
    <Route path="/students/:id" element={<OrganizationRoute><Layout><StudentProfile /></Layout></OrganizationRoute>} />
    <Route path="/tutors" element={<OrganizationRoute><Layout><Tutors /></Layout></OrganizationRoute>} />
    <Route path="/tutors/:id" element={<OrganizationRoute><Layout><TutorProfile /></Layout></OrganizationRoute>} />
    <Route path="/staff" element={<OrganizationRoute><Layout><Staff /></Layout></OrganizationRoute>} />
    <Route path="/staff/:id" element={<OrganizationRoute><Layout><StaffProfile /></Layout></OrganizationRoute>} />
    <Route path="/calendar" element={<OrganizationRoute><Layout><Calendar /></Layout></OrganizationRoute>} />
    <Route path="/attendance" element={<OrganizationRoute><Layout><Attendance /></Layout></OrganizationRoute>} />
    <Route path="/payments" element={<OrganizationRoute><Layout><Payments /></Layout></OrganizationRoute>} />
    <Route path="/crm" element={<OrganizationRoute><Layout><CRM /></Layout></OrganizationRoute>} />
    <Route path="/archived-leads" element={<OrganizationRoute><Layout><ArchivedLeads /></Layout></OrganizationRoute>} />
    <Route path="/messaging" element={<OrganizationRoute><Layout><Messaging /></Layout></OrganizationRoute>} />
    <Route path="/expenses" element={<OrganizationRoute><AdminRoute><Layout><Expenses /></Layout></AdminRoute></OrganizationRoute>} />
    <Route path="/payroll" element={<OrganizationRoute><AdminRoute><Layout><Payroll /></Layout></AdminRoute></OrganizationRoute>} />
    <Route path="/analytics" element={<OrganizationRoute><AdminRoute><Layout><Analytics /></Layout></AdminRoute></OrganizationRoute>} />
    <Route path="/reports" element={<OrganizationRoute><AdminRoute><Layout><Reports /></Layout></AdminRoute></OrganizationRoute>} />
    <Route path="/notifications" element={<OrganizationRoute><Layout><Notifications /></Layout></OrganizationRoute>} />
    <Route path="/settings" element={<OrganizationRoute><Layout><Settings /></Layout></OrganizationRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <AppRoutes />
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
