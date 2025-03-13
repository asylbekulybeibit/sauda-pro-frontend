import React, { createContext, useState, useEffect } from 'react';
import { Shop } from '@/types/shop';

interface ShopContextType {
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;
  loading: boolean;
}

export const ShopContext = createContext<ShopContextType | null>(null);

interface ShopProviderProps {
  children: React.ReactNode;
}

export const ShopProvider: React.FC<ShopProviderProps> = ({ children }) => {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Здесь можно добавить загрузку последнего выбранного магазина из localStorage
    const savedShop = localStorage.getItem('currentShop');
    if (savedShop) {
      setCurrentShop(JSON.parse(savedShop));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentShop) {
      localStorage.setItem('currentShop', JSON.stringify(currentShop));
    } else {
      localStorage.removeItem('currentShop');
    }
  }, [currentShop]);

  return (
    <ShopContext.Provider
      value={{
        currentShop,
        setCurrentShop,
        loading,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};
