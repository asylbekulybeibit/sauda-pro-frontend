import React, {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from 'react';
import {
  Link,
  useLocation,
  useParams,
  useNavigate,
  Outlet,
} from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { cashierApi } from '../../services/cashierApi';
import { CashShift } from '../../types/cashier';
import styles from './CashierLayout.module.css';

// Интерфейс для данных из JWT токена
interface DecodedToken {
  id: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  email?: string;
  username?: string;
  sub?: string;
  user?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    username?: string;
  };
  exp: number;
  iat: number;
  [key: string]: any;
}

// Создаем контекст для передачи функции обновления статуса смены
export const ShiftContext = createContext<{
  updateShiftStatus: () => Promise<CashShift | null>;
  currentShift: CashShift | null;
}>({
  updateShiftStatus: async () => null,
  currentShift: null,
});

// Hook для использования контекста в дочерних компонентах
export const useShift = () => useContext(ShiftContext);

const CashierLayout: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole } = useRoleStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [cashierName, setCashierName] = useState<string>('Загрузка...');
  const [cashRegisterName, setCashRegisterName] =
    useState<string>('Загрузка...');
  const [currentShift, setCurrentShift] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  // Обновление текущего времени каждую минуту
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Декодирование JWT токена
  const decodeJwtToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      const decoded = JSON.parse(jsonPayload) as DecodedToken;
      return decoded;
    } catch (error) {
      console.error('Ошибка при декодировании токена:', error);
      return null;
    }
  };

  // Форматирование номера телефона
  const formatPhoneNumber = (phone: string): string => {
    if (!phone || typeof phone !== 'string') return String(phone);
    const cleaned = phone.replace(/\D/g, '');
    if (
      cleaned.length === 11 &&
      (cleaned.startsWith('7') || cleaned.startsWith('8'))
    ) {
      const countryCode = '+7';
      const areaCode = cleaned.slice(1, 4);
      const firstPart = cleaned.slice(4, 7);
      const secondPart = cleaned.slice(7, 9);
      const thirdPart = cleaned.slice(9, 11);
      return `${countryCode} ${areaCode} ${firstPart}-${secondPart}-${thirdPart}`;
    }
    return `+${cleaned}`;
  };

  // Получение данных текущей смены
  const fetchCurrentShift = async () => {
    if (!warehouseId) return;

    try {
      const shift = await cashierApi.getCurrentShift(warehouseId);
      setCurrentShift(shift);

      if (shift && shift.cashRegister && shift.cashRegister.name) {
        setCashRegisterName(shift.cashRegister.name);
      } else {
        setCashRegisterName(warehouseName);
      }
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as {
        response?: {
          status: number;
          data?: {
            message?: string;
          };
        };
      };

      const isNotFoundException =
        error.response &&
        (error.response.status === 404 ||
          (error.response.data &&
            error.response.data.message &&
            error.response.data.message.includes('не найдена')));

      if (!isNotFoundException) {
        console.error(
          'Неожиданная ошибка при получении данных смены:',
          errorUnknown
        );
      }

      setCashRegisterName(warehouseName);
      setCurrentShift(null);
    }
  };

  // Проверка авторизации при монтировании компонента
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsAuthorized(false);
      navigate('/login', { replace: true });
      return;
    }

    setIsAuthorized(true);

    // Получаем информацию о пользователе
    const fetchUserInfo = async () => {
      const decodedToken = decodeJwtToken(token);
      if (!decodedToken) return;

      const phone = decodedToken.phone || decodedToken.user?.phone;

      try {
        const userProfile = await cashierApi.getCurrentUserProfile();
        if (userProfile && (userProfile.firstName || userProfile.lastName)) {
          const name = `${userProfile.firstName || ''} ${
            userProfile.lastName || ''
          }`.trim();
          setCashierName(name);
        } else {
          let name =
            decodedToken.name ||
            `${decodedToken.firstName || ''} ${
              decodedToken.lastName || ''
            }`.trim() ||
            decodedToken.username ||
            'Кассир';

          if (phone) {
            name = `${name} (${formatPhoneNumber(phone)})`;
          }
          setCashierName(name);
        }
      } catch (error) {
        console.error('Ошибка при получении информации о пользователе:', error);
        setCashierName('Кассир');
      }
    };

    fetchUserInfo();
  }, []); // Выполняется только при монтировании

  // Инициализация данных о смене
  useEffect(() => {
    if (isAuthorized && warehouseId) {
      fetchCurrentShift();
    }
  }, [warehouseId, isAuthorized]);

  // Периодическое обновление данных о смене
  useEffect(() => {
    if (
      isAuthorized &&
      warehouseId &&
      !location.pathname.includes('/history')
    ) {
      const intervalId = setInterval(fetchCurrentShift, 30000);
      return () => clearInterval(intervalId);
    }
  }, [warehouseId, isAuthorized, location.pathname]);

  // Показываем загрузку, пока не определен статус авторизации
  if (isAuthorized === null) {
    return <div className={styles.loading}>Проверка авторизации...</div>;
  }

  // Если не авторизован, не рендерим компонент
  if (isAuthorized === false) {
    return (
      <div className={styles.loading}>Перенаправление на страницу входа...</div>
    );
  }

  // Если warehouseId не определен, показываем загрузку
  if (!warehouseId || warehouseId === 'undefined') {
    return (
      <div className={styles.loading}>Загрузка информации о складе...</div>
    );
  }

  // Получаем имя склада из currentRole
  const warehouseName =
    currentRole?.type === 'shop' &&
    'warehouse' in currentRole &&
    currentRole.warehouse
      ? currentRole.warehouse.name
      : 'Загрузка...';

  // Функция обновления статуса смены
  const updateShiftStatus = async () => {
    try {
      const shift = await cashierApi.getCurrentShift(warehouseId);
      if (shift) {
        if (!shift.status && shift.startTime && !shift.endTime) {
          shift.status = 'open';
        } else if (typeof shift.status === 'string') {
          shift.status = shift.status.toLowerCase();
        }
      }
      setCurrentShift(shift);
      return shift;
    } catch (error) {
      console.error('Ошибка при обновлении статуса смены:', error);
      setCurrentShift(null);
      return null;
    }
  };

  // Определяем класс для хедера в зависимости от текущей страницы
  const getHeaderClass = () => {
    if (location.pathname.includes('/sales')) return styles.headerSales;
    if (location.pathname.includes('/returns')) return styles.headerReturns;
    if (location.pathname.includes('/shift')) return styles.headerShift;
    if (location.pathname.includes('/history')) return styles.headerHistory;
    return styles.headerSales;
  };

  return (
    <ShiftContext.Provider value={{ updateShiftStatus, currentShift }}>
      <div className={styles.cashierLayout}>
        <header className={`${styles.header} ${getHeaderClass()}`}>
          <div className={styles.headerInfo}>
            <div className={styles.cashInfo}>Касса - {cashRegisterName}</div>
            <div className={styles.timeInfo}>ВРЕМЯ: {currentTime}</div>
            <div className={styles.cashierInfo}>КАССИР: {cashierName}</div>
            <div className={styles.versionInfo}>v 4.0.8</div>
            <div
              className={`${styles.statusIndicator} ${
                currentShift &&
                (currentShift.status === 'open' ||
                  (currentShift.startTime && !currentShift.endTime))
                  ? styles.statusIndicatorOpen
                  : styles.statusIndicatorClosed
              }`}
              title={
                currentShift &&
                (currentShift.status === 'open' ||
                  (currentShift.startTime && !currentShift.endTime))
                  ? 'Смена открыта'
                  : 'Смена закрыта'
              }
              onClick={updateShiftStatus}
            >
              ●
            </div>
          </div>
          <nav className={styles.navigation}>
            <Link
              to={`/cashier/${warehouseId}/sales`}
              className={`${styles.navLink} ${
                location.pathname.includes('/sales') ? styles.active : ''
              }`}
            >
              ПРОДАЖИ
            </Link>
            <Link
              to={`/cashier/${warehouseId}/returns`}
              className={`${styles.navLink} ${
                location.pathname.includes('/returns') ? styles.active : ''
              }`}
            >
              ВОЗВРАТ
            </Link>
            <Link
              to={`/cashier/${warehouseId}/shift`}
              className={`${styles.navLink} ${
                location.pathname.includes('/shift') ? styles.active : ''
              }`}
            >
              СМЕНА
            </Link>
            <Link
              to={`/cashier/${warehouseId}/history`}
              className={`${styles.navLink} ${
                location.pathname.includes('/history') ? styles.active : ''
              }`}
            >
              ИСТОРИЯ ПРОДАЖ
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('accessToken');
                navigate('/login', { replace: true });
              }}
              className={styles.profileButton}
            >
              ВЫЙТИ
            </button>
          </nav>
        </header>
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </ShiftContext.Provider>
  );
};

export default CashierLayout;
