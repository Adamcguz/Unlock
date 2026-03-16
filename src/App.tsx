import { lazy, Suspense, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { useUserStore } from './store/useUserStore';
import { usePayPeriodCycle } from './hooks/usePayPeriodCycle';
import { useBalanceSync } from './hooks/useBalanceSync';
import { useHydration } from './hooks/useHydration';
import { checkAndMigrate } from './lib/storage';

const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Projects = lazy(() => import('./pages/Projects'));
const History = lazy(() => import('./pages/History'));
const Planner = lazy(() => import('./pages/Planner'));
const Settings = lazy(() => import('./pages/Settings'));

checkAndMigrate();

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-white">
          <h1 className="text-xl font-bold text-red-500 mb-2">
            Something went wrong
          </h1>
          <pre className="text-sm text-gray-400 whitespace-pre-wrap bg-gray-900 p-4 rounded-xl overflow-auto max-h-[80vh]">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="text-primary text-lg font-medium">Loading...</div>
    </div>
  );
}

function AppRoutes() {
  const hydrated = useHydration();
  const profile = useUserStore((s) => s.profile);
  const onboardingCompleted = profile?.onboardingCompleted ?? false;

  usePayPeriodCycle();
  useBalanceSync();

  if (!hydrated) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          onboardingCompleted ? <Navigate to="/" replace /> : <Onboarding />
        }
      />
      <Route
        element={
          onboardingCompleted ? <AppShell /> : <Navigate to="/onboarding" replace />
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="projects" element={<Projects />} />
        <Route path="history" element={<History />} />
        <Route path="planner" element={<Planner />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<LoadingScreen />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
