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
import { ShopProvider } from '@/contexts/ShopContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManagerHeader } from '@/components/manager/layout/Header';
import './styles/price-analytics.css';

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
const ManagerDashboard = React.lazy(
  () => import('./pages/manager/ManagerDashboard')
);
const ProductsPage = React.lazy(
  () => import('./pages/manager/products/ProductsPage')
);
const ProductDetailsPage = React.lazy(
  () => import('./pages/manager/products/ProductDetailsPage')
);
const CategoriesPage = React.lazy(
  () => import('./pages/manager/categories/CategoriesPage')
);
const ReportsPage = React.lazy(
  () => import('./pages/manager/reports/ReportsPage')
);

const SalesPage = React.lazy(() => import('./pages/manager/sales/SalesPage'));
const ReturnsPage = React.lazy(
  () => import('./pages/manager/sales/ReturnsPage')
);
const StaffPage = React.lazy(() => import('./pages/manager/staff/StaffPage'));
const PromotionsPage = React.lazy(
  () => import('./pages/manager/promotions/PromotionsPage')
);
const LabelsPage = React.lazy(
  () => import('./pages/manager/labels/LabelsPage')
);

const ManagerInvitesPage = React.lazy(
  () => import('./pages/manager/invites/ManagerInvitesPage')
);
const TransfersPage = React.lazy(
  () => import('./pages/manager/warehouse/TransfersPage')
);
const WriteOffsPage = React.lazy(
  () => import('./pages/manager/warehouse/WriteOffsPage')
);
const WarehouseReportsPage = React.lazy(
  () => import('./pages/manager/warehouse/ReportsPage')
);
const WarehousePage = React.lazy(
  () => import('./pages/manager/warehouse/WarehousePage')
);
const IncomingPage = React.lazy(
  () => import('./pages/manager/warehouse/IncomingPage')
);
const InventoryPage = React.lazy(
  () => import('./pages/manager/warehouse/InventoryPage')
);
const CashRegistersPage = React.lazy(
  () => import('./pages/manager/cash-registers/cash-registers')
);
const SuppliersPage = React.lazy(
  () => import('./pages/manager/suppliers/SuppliersPage')
);
const SupplierDetailsPage = React.lazy(
  () => import('./pages/manager/suppliers/SupplierDetailsPage')
);
const SupplierFormPage = React.lazy(
  () => import('./pages/manager/suppliers/SupplierFormPage')
);
const PriceAnalyticsPage = React.lazy(
  () => import('./pages/manager/prices/PriceAnalyticsPage')
);
const ProductPriceHistoryPage = React.lazy(
  () => import('./pages/manager/prices/ProductPriceHistoryPage')
);

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

const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <Spin size="large" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ShopProvider>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
              </div>
            }
          >
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

                {/* Маршруты панели менеджера */}
                <Route
                  path="/manager/:shopId/*"
                  element={
                    <RoleGuard allowedRoles={[RoleType.MANAGER]}>
                      <Suspense fallback={<LoadingFallback />}>
                        <ManagerHeader />
                      </Suspense>
                    </RoleGuard>
                  }
                >
                  <Route index element={<ManagerDashboard />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route
                    path="products/:productId"
                    element={<ProductDetailsPage />}
                  />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route
                    path="cash-registers"
                    element={<CashRegistersPage />}
                  />
                  <Route path="sales" element={<SalesPage />} />
                  <Route path="sales/returns" element={<ReturnsPage />} />
                  <Route path="staff" element={<StaffPage />} />
                  <Route path="invites" element={<ManagerInvitesPage />} />
                  <Route path="promotions" element={<PromotionsPage />} />
                  <Route path="labels" element={<LabelsPage />} />
                  <Route path="analytics">
                    <Route index element={<AnalyticsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                  </Route>
                  <Route
                    path="bulk-operations"
                    element={<BulkOperationsPage />}
                  />
                  <Route path="warehouse">
                    <Route index element={<WarehousePage />} />
                    <Route path="incoming" element={<IncomingPage />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="transfers" element={<TransfersPage />} />
                    <Route path="writeoffs" element={<WriteOffsPage />} />
                    <Route
                      path="products/:productId"
                      element={<ProductDetailsPage />}
                    />
                    <Route path="reports" element={<WarehouseReportsPage />} />
                  </Route>
                  <Route path="suppliers">
                    <Route index element={<SuppliersPage />} />
                    <Route path=":id" element={<SupplierDetailsPage />} />
                    <Route path=":id/edit" element={<SupplierFormPage />} />
                    <Route path="new" element={<SupplierFormPage />} />
                  </Route>
                  <Route path="prices">
                    <Route index element={<PriceAnalyticsPage />} />
                    <Route
                      path="product/:id"
                      element={<ProductPriceHistoryPage />}
                    />
                  </Route>
                </Route>
              </Route>

              {/* Редирект на профиль по умолчанию */}
              <Route path="/" element={<Navigate to="/profile" replace />} />
            </Routes>
          </Suspense>
        </ShopProvider>
      </Router>
    </QueryClientProvider>
  );
}
