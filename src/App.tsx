import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import Tutors from "./pages/Tutors";
import TutorProfile from "./pages/TutorProfile";
import Calendar from "./pages/Calendar";
import Attendance from "./pages/Attendance";
import Payments from "./pages/Payments";
import CRM from "./pages/CRM";
import Messaging from "./pages/Messaging";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/tutors" element={<Tutors />} />
            <Route path="/tutors/:id" element={<TutorProfile />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
