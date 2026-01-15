import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { useNavigationStore } from './store/useNavigationStore';
import { CampaignsPage } from './pages/CampaignsPage';
import { PerformancePage } from './pages/PerformancePage';
import { GuardrailsPage } from './pages/GuardrailsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/Auth/LoginPage';
import { SignupPage } from './pages/Auth/SignupPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const DashboardView = () => {
  const { currentView } = useNavigationStore();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'campaigns':
        return <CampaignsPage />;
      case 'performance':
        return <PerformancePage />;
      case 'guardrails':
        return <GuardrailsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppShell>
      {renderContent()}
    </AppShell>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
