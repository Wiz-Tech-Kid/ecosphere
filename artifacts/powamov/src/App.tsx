import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import CommandCenter from "@/pages/command";
import DigitalTwin from "@/pages/digital-twin";
import Maintenance from "@/pages/maintenance";
import Analytics from "@/pages/analytics";
import CarbonAnalytics from "@/pages/carbon-analytics";
import Calculator from "@/pages/calculator";
import Tracker from "@/pages/tracker";
import Login from "@/pages/login";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import Collaborators from "@/pages/collaborators";
import { Shell } from "@/components/layout/shell";
import { getSession, logout } from "@/utils/auth";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const session = getSession();
    if (!session && location !== "/login") {
      setLocation("/login");
    }
  }, [location]);

  const session = getSession();
  if (!session) return null;

  return <>{children}</>;
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <Shell onLogout={handleLogout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/command" component={CommandCenter} />
        <Route path="/digital-twin" component={DigitalTwin} />
        <Route path="/maintenance" component={Maintenance} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/carbon-analytics" component={CarbonAnalytics} />
        <Route path="/calculator" component={Calculator} />
        <Route path="/tracker" component={Tracker} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/collaborators" component={Collaborators} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <AuthGuard>
          <AppRoutes />
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ecosphere-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
