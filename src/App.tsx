import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Budget from "./pages/Budget";
import Savings from "./pages/Savings";
import Debts from "./pages/Debts";
import Investments from "./pages/Investments";
import Goals from "./pages/Goals";
import Education from "./pages/Education";
import Income from "./pages/Income";
import Reports from "./pages/Reports";
import Community from "./pages/Community";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import News from "./pages/News";
import Calculators from "./pages/Calculators";
import Prices from "./pages/Prices";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/budget" element={
              <ProtectedRoute><Budget /></ProtectedRoute>
            } />
            <Route path="/savings" element={
              <ProtectedRoute><Savings /></ProtectedRoute>
            } />
            <Route path="/debts" element={
              <ProtectedRoute><Debts /></ProtectedRoute>
            } />
            <Route path="/investments" element={
              <ProtectedRoute><Investments /></ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute><Goals /></ProtectedRoute>
            } />
            <Route path="/education" element={
              <ProtectedRoute><Education /></ProtectedRoute>
            } />
            <Route path="/income" element={
              <ProtectedRoute><Income /></ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute><Reports /></ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute><Community /></ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute><Marketplace /></ProtectedRoute>
            } />
            <Route path="/news" element={
              <ProtectedRoute><News /></ProtectedRoute>
            } />
            <Route path="/calculators" element={
              <ProtectedRoute><Calculators /></ProtectedRoute>
            } />
            <Route path="/prices" element={
              <ProtectedRoute><Prices /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute><Admin /></ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
