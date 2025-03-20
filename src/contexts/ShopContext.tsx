import React, { createContext, useState, useEffect } from 'react';
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

// Utility function to safely extract path parts without Router hooks
const extractShopIdFromPath = () => {
  try {
    // Check if window is available (for SSR safety)
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const pathMatch = path.match(/\/manager\/([^\/]+)/);
      if (pathMatch && pathMatch[1]) {
        return pathMatch[1];
      }
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

  useEffect(() => {
    async function initializeShop() {
      try {
        // Extract shop ID from the URL path without using router hooks
        const shopIdFromPath = extractShopIdFromPath();

        // If we found a shopId in the path, use it
        if (shopIdFromPath) {
          console.log('Loading shop data for ID from path:', shopIdFromPath);
          try {
            const shop = await getManagerShop(shopIdFromPath);
            console.log('Loaded shop data:', shop);
            setCurrentShop(shop);
            localStorage.setItem('currentShop', JSON.stringify(shop));
          } catch (shopError) {
            console.error('Error loading shop from API:', shopError);
            // If API fails, try localStorage as fallback
            loadFromLocalStorage();
          }
        } else {
          // If no shopId in URL, load from localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error initializing shop:', error);
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    }

    function loadFromLocalStorage() {
      const savedShop = localStorage.getItem('currentShop');
      if (savedShop) {
        console.log('Loading shop from localStorage');
        try {
          setCurrentShop(JSON.parse(savedShop));
        } catch (e) {
          console.error('Error parsing shop from localStorage:', e);
          localStorage.removeItem('currentShop');
        }
      }
    }

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
      const shopIdFromPath = extractShopIdFromPath();
      if (
        shopIdFromPath &&
        (!currentShop || currentShop.id !== shopIdFromPath)
      ) {
        setLoading(true);
        getManagerShop(shopIdFromPath)
          .then((shop) => {
            setCurrentShop(shop);
            localStorage.setItem('currentShop', JSON.stringify(shop));
          })
          .catch((error) => {
            console.error('Error loading shop after location change:', error);
          })
          .finally(() => {
            setLoading(false);
          });
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
