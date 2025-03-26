import React, { createContext, useState, useEffect } from 'react';
import { Shop } from '@/types/shop';
import { updateShop as apiUpdateShop } from '@/services/api';
import { getManagerShop } from '@/services/managerApi';
import { getShop as getOwnerShop } from '@/services/ownerApi';

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
    // Check if window is available (for SSR safety)
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      console.log('Current path for shop extraction:', path);

      // UUID regex for validation
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Проверяем формат /owner/{shopId}/... для пути владельца
      const ownerPathMatch = path.match(/\/owner\/([^\/]+)/);
      if (ownerPathMatch && ownerPathMatch[1]) {
        const possibleShopId = ownerPathMatch[1];

        // If it's a valid UUID, return it with role info
        if (uuidRegex.test(possibleShopId)) {
          console.log('Found valid shop UUID in owner path:', possibleShopId);
          return { id: possibleShopId, role: 'owner' };
        }
      }

      // Стратегия 1а: Проверка стандартного формата /manager/{shopId}/...
      const managerPathMatch = path.match(/\/manager\/([^\/]+)/);
      if (managerPathMatch && managerPathMatch[1]) {
        const possibleShopId = managerPathMatch[1];

        // If it's a valid UUID, return it
        if (uuidRegex.test(possibleShopId)) {
          console.log('Found valid shop UUID in manager path:', possibleShopId);
          return { id: possibleShopId, role: 'manager' };
        }
      }

      // Стратегия 1б: Проверка формата /cashier/{shopId}/...
      const cashierPathMatch = path.match(/\/cashier\/([^\/]+)/);
      if (cashierPathMatch && cashierPathMatch[1]) {
        const possibleShopId = cashierPathMatch[1];

        // If it's a valid UUID, return it
        if (uuidRegex.test(possibleShopId)) {
          console.log('Found valid shop UUID in cashier path:', possibleShopId);
          return { id: possibleShopId, role: 'cashier' };
        }
      }

      // Стратегия 2: Попробовать извлечь из URL параметров
      const params = new URLSearchParams(window.location.search);
      const shopIdParam = params.get('shopId');

      if (shopIdParam && uuidRegex.test(shopIdParam)) {
        console.log('Found shop ID from URL query parameter:', shopIdParam);
        return { id: shopIdParam, role: 'unknown' };
      }

      // Стратегия 3: Последняя попытка - поиск любого UUID в URL
      const parts = path.split('/');
      for (const part of parts) {
        if (uuidRegex.test(part)) {
          console.log('Found UUID in URL path parts:', part);
          return { id: part, role: 'unknown' };
        }
      }

      console.log('No valid shop ID found in URL');
    }
    return null;
  } catch (error) {
    console.error('Error extracting shopId from path:', error);
    return null;
  }
};

export const ShopProvider: React.FC<ShopProviderProps> = ({ children }) => {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeShop = async () => {
    try {
      setLoading(true);
      const shopInfo = extractShopIdFromPath();

      if (shopInfo && shopInfo.id) {
        console.log(
          'Initializing shop with ID from URL:',
          shopInfo.id,
          'Role:',
          shopInfo.role
        );

        try {
          let shopData;

          // В зависимости от роли используем соответствующий API
          if (shopInfo.role === 'owner') {
            console.log('Using owner API to get shop data');
            shopData = await getOwnerShop(shopInfo.id);
          } else {
            console.log('Using manager API to get shop data');
            shopData = await getManagerShop(shopInfo.id);
          }

          console.log('Successfully loaded shop data:', shopData);
          setCurrentShop(shopData);
          localStorage.setItem('currentShop', JSON.stringify(shopData));
          setLoading(false);
        } catch (error) {
          console.error(
            'Failed to load shop data from API, falling back to localStorage:',
            error
          );
          loadFromLocalStorage();
        }
      } else {
        console.log('No valid shop ID found in URL, loading from localStorage');
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error in shop initialization:', error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const savedShop = localStorage.getItem('currentShop');
    if (savedShop) {
      console.log('Loading shop from localStorage');
      try {
        const parsedShop = JSON.parse(savedShop);

        // Validate that we have a valid shop object with an ID
        if (parsedShop && parsedShop.id) {
          console.log('Valid shop data found in localStorage:', parsedShop.id);
          setCurrentShop(parsedShop);
        } else {
          console.error(
            'Invalid shop data format in localStorage:',
            parsedShop
          );
          localStorage.removeItem('currentShop');
        }
      } catch (e) {
        console.error('Error parsing shop from localStorage:', e);
        localStorage.removeItem('currentShop');
      }
    } else {
      console.log('No shop data found in localStorage');
    }
    setLoading(false);
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
        shopInfo.id &&
        (!currentShop || currentShop.id !== shopInfo.id)
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
              shopData = await getOwnerShop(shopInfo.id);
            } else {
              console.log(
                'Using manager API to get shop data after location change'
              );
              shopData = await getManagerShop(shopInfo.id);
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
