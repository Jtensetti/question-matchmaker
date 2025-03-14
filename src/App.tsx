
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentAnswer from "./pages/StudentAnswer";
import ThankYou from "./pages/ThankYou";
import Dashboard from "./pages/Dashboard";
import TestTaking from "./pages/TestTaking";
import TestThankYou from "./pages/TestThankYou";
import TestDashboard from "./pages/TestDashboard";
import ResetPassword from "./pages/ResetPassword";
import TestResetEmail from "./pages/TestResetEmail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/student/:questionId" element={<StudentAnswer />} />
          <Route path="/thank-you/:questionId" element={<ThankYou />} />
          <Route path="/dashboard/:questionId" element={<Dashboard />} />
          <Route path="/test/:testId" element={<TestTaking />} />
          <Route path="/test-thank-you/:testId" element={<TestThankYou />} />
          <Route path="/test-dashboard/:testId" element={<TestDashboard />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/test-reset-email" element={<TestResetEmail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
