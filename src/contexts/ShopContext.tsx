import React, { createContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shop } from '@/types/shop';
import { updateShop as apiUpdateShop } from '@/services/api';
import { getManagerShop } from '@/services/managerApi';

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

export const ShopProvider: React.FC<ShopProviderProps> = ({ children }) => {
  const { shopId } = useParams<{ shopId: string }>();
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeShop() {
      try {
        // Если есть shopId в URL, загружаем данные магазина
        if (shopId) {
          console.log('Loading shop data for ID:', shopId);
          const shop = await getManagerShop(shopId);
          console.log('Loaded shop data:', shop);
          setCurrentShop(shop);
          localStorage.setItem('currentShop', JSON.stringify(shop));
        } else {
          // Если нет shopId в URL, пробуем загрузить из localStorage
          const savedShop = localStorage.getItem('currentShop');
          if (savedShop) {
            console.log('Loading shop from localStorage');
            setCurrentShop(JSON.parse(savedShop));
          }
        }
      } catch (error) {
        console.error('Error loading shop:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeShop();
  }, [shopId]);

  useEffect(() => {
    if (currentShop) {
      localStorage.setItem('currentShop', JSON.stringify(currentShop));
    } else {
      localStorage.removeItem('currentShop');
    }
  }, [currentShop]);

  const updateShop = async (data: Partial<Shop>) => {
    if (!currentShop) return;
    const updatedShop = await apiUpdateShop(currentShop.id, data);
    setCurrentShop(updatedShop);
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
