import React, { useState, useEffect, useRef } from 'react';
import { cashierApi } from '../../services/cashierApi';
import { Product } from '../../types/cashier';
import styles from './ProductSearch.module.css';
import { BsKeyboard } from 'react-icons/bs';

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
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const russianLayout = {
    default: [
      ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х'],
      ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
      ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
    ],
    shift: [
      ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х'],
      ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
      ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
    ],
  };

  const handleKeyClick = (key: string) => {
    if (key === 'backspace') {
      setQuery((prev) => prev.slice(0, -1));
    } else if (key === 'shift') {
      setIsShift(!isShift);
    } else if (key === 'space') {
      setQuery((prev) => prev + ' ');
    } else {
      setQuery((prev) => prev + key);
    }
  };

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
    setShowKeyboard(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && products.length > 0) {
      handleProductClick(products[0]);
    }
  };

  const toggleKeyboard = () => {
    setShowKeyboard(!showKeyboard);
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
      <div className={styles.keyboardIcon} onClick={toggleKeyboard}>
        <BsKeyboard />
      </div>
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
                  {Number(product.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showKeyboard && (
        <div className={styles.virtualKeyboard}>
          <div className={styles.keyboardContainer}>
            <div className={styles.leftSection}>
              {(isShift ? russianLayout.shift : russianLayout.default).map(
                (row, rowIndex) => (
                  <div key={rowIndex} className={styles.keyboardRow}>
                    {row.map((key) => (
                      <button
                        key={key}
                        className={styles.key}
                        onClick={() => handleKeyClick(key)}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                )
              )}
              <div className={styles.keyboardRow}>
                <button
                  className={`${styles.key} ${styles.funcKey}`}
                  onClick={() => handleKeyClick('shift')}
                >
                  СИМ
                </button>
                <button className={`${styles.key} ${styles.funcKey}`}>
                  ENG
                </button>
                <button
                  className={`${styles.key} ${styles.spaceKey}`}
                  onClick={() => handleKeyClick('space')}
                ></button>
                <button
                  className={`${styles.key} ${styles.funcKey}`}
                  onClick={() => handleKeyClick('shift')}
                >
                  ⇧
                </button>
              </div>
            </div>
            <button
              className={styles.backspaceKey}
              onClick={() => handleKeyClick('backspace')}
            >
              ←
            </button>
            <div className={styles.rightSection}>
              <div className={styles.numericSection}>
                <div className={styles.numericPad}>
                  <div className={styles.keyboardRow}>
                    {['1', '2', '3'].map((num) => (
                      <button
                        key={num}
                        className={`${styles.key} ${styles.numKey}`}
                        onClick={() => handleKeyClick(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className={styles.keyboardRow}>
                    {['4', '5', '6'].map((num) => (
                      <button
                        key={num}
                        className={`${styles.key} ${styles.numKey}`}
                        onClick={() => handleKeyClick(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className={styles.keyboardRow}>
                    {['7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        className={`${styles.key} ${styles.numKey}`}
                        onClick={() => handleKeyClick(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className={styles.keyboardRow}>
                    <button
                      className={`${styles.key} ${styles.numKey} ${styles.zeroKey}`}
                      onClick={() => handleKeyClick('0')}
                    >
                      0
                    </button>
                    <button
                      className={`${styles.key} ${styles.numKey}`}
                      onClick={() => handleKeyClick('.')}
                    >
                      .
                    </button>
                  </div>
                </div>
                <div className={styles.sideButtons}>
                  <button className={`${styles.key} ${styles.cancelKey}`}>
                    ОТМЕНИТЬ
                  </button>
                  <button className={`${styles.key} ${styles.okKey}`}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
