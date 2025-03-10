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

// Заглушки для дашбордов (позже заменим на реальные компоненты)
const AdminDashboard = () => <div>Панель управления суперадмина</div>;
const ShopDashboard = () => <div>Панель управления магазином</div>;

function App() {
  const { isAuthenticated } = useAuthStore();

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

        <Route
          path="/admin/*"
          element={
            <AuthGuard>
              <RoleGuard>
                <AdminDashboard />
              </RoleGuard>
            </AuthGuard>
          }
        />

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
              <Navigate to="/profile" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Редирект для всех остальных путей на /login или /profile */}
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
