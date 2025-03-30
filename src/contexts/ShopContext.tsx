import React, { createContext, useState, useEffect } from 'react';
import { Shop } from '@/types/shop';
import { updateShop as apiUpdateShop } from '@/services/api';
import { getManagerShop } from '@/services/managerApi';
import { getShop as getOwnerShop } from '@/services/ownerApi';
import { AxiosError } from 'axios';

interface ShopContextType {
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;
  loading: boolean;
  updateShop: (data: Partial<Shop>) => Promise<void>;
}

export const ShopContext = createContext<ShopContextType | null>(null);

interface ShopProviderProps {
  children: React.ReactNode;
}

// Utility function to safely extract path parts without Router hooks
const extractShopIdFromPath = () => {
  try {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      console.log('[ShopContext] Extracting shop ID from path:', path);

      // Пропускаем инициализацию для страниц аутентификации
      if (
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path === '/'
      ) {
        console.log(
          '[ShopContext] Auth page detected, skipping shop initialization'
        );
        return { skip: true };
      }

      // UUID regex для валидации
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Проверяем путь менеджера /manager/{shopId}/...
      const managerPathMatch = path.match(/\/manager\/([^\/]+)/);
      if (managerPathMatch && managerPathMatch[1]) {
        const possibleShopId = managerPathMatch[1];

        // Проверяем, является ли извлеченный ID валидным UUID
        if (uuidRegex.test(possibleShopId)) {
          console.log(
            '[ShopContext] Found valid shop UUID in manager path:',
            possibleShopId
          );
          return { shopId: possibleShopId, role: 'manager' };
        }
      }

      // Если не нашли в URL, пробуем загрузить из localStorage
      try {
        const savedRole = localStorage.getItem('currentRole');
        if (savedRole) {
          const roleData = JSON.parse(savedRole);
          if (roleData?.shop?.id && uuidRegex.test(roleData.shop.id)) {
            console.log(
              '[ShopContext] Found shop ID in localStorage:',
              roleData.shop.id
            );
            return { shopId: roleData.shop.id, role: roleData.type };
          }
        }
      } catch (e) {
        console.error('[ShopContext] Error parsing localStorage data:', e);
      }

      console.log(
        '[ShopContext] No valid shop ID found in path or localStorage'
      );
      return { skip: true };
    }
    return { skip: true };
  } catch (error) {
    console.error('[ShopContext] Error in extractShopIdFromPath:', error);
    return { skip: true };
  }
};

