import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/auth/AuthGuard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Exam from "./pages/Exam";
import History from "./pages/History";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AptitudeTest from "./components/AptitudeTest";
import AIPage from "./pages/AI";
import TechnicalQuiz from './components/quiz/TechnicalQuiz';
import TechnicalTheoryExam from './components/exam/TechnicalTheoryExam';
import TechnicalCodingExam from './components/exam/TechnicalCodingExam';
import UnderConstruction from './components/UnderConstruction';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/dashboard" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/quiz" element={
              <AuthGuard>
                <Quiz />
              </AuthGuard>
            } />
            <Route path="/exam/:topicId" element={
              <AuthGuard>
                <Exam />
              </AuthGuard>
            } />
            <Route path="/history" element={
              <AuthGuard>
                <History />
              </AuthGuard>
            } />
            <Route path="/leaderboard" element={
              <AuthGuard>
                <Leaderboard />
              </AuthGuard>
            } />
            <Route path="/profile" element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            } />
            <Route path="/aptitude-test" element={
              <AuthGuard>
                <AptitudeTest />
              </AuthGuard>
            } />
            <Route path="/ai" element={
              <AuthGuard>
                <AIPage />
              </AuthGuard>
            } />
            <Route path="/technical" element={<UnderConstruction />} />
            <Route path="/technical/theory" element={<UnderConstruction />} />
            <Route path="/technical/coding" element={<UnderConstruction />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
