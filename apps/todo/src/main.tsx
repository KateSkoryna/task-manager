import './app/i18n/i18n';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-sans/latin-ext-400.css';
import '@fontsource/dm-sans/latin-ext-500.css';
import '@fontsource/dm-sans/latin-ext-700.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';
import '@fontsource/dm-mono/latin-ext-400.css';
import '@fontsource/dm-mono/latin-ext-500.css';
import { StrictMode, ReactElement, Suspense, lazy, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import AppShell from './app/component/elements/AppShell';
import TopHeader from './app/component/elements/TopHeader';
import SidebarSkeleton from './app/component/elements/SidebarSkeleton';
import ContentSkeleton from './app/component/elements/ContentSkeleton';
import DashboardPage from './app/component/pages/DashboardPage';
import DashboardSkeleton from './app/component/pages/DashboardSkeleton';
import TasksPage from './app/component/pages/TasksPage';
import TasksPageSkeleton from './app/component/pages/TasksPageSkeleton';
import VitalTaskPage from './app/component/pages/VitalTaskPage';
import VitalTaskPageSkeleton from './app/component/pages/VitalTaskPageSkeleton';
import ReportsPageSkeleton from './app/component/pages/ReportsPageSkeleton';
import LoginPage from './app/component/auth/LoginPage';
import RegisterPage from './app/component/auth/RegisterPage';
import ForgotPasswordPage from './app/component/auth/ForgotPasswordPage';
import { useAuthStore } from './app/store/authStore';
import Loader from './app/component/elements/Loader';
import { auth } from './app/lib/firebase';
import apiClient from './app/lib/apiClient';

// Loaded when first visited, so the charting library and the pages behind
// "More" stay out of the first download.
const SettingsPage = lazy(() => import('./app/component/pages/SettingsPage'));
const HelpPage = lazy(() => import('./app/component/pages/HelpPage'));
const StatisticsPage = lazy(
  () => import('./app/component/statistics/StatisticsPage')
);
const ReportsPage = lazy(() => import('./app/component/pages/ReportsPage'));
const ReportDetailPage = lazy(
  () => import('./app/component/pages/ReportDetailPage')
);

const queryClient = new QueryClient();

const PAGE_SKELETONS: Record<string, ReactElement> = {
  '/': <DashboardSkeleton />,
  '/vital': <VitalTaskPageSkeleton />,
  '/tasks': <TasksPageSkeleton />,
  '/reports': <ReportsPageSkeleton />,
};

function LazyPage({ children }: { children: ReactElement }) {
  const { pathname } = useLocation();
  return (
    <Suspense fallback={PAGE_SKELETONS[pathname] ?? <ContentSkeleton />}>
      {children}
    </Suspense>
  );
}

function AuthBootstrap({ children }: { children: ReactElement }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { data } = await apiClient.get('/auth/user');
          setUser(data);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return children;
}

function AuthRoute({
  children,
  requireAuth,
}: {
  children: ReactElement;
  requireAuth: boolean;
}) {
  const isAuthenticated = useAuthStore((s) => !!s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { pathname } = useLocation();

  if (isLoading) {
    if (requireAuth) {
      return (
        <div className="flex h-screen flex-col overflow-hidden bg-app">
          <TopHeader />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <SidebarSkeleton />
            <main className="flex-1 overflow-y-auto p-content-mobile md:p-content-tablet lg:p-content-desktop">
              {PAGE_SKELETONS[pathname] ?? <ContentSkeleton />}
            </main>
          </div>
        </div>
      );
    }
    return <Loader message="Loading…" className="min-h-screen" />;
  }
  if (requireAuth && !isAuthenticated) return <Navigate to="/login" replace />;
  if (!requireAuth && isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            <Route
              element={
                <AuthRoute requireAuth>
                  <AppShell />
                </AuthRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/vital" element={<VitalTaskPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route
                path="/statistics"
                element={
                  <LazyPage>
                    <StatisticsPage />
                  </LazyPage>
                }
              />
              <Route
                path="/reports"
                element={
                  <LazyPage>
                    <ReportsPage />
                  </LazyPage>
                }
              />
              <Route
                path="/reports/:reportId"
                element={
                  <LazyPage>
                    <ReportDetailPage />
                  </LazyPage>
                }
              />
              <Route
                path="/settings"
                element={
                  <LazyPage>
                    <SettingsPage />
                  </LazyPage>
                }
              />
              <Route
                path="/help"
                element={
                  <LazyPage>
                    <HelpPage />
                  </LazyPage>
                }
              />
            </Route>
            <Route
              path="/login"
              element={
                <AuthRoute requireAuth={false}>
                  <LoginPage />
                </AuthRoute>
              }
            />
            <Route
              path="/register"
              element={
                <AuthRoute requireAuth={false}>
                  <RegisterPage />
                </AuthRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
