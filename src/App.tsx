import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
  useParams,
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
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProjectsPage = lazy(() => import('./pages/admin/ProjectsPage'));
const WarehousesPage = lazy(() => import('./pages/admin/WarehousesPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const InvitesPage = lazy(() => import('./pages/admin/InvitesPage'));
const OwnerLayout = lazy(() => import('./pages/owner/OwnerLayout'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const OwnerInvitesPage = lazy(() => import('./pages/owner/InvitesPage'));
const OwnerStaffPage = lazy(() => import('./pages/owner/StaffPage'));
const AnalyticsPage = lazy(
  () => import('./pages/manager/analytics/AnalyticsPage')
);
const DebtsPage = lazy(() => import('./pages/manager/warehouse/DebtsPage'));

const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const ProductsPage = lazy(
  () => import('./pages/manager/products/ProductsPage')
);
const ProductDetailsPage = lazy(
  () => import('./pages/manager/products/ProductDetailsPage')
);
const BarcodesPage = lazy(
  () => import('./pages/manager/barcodes/BarcodesPage')
);
const CategoriesPage = lazy(
  () => import('./pages/manager/categories/CategoriesPage')
);
const ReportsPage = lazy(() => import('./pages/manager/reports/ReportsPage'));

const SalesPage = lazy(() => import('./pages/manager/sales/SalesPage'));
const ReturnsPage = lazy(() => import('./pages/manager/sales/ReturnsPage'));
const StaffPage = lazy(() => import('./pages/manager/staff/StaffPage'));
const PromotionsPage = lazy(
  () => import('./pages/manager/promotions/PromotionsPage')
);
const LabelsPage = lazy(() => import('./pages/manager/labels/LabelsPage'));

const ManagerInvitesPage = lazy(
  () => import('./pages/manager/invites/ManagerInvitesPage')
);
const ClientsPage = lazy(() => import('./pages/manager/clients/ClientsPage'));
const TransfersPage = lazy(
  () => import('./pages/manager/warehouse/TransfersPage')
);
const WriteOffsPage = lazy(
  () => import('./pages/manager/warehouse/WriteOffsPage')
);
const WarehouseReportsPage = lazy(
  () => import('./pages/manager/warehouse/ReportsPage')
);
const WarehousePage = lazy(
  () => import('./pages/manager/warehouse/WarehousePage')
);
const IncomingPage = lazy(
  () => import('./pages/manager/warehouse/IncomingPage')
);
const InventoryPage = lazy(
  () => import('./pages/manager/warehouse/InventoryPage')
);
const CashRegistersPage = lazy(
  () => import('./pages/manager/cash-registers/cash-registers')
);
const SuppliersPage = lazy(
  () => import('./pages/manager/suppliers/SuppliersPage')
);

// Страницы для услуг
const ClientVehiclesPage = lazy(
  () => import('./pages/manager/vehicles/ClientVehiclesPage')
);

// Use regular relative imports
const PurchaseFormPage = lazy(
  () => import('./pages/manager/warehouse/PurchaseFormPage')
);

const PurchaseDetailsPage = lazy(
  () => import('./pages/manager/warehouse/PurchaseDetailsPage')
);

// Ленивая загрузка компонентов кассира
// Комментируем импорты, которые вызывают ошибки

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

const PriceListPage = lazy(
  () => import('./pages/manager/prices/PriceListPage')
);
const PriceHistoryPage = lazy(
  () => import('./pages/manager/prices/PriceHistoryPage')
);

// Add WarehouseRoute component to handle warehouseId
function WarehouseRoute({
  Component,
}: {
  Component: React.ComponentType<{ warehouseId: string }>;
}) {
  const { currentRole } = useRoleStore();
  const { shopId } = useParams();
  const warehouseId =
    currentRole?.type === 'shop' ? currentRole.warehouse?.id || shopId : shopId;

  return <Component warehouseId={warehouseId!} />;
}

const NotificationsPage = lazy(
  () => import('./pages/manager/notifications/NotificationsPage')
);

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
                  <Route path="warehouses" element={<WarehousesPage />} />
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

                  <Route path="barcodes" element={<BarcodesPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route
                    path="cash-registers"
                    element={<CashRegistersPage />}
                  />
                  <Route path="sales" element={<SalesPage />} />
                  <Route path="sales/returns" element={<ReturnsPage />} />
                  <Route path="staff" element={<StaffPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="vehicles" element={<ClientVehiclesPage />} />
                  <Route path="invites" element={<ManagerInvitesPage />} />
                  <Route path="promotions" element={<PromotionsPage />} />
                  <Route path="labels" element={<LabelsPage />} />
                  <Route path="analytics">
                    <Route index element={<AnalyticsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                  </Route>

                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="warehouse">
                    <Route path="incoming" element={<IncomingPage />} />
                    <Route path="purchases">
                      <Route path="create" element={<PurchaseFormPage />} />
                      <Route path=":id" element={<PurchaseDetailsPage />} />
                      <Route path="edit/:id" element={<PurchaseFormPage />} />
                    </Route>
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="transfers" element={<TransfersPage />} />
                    <Route path="writeoffs" element={<WriteOffsPage />} />
                    <Route path="debts" element={<DebtsPage />} />
                    <Route
                      path="products/:productId"
                      element={<ProductDetailsPage />}
                    />
                    <Route path="reports" element={<WarehouseReportsPage />} />
                  </Route>
                  <Route path="prices">
                    <Route
                      index
                      element={<WarehouseRoute Component={PriceListPage} />}
                    />
                    <Route
                      path="history"
                      element={<WarehouseRoute Component={PriceHistoryPage} />}
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
