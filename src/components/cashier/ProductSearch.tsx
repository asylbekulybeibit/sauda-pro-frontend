import React, { useState, useEffect, useRef } from 'react';
import { cashierApi } from '../../services/cashierApi';
import { Product } from '../../types/cashier';
import styles from './ProductSearch.module.css';

interface ProductSearchProps {
  warehouseId: string;
  onProductSelect: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  warehouseId,
  onProductSelect,
}) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Функция для обработки клика вне компонента
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim().length > 0) {
        setLoading(true);
        try {
          const data = await cashierApi.searchProducts(warehouseId, query);
          setProducts(data);
          setShowResults(true);
        } catch (error) {
          console.error('Error searching products:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setProducts([]);
        setShowResults(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [query, warehouseId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleProductClick = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setShowResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && products.length > 0) {
      handleProductClick(products[0]);
    }
  };

  return (
    <div className={styles.searchContainer}>
      <input
        ref={searchInputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim().length > 0 && setShowResults(true)}
        placeholder="Поиск товаров по штрихкоду или названию..."
        className={styles.searchInput}
      />
      {loading && <div className={styles.loader}></div>}
      {showResults && products.length > 0 && (
        <div ref={resultsRef} className={styles.searchResults}>
          {products.map((product) => (
            <div
              key={product.id}
              className={styles.searchResultItem}
              onClick={() => handleProductClick(product)}
            >
              <div className={styles.productName}>{product.name}</div>
              <div className={styles.productInfo}>
                <span className={styles.productCode}>{product.code}</span>
                <span className={styles.productPrice}>
                  {product.price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
