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
import OrganizationSettings from "./pages/OrganizationSettings";
import Billing from "./pages/Billing";
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

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { needsOnboarding, isLoading } = useOrganization();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!needsOnboarding) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { needsOnboarding, isLoading } = useOrganization();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <OrganizationProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
            <Route path="/" element={<AppRoute><Layout><Dashboard /></Layout></AppRoute>} />
            <Route path="/students" element={<AppRoute><Layout><Students /></Layout></AppRoute>} />
            <Route path="/students/:id" element={<AppRoute><Layout><StudentProfile /></Layout></AppRoute>} />
            <Route path="/tutors" element={<AppRoute><Layout><Tutors /></Layout></AppRoute>} />
            <Route path="/tutors/:id" element={<AppRoute><Layout><TutorProfile /></Layout></AppRoute>} />
            <Route path="/staff" element={<AppRoute><Layout><Staff /></Layout></AppRoute>} />
            <Route path="/staff/:id" element={<AppRoute><Layout><StaffProfile /></Layout></AppRoute>} />
            <Route path="/calendar" element={<AppRoute><Layout><Calendar /></Layout></AppRoute>} />
            <Route path="/attendance" element={<AppRoute><Layout><Attendance /></Layout></AppRoute>} />
            <Route path="/payments" element={<AppRoute><Layout><Payments /></Layout></AppRoute>} />
            <Route path="/crm" element={<AppRoute><Layout><CRM /></Layout></AppRoute>} />
            <Route path="/archived-leads" element={<AppRoute><Layout><ArchivedLeads /></Layout></AppRoute>} />
            <Route path="/messaging" element={<AppRoute><Layout><Messaging /></Layout></AppRoute>} />
            <Route path="/expenses" element={<AppRoute><AdminRoute><Layout><Expenses /></Layout></AdminRoute></AppRoute>} />
            <Route path="/payroll" element={<AppRoute><AdminRoute><Layout><Payroll /></Layout></AdminRoute></AppRoute>} />
            <Route path="/analytics" element={<AppRoute><AdminRoute><Layout><Analytics /></Layout></AdminRoute></AppRoute>} />
            <Route path="/reports" element={<AppRoute><AdminRoute><Layout><Reports /></Layout></AdminRoute></AppRoute>} />
            <Route path="/notifications" element={<AppRoute><Layout><Notifications /></Layout></AppRoute>} />
            <Route path="/settings" element={<AppRoute><Layout><Settings /></Layout></AppRoute>} />
            <Route path="/organization-settings" element={<AppRoute><Layout><OrganizationSettings /></Layout></AppRoute>} />
            <Route path="/billing" element={<AppRoute><Layout><Billing /></Layout></AppRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
