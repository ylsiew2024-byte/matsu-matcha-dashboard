import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SecurityProvider } from "./contexts/SecurityContext";
import DashboardLayout from "./components/DashboardLayout";
import PanicScreen from "./components/PanicScreen";
import UserWatermark from "./components/UserWatermark";
import ExportConfirmDialog, { ExportProvider } from "./components/ExportConfirmDialog";
import SimulationModeBanner from "./components/SimulationModeBanner";

// Pages
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Suppliers from "./pages/Suppliers";
import Products from "./pages/Products";
import Pricing from "./pages/Pricing";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
// AI Chat removed per user request
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import AiPredictions from "./pages/AiPredictions";
import UserManagement from "./pages/UserManagement";
import ClientProductRelations from "./pages/ClientProductRelations";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/clients" component={Clients} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/products" component={Products} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/orders" component={Orders} />
        <Route path="/analytics" component={Analytics} />
        {/* AI Chat removed per user request */}
        <Route path="/audit" component={AuditLog} />
        <Route path="/settings" component={Settings} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/ai-predictions" component={AiPredictions} />
        <Route path="/users" component={UserManagement} />
        <Route path="/client-products" component={ClientProductRelations} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SecurityProvider>
            <ExportProvider>
            {/* Security overlays */}
            <PanicScreen />
            <UserWatermark />
            <ExportConfirmDialog />
            <SimulationModeBanner />
            
            {/* Main app */}
            <Toaster />
            <Router />
            </ExportProvider>
          </SecurityProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
