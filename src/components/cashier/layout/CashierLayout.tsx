import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import Header from './Header';
import DesktopSidebar from './DesktopSidebar';
import TabletMenu from './TabletMenu';
import MobileNavbar from './MobileNavbar';

/**
 * Основной макет для панели кассира
 * Адаптивно меняется в зависимости от размера экрана
 */
const CashierLayout: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  // Определяем размер экрана
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Состояние для отслеживания видимости меню на планшетах
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Обработчик нажатия на кнопку гамбургер
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Боковое меню для десктопов */}
      {isDesktop && <DesktopSidebar shopId={shopId} />}

      {/* Содержимое страницы */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Верхний заголовок */}
        <Header
          shopId={shopId}
          isTablet={isTablet}
          isMobile={isMobile}
          onMenuToggle={toggleMenu}
        />

        {/* Контент */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>

        {/* Выдвижное меню для планшетов */}
        {isTablet && (
          <TabletMenu
            shopId={shopId}
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />
        )}

        {/* Нижняя навигация для мобильных */}
        {isMobile && <MobileNavbar shopId={shopId} />}
      </div>
    </div>
  );
};

export default CashierLayout;
