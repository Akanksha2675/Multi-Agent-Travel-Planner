import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/index";
import LoginPage from "@/pages/login";
import { useAuth } from "@/hooks/use-auth";

const queryClient = new QueryClient();

function Router() {
  const { isAuthenticated, login, logout, user } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return <LoginPage onLogin={(token, u) => { login(token, u); navigate("/"); }} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <Home user={user} onLogout={logout} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
