import React, {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { cashierApi } from '../../services/cashierApi';
import { CashShift } from '../../types/cashier';
import styles from './CashierLayout.module.css';

interface CashierLayoutProps {
  children: ReactNode;
}

// Интерфейс для данных из JWT токена
interface DecodedToken {
  id: string;
  userId?: string; // Некоторые JWT могут иметь userId вместо id
  firstName?: string;
  lastName?: string;
  name?: string; // Некоторые JWT могут хранить полное имя в одном поле
  phone?: string;
  email?: string;
  username?: string; // Имя пользователя может быть в разных полях
  sub?: string; // subject - может содержать идентификатор пользователя
  user?: {
    // Некоторые токены содержат данные пользователя в поле user
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    username?: string; // Имя пользователя в поле user
  };
  exp: number;
  iat: number;
  [key: string]: any; // Для любых других полей, которые могут быть в токене
}

// Создаем контекст для передачи функции обновления статуса смены
export const ShiftContext = createContext<{
  updateShiftStatus: () => void;
  currentShift: CashShift | null;
}>({
  updateShiftStatus: () => {},
  currentShift: null,
});

// Hook для использования контекста в дочерних компонентах
export const useShift = () => useContext(ShiftContext);

const CashierLayout: React.FC<CashierLayoutProps> = ({ children }) => {
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
    }, 60000); // Обновляем каждую минуту

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
      console.log('Содержимое декодированного токена:', decoded);

      // Детальный разбор полей токена для диагностики
      console.log('Детали токена:');
      Object.keys(decoded).forEach((key) => {
        console.log(`  ${key}:`, decoded[key]);
      });

      return decoded;
    } catch (error) {
      console.error('Ошибка при декодировании токена:', error);
      return null;
    }
  };

  // Форматирование номера телефона
  const formatPhoneNumber = (phone: string): string => {
    // Если телефон не строка или пустая строка, возвращаем как есть
    if (!phone || typeof phone !== 'string') return String(phone);

    // Очищаем от всех нецифровых символов
    const cleaned = phone.replace(/\D/g, '');

    // Если номер начинается с 7 и имеет 11 цифр (российский формат)
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

    // Если другой формат номера, просто ставим плюс в начале и группируем по 3-4 цифры
    return `+${cleaned}`;
  };

  // Получение данных текущей смены
  const fetchCurrentShift = async () => {
    if (!warehouseId) return;

    console.log('=== ЗАПРОС ДАННЫХ О СМЕНЕ ===');
    console.log('warehouseId:', warehouseId);

    try {
      const shift = await cashierApi.getCurrentShift(warehouseId);
      console.log('=== ПОЛУЧЕН ОТВЕТ О СМЕНЕ ===');
      console.log('Данные смены (сырые):', JSON.stringify(shift));
      console.log('Статус смены:', shift?.status);
      console.log('Тип статуса:', typeof shift?.status);

      setCurrentShift(shift);
      console.log('Установлен currentShift:', shift);

      // Обновляем название кассы из полученной смены
      if (shift && shift.cashRegister && shift.cashRegister.name) {
        setCashRegisterName(shift.cashRegister.name);
        console.log('Установлено имя кассы:', shift.cashRegister.name);
      } else {
        // Если смена не найдена, показываем информацию о складе
        setCashRegisterName(warehouseName);
        console.log('Смена не найдена, установлено имя склада:', warehouseName);
      }
    } catch (error) {
      console.error('=== ОШИБКА ПРИ ПОЛУЧЕНИИ ДАННЫХ СМЕНЫ ===', error);
      // В случае ошибки показываем информацию о складе
      setCashRegisterName(warehouseName);
      setCurrentShift(null); // Убедимся, что currentShift сбрасывается при ошибке
      console.log('Сброшен currentShift в null из-за ошибки');
    }
  };

  // Обрабатываем обновление статуса смены от API
  const updateShiftStatus = useCallback(async () => {
    if (!warehouseId) {
      console.error('updateShiftStatus: warehouseId отсутствует');
      return;
    }

    console.log('updateShiftStatus: Начало запроса смены');
    try {
      const response = await cashierApi.getCurrentShift(warehouseId);
      console.log('updateShiftStatus: Получен ответ:', response);

      if (!response) {
        console.log(
          'updateShiftStatus: Получен пустой ответ, смена не найдена'
        );
        // Обновляем состояние только если текущая смена не равна null
        if (currentShift !== null) {
          setCurrentShift(null);
        }
        return;
      }

      console.log('CashierLayout - текущий статус:', response?.status);
      console.log('CashierLayout - тип статуса:', typeof response?.status);

      // Если статус не установлен, но объект смены существует, установим его вручную
      let updated = false;
      if (response && !response.status) {
        console.log('CashierLayout: Статус отсутствует, устанавливаем "open"');
        response.status = 'open';
        response._statusFixed = true;
        updated = true;
      }

      // Копируем маркер _statusFixed из текущего состояния, если он есть
      if (!response._statusFixed && currentShift && currentShift._statusFixed) {
        response._statusFixed = true;
        updated = true;
      }

      // Глубокое сравнение с текущим состоянием, чтобы избежать лишних обновлений
      let shouldUpdate = false;

      // Сравниваем только если у нас есть текущее состояние
      if (currentShift) {
        // Проверяем основные свойства для изменений
        shouldUpdate =
          currentShift.id !== response.id ||
          currentShift.status !== response.status ||
          currentShift._statusFixed !== response._statusFixed;

        // Если нет изменений в основных свойствах, можно использовать строковое представление
        if (!shouldUpdate) {
          const currentShiftStr = JSON.stringify(currentShift);
          const responseStr = JSON.stringify(response);
          shouldUpdate = currentShiftStr !== responseStr;
        }
      } else {
        // Если у нас нет текущего состояния, но получен ответ - обновляем
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        console.log('updateShiftStatus: Обнаружены изменения, обновляем state');
        setCurrentShift(response);
      } else {
        console.log(
          'updateShiftStatus: Изменений не обнаружено, state не обновляем'
        );
      }

      console.log(
        'CashierLayout: Завершение обработки смены:',
        updated ? 'с изменениями' : 'без изменений'
      );
    } catch (error) {
      console.error('Ошибка при получении данных текущей смены:', error);
    }
  }, [
    warehouseId,
    currentShift?.id,
    currentShift?.status,
    currentShift?._statusFixed,
  ]); // Уменьшаем зависимости

  // Проверка авторизации при загрузке компонента
  useEffect(() => {
    const checkAuthorization = async () => {
      const token = localStorage.getItem('accessToken');
      console.log(
        'CashierLayout: Проверка авторизации, токен:',
        token ? 'Найден' : 'Не найден'
      );

      if (!token) {
        console.warn(
          'CashierLayout: Токен не найден, перенаправление на страницу логина'
        );
        setIsAuthorized(false);
        navigate('/login', { replace: true });
        return false;
      }

      // Декодируем токен для получения информации о пользователе
      const decodedToken = decodeJwtToken(token);
      if (decodedToken) {
        // Получаем телефон из токена
        const phone = decodedToken.phone || decodedToken.user?.phone;

        try {
          // Получаем профиль текущего пользователя, который уже авторизован
          // с этим токеном
          console.log('Запрашиваем информацию о текущем пользователе');
          const userProfile = await cashierApi.getCurrentUserProfile();

          console.log(
            'Получена информация о текущем пользователе:',
            userProfile
          );

          if (userProfile && (userProfile.firstName || userProfile.lastName)) {
            // Если получили информацию с именем/фамилией, используем ее
            const name = `${userProfile.firstName || ''} ${
              userProfile.lastName || ''
            }`.trim();

            // Если есть телефон, добавляем его в скобках
            if (phone && !name.includes('+')) {
              setCashierName(`${name}`);
            } else {
              setCashierName(name);
            }

            console.log('Имя кассира установлено из API профиля:', name);
            setIsAuthorized(true);
            return true;
          }
        } catch (error) {
          console.error(
            'Ошибка при получении информации о пользователе:',
            error
          );
          // В случае ошибки продолжаем работу с информацией из токена
        }

        // Если не смогли получить информацию из API или произошла ошибка,
        // используем данные из токена как запасной вариант

        // Формируем имя кассира из данных токена
        let name = 'Кассир';

        // Проверяем различные форматы хранения данных пользователя
        if (decodedToken.firstName || decodedToken.lastName) {
          name = `${decodedToken.firstName || ''} ${
            decodedToken.lastName || ''
          }`.trim();
        } else if (decodedToken.name) {
          name = decodedToken.name;
        } else if (
          decodedToken.user?.firstName ||
          decodedToken.user?.lastName
        ) {
          name = `${decodedToken.user.firstName || ''} ${
            decodedToken.user.lastName || ''
          }`.trim();
        } else if (decodedToken.user?.name) {
          name = decodedToken.user.name;
        } else if (decodedToken.username) {
          name = decodedToken.username;
        } else if (decodedToken.user?.username) {
          name = decodedToken.user.username;
        } else if (phone) {
          // Если имя и фамилия не указаны, используем отформатированный номер телефона
          name = formatPhoneNumber(phone);
        }

        // Вне зависимости от того, что найдено,
        // если есть телефон, отобразим его как дополнительную информацию
        if (phone && !name.includes('+')) {
          setCashierName(`${name} (${formatPhoneNumber(phone)})`);
        } else {
          setCashierName(name);
        }

        console.log('Имя кассира установлено из токена:', name);
      }

      setIsAuthorized(true);
      return true;
    };

    const checkAuthAndFetch = async () => {
      const isAuth = await checkAuthorization();
      if (!isAuth) return;

      // Получаем данные о текущей смене
      fetchCurrentShift();

      // Остальной код эффекта выполняется только если пользователь авторизован
      if (!warehouseId || warehouseId === 'undefined') {
        // Если warehouseId отсутствует или undefined, пытаемся получить его из currentRole
        if (
          currentRole &&
          currentRole.type === 'shop' &&
          'warehouse' in currentRole &&
          currentRole.warehouse
        ) {
          navigate(`/cashier/${currentRole.warehouse.id}/sales`, {
            replace: true,
          });
        } else {
          // Если не можем получить id склада, перенаправляем на профиль
          navigate('/profile', { replace: true });
        }
      }
    };

    checkAuthAndFetch();
  }, [warehouseId, currentRole, navigate]);

  // Обновляем информацию о смене при изменении маршрута
  useEffect(() => {
    if (isAuthorized && warehouseId) {
      console.log(
        'Обновление смены при изменении маршрута:',
        location.pathname
      );
      fetchCurrentShift();
    }
  }, [location.pathname, warehouseId, isAuthorized]);

  // Отслеживаем изменения currentShift только при изменении id или status
  useEffect(() => {
    // Пропускаем, если смены нет или статус уже есть или уже отмечен как исправленный
    if (!currentShift || currentShift.status || currentShift._statusFixed) {
      return;
    }

    console.log(
      'CashierLayout: обнаружена смена без статуса, устанавливаем "open"'
    );

    // Используем функциональную форму setState для предотвращения проблем
    setCurrentShift((prevShift: CashShift | null) => {
      if (prevShift && !prevShift.status && !prevShift._statusFixed) {
        return {
          ...prevShift,
          status: 'open',
          _statusFixed: true,
        };
      }
      return prevShift;
    });
  }, [currentShift?.id]); // Зависим только от id смены

  // Хук для обновления референса функции updateShiftStatus
  const updateStatusRef = React.useRef(updateShiftStatus);

  // Обновляем референс при изменении функции
  useEffect(() => {
    updateStatusRef.current = updateShiftStatus;
  }, [updateShiftStatus]);

  // Устанавливаем интервал для периодического обновления статуса
  useEffect(() => {
    // Выполняем один раз при монтировании компонента
    if (warehouseId) {
      console.log(
        'Первоначальный запрос статуса смены для warehouseId:',
        warehouseId
      );
      updateShiftStatus();
    }

    // Обновляем статус каждые 30 секунд
    const interval = setInterval(() => {
      if (warehouseId) {
        console.log('Запрос по интервалу для warehouseId:', warehouseId);
        // Используем референс функции, чтобы всегда использовать актуальную версию
        updateStatusRef.current();
      }
    }, 30000);

    return () => {
      console.log('Очистка интервала обновления статуса');
      clearInterval(interval);
    };
  }, [warehouseId]); // Зависим только от warehouseId

  // Получаем имя склада из currentRole
  const warehouseName =
    currentRole?.type === 'shop' &&
    'warehouse' in currentRole &&
    currentRole.warehouse
      ? currentRole.warehouse.name
      : 'Загрузка...';

  // Выводим информацию о текущей роли для диагностики
  console.log('Текущая роль пользователя:', currentRole);

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const renderStatusIndicator = () => {
    console.log('Рендеринг индикатора статуса - currentShift:', currentShift);

    // Если смена не загружена или статус не установлен
    if (!currentShift) {
      return (
        <div className={styles.statusIndicatorClosed} title="Смена закрыта">
          ●
        </div>
      );
    }

    // Выведем информацию о статусе для отладки
    console.log('Статус смены:', currentShift.status);
    console.log('Тип статуса:', typeof currentShift.status);

    // Принудительно установим статус, если он равен undefined, но смена существует
    let status = currentShift.status;
    if (status === undefined) {
      console.log('Статус undefined, устанавливаем "open"');
      status = 'open';
    }

    // Переведем в нижний регистр для сравнения
    const lowercaseStatus =
      typeof status === 'string' ? status.toLowerCase() : status;
    console.log('Статус в нижнем регистре:', lowercaseStatus);
    console.log('Условие (open):', lowercaseStatus === 'open');

    return (
      <div
        className={
          lowercaseStatus === 'open'
            ? styles.statusIndicatorOpen
            : styles.statusIndicatorClosed
        }
        title={lowercaseStatus === 'open' ? 'Смена открыта' : 'Смена закрыта'}
        onClick={() => {
          console.log(
            'ТЕКУЩАЯ СМЕНА (при клике):',
            JSON.stringify(currentShift, null, 2)
          );
        }}
      >
        ●
      </div>
    );
  };

  // Показываем загрузку, пока не определен статус авторизации
  if (isAuthorized === null) {
    return <div className={styles.loading}>Проверка авторизации...</div>;
  }

  // Если не авторизован, не рендерим компонент (перенаправление происходит в useEffect)
  if (isAuthorized === false) {
    return (
      <div className={styles.loading}>Перенаправление на страницу входа...</div>
    );
  }

  // Если warehouseId не определен (пустая строка или undefined), показываем загрузку
  if (!warehouseId || warehouseId === 'undefined') {
    return (
      <div className={styles.loading}>Загрузка информации о складе...</div>
    );
  }

  return (
    <ShiftContext.Provider value={{ updateShiftStatus, currentShift }}>
      <div className={styles.cashierLayout}>
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.cashInfo}>Касса - {cashRegisterName}</div>
            <div className={styles.timeInfo}>ВРЕМЯ: {currentTime}</div>
            <div className={styles.cashierInfo}>КАССИР: {cashierName}</div>
            <div className={styles.versionInfo}>v 1.0.0</div>
            <div className={styles.statusIndicator}>
              {renderStatusIndicator()}
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
              onClick={handleGoToProfile}
              className={`${styles.navLink} ${styles.profileButton}`}
            >
              ВЫЙТИ
            </button>
          </nav>
        </header>
        <main className={styles.mainContent}>{children}</main>
      </div>
    </ShiftContext.Provider>
  );
};

export default CashierLayout;
