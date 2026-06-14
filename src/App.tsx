import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import { useThemeStore } from './store/themeStore';
import { supabase } from './services/supabase';
import { useAuthStore } from './store/authStore';
import { PageLoader } from './components/shared/PageLoader';
import { AppLayout } from './components/shared/AppLayout';

const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const BoardsPage = lazy(() => import('./pages/BoardsPage').then(m => ({ default: m.BoardsPage })));
const BoardPage = lazy(() => import('./pages/BoardPage').then(m => ({ default: m.BoardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  const { session, loading, setSession, setLoading } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession, setLoading]);

  if (loading) return <PageLoader />;

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#1677ff', borderRadius: 6 },
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }}>
      <AntApp>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route
                path="/auth"
                element={session ? <Navigate to="/" replace /> : <AuthPage />}
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <BoardsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/:id"
                element={
                  <ProtectedRoute>
                    <BoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
