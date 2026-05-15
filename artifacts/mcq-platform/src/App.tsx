import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

// Public pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// Student pages
import Dashboard from "@/pages/Dashboard";
import Subjects from "@/pages/Subjects";
import SubjectDetail from "@/pages/SubjectDetail";
import Practice from "@/pages/Practice";
import ExamStart from "@/pages/ExamStart";
import ExamSession from "@/pages/ExamSession";
import ExamResult from "@/pages/ExamResult";
import Results from "@/pages/Results";
import Leaderboard from "@/pages/Leaderboard";
import Bookmarks from "@/pages/Bookmarks";
import WrongAnswers from "@/pages/WrongAnswers";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSubjects from "@/pages/admin/AdminSubjects";
import AdminChapters from "@/pages/admin/AdminChapters";
import AdminMcqs from "@/pages/admin/AdminMcqs";
import AdminBulkImport from "@/pages/admin/AdminBulkImport";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminReports from "@/pages/admin/AdminReports";

setAuthTokenGetter(() => localStorage.getItem("token"));

// In production, point API calls at the configured backend URL.
// Falls back to relative URLs (same-domain proxy) when not set.
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
if (apiUrl) setBaseUrl(apiUrl);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) setLocation("/login");
      else if (adminOnly && !isAdmin) setLocation("/dashboard");
    }
  }, [user, isLoading, isAdmin, adminOnly, setLocation]);

  if (isLoading) return <Spinner />;
  if (!user || (adminOnly && !isAdmin)) return <Spinner />;
  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) setLocation(isAdmin ? "/admin" : "/dashboard");
  }, [user, isLoading, isAdmin, setLocation]);

  if (isLoading) return <Spinner />;
  if (user) return <Spinner />;
  return <Component />;
}

function HomeRoute() {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) setLocation(isAdmin ? "/admin" : "/dashboard");
  }, [user, isLoading, isAdmin, setLocation]);

  if (isLoading) return <Spinner />;
  if (user) return <Spinner />;
  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/login"><PublicRoute component={Login} /></Route>
      <Route path="/register"><PublicRoute component={Register} /></Route>

      {/* Student routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/subjects"><ProtectedRoute component={Subjects} /></Route>
      <Route path="/subjects/:id"><ProtectedRoute component={SubjectDetail} /></Route>
      <Route path="/practice/:chapterId"><ProtectedRoute component={Practice} /></Route>
      <Route path="/exam/start"><ProtectedRoute component={ExamStart} /></Route>
      <Route path="/exam/session/:sessionId"><ProtectedRoute component={ExamSession} /></Route>
      <Route path="/results"><ProtectedRoute component={Results} /></Route>
      <Route path="/results/:resultId"><ProtectedRoute component={ExamResult} /></Route>
      <Route path="/leaderboard"><ProtectedRoute component={Leaderboard} /></Route>
      <Route path="/bookmarks"><ProtectedRoute component={Bookmarks} /></Route>
      <Route path="/wrong-answers"><ProtectedRoute component={WrongAnswers} /></Route>
      <Route path="/progress"><ProtectedRoute component={Progress} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>

      {/* Admin routes */}
      <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>
      <Route path="/admin/subjects"><ProtectedRoute component={AdminSubjects} adminOnly /></Route>
      <Route path="/admin/chapters"><ProtectedRoute component={AdminChapters} adminOnly /></Route>
      <Route path="/admin/mcqs"><ProtectedRoute component={AdminMcqs} adminOnly /></Route>
      <Route path="/admin/bulk-import"><ProtectedRoute component={AdminBulkImport} adminOnly /></Route>
      <Route path="/admin/users"><ProtectedRoute component={AdminUsers} adminOnly /></Route>
      <Route path="/admin/reports"><ProtectedRoute component={AdminReports} adminOnly /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
