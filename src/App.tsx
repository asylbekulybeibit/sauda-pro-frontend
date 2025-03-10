import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { useAuthStore } from '@/store/authStore';
import LoginPage from './pages/auth/LoginPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProjectsPage from './pages/admin/ProjectsPage';
import UsersPage from './pages/admin/UsersPage';
import InvitesPage from './pages/admin/InvitesPage';

// Компонент для защиты роутов, требующих аутентификации
function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    // Перенаправляем на логин с сохранением предыдущего URL
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

// Компонент для защиты роутов, требующих определенной роли
function RoleGuard({ children }: { children: React.ReactNode }) {
  const { currentRole } = useRoleStore();

  if (!currentRole) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

// Заглушки для страниц админки (позже заменим на реальные компоненты)
const ReportsPage = () => <div>Страница отчетов</div>;

// Заглушки для дашбордов
const ShopDashboard = () => <div>Панель управления магазином</div>;

function App() {
  const { isAuthenticated } = useAuthStore();
  const { currentRole } = useRoleStore();

  return (
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/profile" replace /> : <LoginPage />
          }
        />

        {/* Защищенные маршруты */}
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />

        {/* Маршруты админ-панели */}
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <AdminLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="invites" element={<InvitesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        {/* Маршруты магазина */}
        <Route
          path="/shop/*"
          element={
            <AuthGuard>
              <RoleGuard>
                <ShopDashboard />
              </RoleGuard>
            </AuthGuard>
          }
        />

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
    </Router>
  );
}

export default App;
