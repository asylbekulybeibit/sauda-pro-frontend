import React, { Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { useAuthStore } from '@/store/authStore';
import { Spin } from 'antd';
import LoginPage from './pages/auth/LoginPage';
import { RoleType } from './types/role';

// Ленивая загрузка компонентов
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const ProjectsPage = React.lazy(() => import('./pages/admin/ProjectsPage'));
const UsersPage = React.lazy(() => import('./pages/admin/UsersPage'));
const InvitesPage = React.lazy(() => import('./pages/admin/InvitesPage'));
const OwnerLayout = React.lazy(() => import('./pages/owner/OwnerLayout'));
const OwnerDashboard = React.lazy(() => import('./pages/owner/OwnerDashboard'));
const OwnerInvitesPage = React.lazy(() => import('./pages/owner/InvitesPage'));
const OwnerStaffPage = React.lazy(() => import('./pages/owner/StaffPage'));
const AnalyticsPage = React.lazy(
  () => import('./pages/manager/analytics/AnalyticsPage')
);
const BulkOperationsPage = React.lazy(
  () => import('./pages/manager/BulkOperationsPage')
);
const AuditPage = React.lazy(() => import('./pages/manager/AuditPage'));
const ManagerLayout = React.lazy(() => import('./pages/manager/ManagerLayout'));

// Компонент для защиты роутов, требующих аутентификации
function AuthGuard() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    // Перенаправляем на логин с сохранением предыдущего URL
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

// Компонент для защиты роутов, требующих определенной роли
function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: RoleType[];
  children: React.ReactNode;
}) {
  const { currentRole } = useRoleStore();

  if (!currentRole) {
    return <Navigate to="/profile" replace />;
  }

  // Для суперадмина разрешаем доступ только к админ панели
  if (currentRole.type === 'superadmin') {
    return allowedRoles.includes(RoleType.SUPERADMIN) ? (
      <>{children}</>
    ) : (
      <Navigate to="/profile" replace />
    );
  }

  // Для остальных ролей проверяем доступ
  if (!allowedRoles.includes(currentRole.role)) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size="large" />
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuthStore();
  const { currentRole } = useRoleStore();

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Публичные маршруты */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/profile" replace />
              ) : (
                <LoginPage />
              )
            }
          />

          {/* Защищенные маршруты */}
          <Route element={<AuthGuard />}>
            <Route path="/profile" element={<ProfilePage />} />

            {/* Маршруты админ-панели */}
            <Route
              path="/admin/*"
              element={
                <RoleGuard allowedRoles={[RoleType.SUPERADMIN]}>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminLayout />
                  </Suspense>
                </RoleGuard>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="invites" element={<InvitesPage />} />
            </Route>

            {/* Маршруты панели владельца */}
            <Route
              path="/owner/:shopId/*"
              element={
                <RoleGuard allowedRoles={[RoleType.OWNER]}>
                  <Suspense fallback={<LoadingFallback />}>
                    <OwnerLayout />
                  </Suspense>
                </RoleGuard>
              }
            >
              <Route index element={<OwnerDashboard />} />
              <Route path="invites" element={<OwnerInvitesPage />} />
              <Route path="staff" element={<OwnerStaffPage />} />
            </Route>

            {/* Маршруты магазина */}
            <Route
              path="/shop/*"
              element={
                <RoleGuard allowedRoles={[RoleType.MANAGER, RoleType.OWNER]}>
                  <Suspense fallback={<LoadingFallback />}>
                    <ManagerLayout />
                  </Suspense>
                </RoleGuard>
              }
            >
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="bulk-operations" element={<BulkOperationsPage />} />
              <Route path="audit" element={<AuditPage />} />
            </Route>
          </Route>

          {/* Редирект с корневого пути */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                currentRole?.type === 'superadmin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/profile" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Редирект для всех остальных путей */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/profile" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