export const ShopProvider: React.FC<ShopProviderProps> = ({ children }) => {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeShop = async () => {
    try {
      setLoading(true);
      console.log('[ShopContext] Starting shop initialization');
      const shopInfo = extractShopIdFromPath();
      console.log('[ShopContext] Extracted shop info:', shopInfo);

      // Если это страница аутентификации, пропускаем инициализацию
      if (shopInfo?.skip) {
        console.log('[ShopContext] Skipping shop initialization for auth page');
        setLoading(false);
        return;
      }

      if (shopInfo && shopInfo.shopId) {
        console.log('[ShopContext] Attempting to load shop data from API');
        try {
          let shopData;
          if (shopInfo.role === 'owner') {
            console.log('[ShopContext] Using owner API');
            shopData = await getOwnerShop(shopInfo.shopId);
          } else {
            console.log('[ShopContext] Using manager API');
            shopData = await getManagerShop(shopInfo.shopId);
          }

          if (!shopData) {
            console.error('[ShopContext] API returned no data');
            throw new Error('No shop data received from API');
          }

          console.log('[ShopContext] Successfully loaded shop data:', shopData);
          setCurrentShop(shopData);
          localStorage.setItem('currentShop', JSON.stringify(shopData));
        } catch (error) {
          console.error(
            '[ShopContext] Failed to load shop data from API:',
            error
          );

          // Проверяем есть ли данные в localStorage
          const savedShop = localStorage.getItem('currentShop');
          if (savedShop) {
            try {
              const parsedShop = JSON.parse(savedShop);
              if (parsedShop && parsedShop.id === shopInfo.shopId) {
                console.log('[ShopContext] Using shop data from localStorage');
                setCurrentShop(parsedShop);
                return;
              }
            } catch (e) {
              console.error(
                '[ShopContext] Error parsing shop from localStorage:',
                e
              );
            }
          }

          // Если нет данных в localStorage или они не подходят, редиректим
          console.log(
            '[ShopContext] No valid shop data found, redirecting to profile'
          );
          window.location.href = '/profile';
          return;
        }
      } else {
        // Если нет shopId в URL, проверяем localStorage
        const savedShop = localStorage.getItem('currentShop');
        if (savedShop) {
          try {
            const parsedShop = JSON.parse(savedShop);
            if (parsedShop && parsedShop.id) {
              console.log('[ShopContext] Using shop data from localStorage');
              setCurrentShop(parsedShop);
              return;
            }
          } catch (e) {
            console.error(
              '[ShopContext] Error parsing shop from localStorage:',
              e
            );
          }
        }

        // Если нет данных в localStorage, редиректим
        const path = window.location.pathname;
        if (
          !path.startsWith('/login') &&
          !path.startsWith('/register') &&
          path !== '/'
        ) {
          console.log(
            '[ShopContext] No shop data found, redirecting to profile'
          );
          window.location.href = '/profile';
          return;
        }
      }
    } catch (error) {
      console.error('[ShopContext] Error in shop initialization:', error);
      // Редиректим только если не на странице аутентификации
      const path = window.location.pathname;
      if (
        !path.startsWith('/login') &&
        !path.startsWith('/register') &&
        path !== '/'
      ) {
        window.location.href = '/profile';
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const savedShop = localStorage.getItem('currentShop');
    if (savedShop) {
      console.log('[ShopContext] Loading shop from localStorage');
      try {
        const parsedShop = JSON.parse(savedShop);

        // Validate that we have a valid shop object with an ID
        if (parsedShop && parsedShop.id) {
          console.log(
            '[ShopContext] Valid shop data found in localStorage:',
            parsedShop.id
          );
          setCurrentShop(parsedShop);
          setLoading(false);
        } else {
          console.error(
            '[ShopContext] Invalid shop data format in localStorage:',
            parsedShop
          );
          localStorage.removeItem('currentShop');
          // Оставляем loading в true, так как магазин не найден
        }
      } catch (e) {
        console.error('[ShopContext] Error parsing shop from localStorage:', e);
        localStorage.removeItem('currentShop');
        // Оставляем loading в true, так как произошла ошибка
      }
    } else {
      console.log('[ShopContext] No shop data found in localStorage');
      // Оставляем loading в true, так как магазин не найден
    }
  };

  useEffect(() => {
    initializeShop();
  }, []);

  // Update localStorage when shop changes
  useEffect(() => {
    if (currentShop) {
      localStorage.setItem('currentShop', JSON.stringify(currentShop));
    } else {
      localStorage.removeItem('currentShop');
    }
  }, [currentShop]);

  // Listen for URL changes to update shop
  useEffect(() => {
    const handleLocationChange = () => {
      const shopInfo = extractShopIdFromPath();
      if (
        shopInfo &&
        shopInfo.shopId &&
        (!currentShop || currentShop.id !== shopInfo.shopId)
      ) {
        setLoading(true);

        const fetchShopData = async () => {
          try {
            let shopData;

            // В зависимости от роли используем соответствующий API
            if (shopInfo.role === 'owner') {
              console.log(
                'Using owner API to get shop data after location change'
              );
              shopData = await getOwnerShop(shopInfo.shopId);
            } else {
              console.log(
                'Using manager API to get shop data after location change'
              );
              shopData = await getManagerShop(shopInfo.shopId);
            }

            setCurrentShop(shopData);
            localStorage.setItem('currentShop', JSON.stringify(shopData));
          } catch (error) {
            console.error('Error loading shop after location change:', error);
          } finally {
            setLoading(false);
          }
        };

        fetchShopData();
      }
    };

    // Add listener for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [currentShop]);

  const updateShop = async (data: Partial<Shop>) => {
    if (!currentShop) return;
    try {
      const updatedShop = await apiUpdateShop(currentShop.id, data);
      setCurrentShop(updatedShop);
    } catch (error) {
      console.error('Error updating shop:', error);
      throw error;
    }
  };

  return (
    <ShopContext.Provider
      value={{
        currentShop,
        setCurrentShop,
        loading,
        updateShop,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};
