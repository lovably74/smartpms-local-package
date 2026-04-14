import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import WbsPage from "./pages/WbsPage";
import IssuePage from "./pages/IssuePage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import MainLayout from "./components/MainLayout";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path={"/"} component={() => <WbsPage />} />
        <Route path={"/wbs"} component={() => <WbsPage />} />
        <Route path={"/wbs/:projectId"} component={() => <WbsPage />} />
        <Route path={"/issues"} component={() => <IssuePage />} />
        <Route path={"/dashboard"} component={() => <DashboardPage />} />
        <Route path={"/settings"} component={() => <SettingsPage />} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
