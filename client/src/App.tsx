import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "./lib/trpc";
import { useEffect } from "react";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Browse from "./pages/Browse";
import Reservations from "./pages/Reservations";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RestaurantRedeem from "./pages/RestaurantRedeem";
import AdminDashboard from "./pages/AdminDashboard";

/** Guard: redirect to /login if not authenticated */
function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate home
        if (user.role === "admin") setLocation("/admin");
        else if (user.role === "restaurant") setLocation("/restaurant");
        else setLocation("/browse");
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Customer routes */}
      <Route path="/browse">
        {() => <ProtectedRoute component={Browse} allowedRoles={["customer", "user", "admin"]} />}
      </Route>
      <Route path="/reservations">
        {() => <ProtectedRoute component={Reservations} allowedRoles={["customer", "user"]} />}
      </Route>

      {/* Restaurant routes */}
      <Route path="/restaurant">
        {() => <ProtectedRoute component={RestaurantDashboard} allowedRoles={["restaurant", "admin"]} />}
      </Route>
      <Route path="/restaurant/redeem">
        {() => <ProtectedRoute component={RestaurantRedeem} allowedRoles={["restaurant", "admin"]} />}
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
