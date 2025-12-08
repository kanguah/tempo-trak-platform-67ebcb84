import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { AdminRoute } from "@/components/AdminRoute";
import Auth from "./pages/Auth";
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

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/" replace />;
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
          <Routes>
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Layout><Students /></Layout></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute><Layout><StudentProfile /></Layout></ProtectedRoute>} />
            <Route path="/tutors" element={<ProtectedRoute><Layout><Tutors /></Layout></ProtectedRoute>} />
            <Route path="/tutors/:id" element={<ProtectedRoute><Layout><TutorProfile /></Layout></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute><Layout><Staff /></Layout></ProtectedRoute>} />
            <Route path="/staff/:id" element={<ProtectedRoute><Layout><StaffProfile /></Layout></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Layout><Calendar /></Layout></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Layout><Attendance /></Layout></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Layout><Payments /></Layout></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><Layout><CRM /></Layout></ProtectedRoute>} />
            <Route path="/archived-leads" element={<ProtectedRoute><Layout><ArchivedLeads /></Layout></ProtectedRoute>} />
            <Route path="/messaging" element={<ProtectedRoute><Layout><Messaging /></Layout></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><AdminRoute><Layout><Expenses /></Layout></AdminRoute></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute><AdminRoute><Layout><Payroll /></Layout></AdminRoute></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AdminRoute><Layout><Analytics /></Layout></AdminRoute></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><AdminRoute><Layout><Reports /></Layout></AdminRoute></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
