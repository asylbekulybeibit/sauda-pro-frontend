import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ManagerSidebar } from '@/components/manager/layout/Sidebar';
import { ManagerHeader } from '@/components/manager/layout/Header';
import { NotificationsPopover } from '@/components/Notifications/NotificationsPopover';

export default function ManagerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Сайдбар */}
      <ManagerSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Основной контент */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <ManagerHeader
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
          NotificationsComponent={NotificationsPopover}
        />

        {/* Основной контент страницы */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
