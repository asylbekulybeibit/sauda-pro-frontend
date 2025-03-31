import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductSearch from '../../components/cashier/ProductSearch';
import ProductsTable from '../../components/cashier/ProductsTable';
import TotalPanel from '../../components/cashier/TotalPanel';
import PaymentModal from '../../components/cashier/PaymentModal';
import { cashierApi } from '../../services/cashierApi';
import {
  Product,
  ReceiptItem,
  PaymentData,
  CashShift,
  PaymentMethodType,
} from '../../types/cashier';
import { v4 as uuidv4 } from 'uuid';
import styles from './SalesPage.module.css';

const SalesPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Проверка наличия открытой кассовой смены при загрузке страницы
  useEffect(() => {
    if (warehouseId) {
      checkCurrentShift();
    }
  }, [warehouseId]);

  // Расчет итогов при изменении товаров
  useEffect(() => {
    const totalSum = receiptItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discountSum = receiptItems.reduce(
      (sum, item) => sum + (item.discountAmount || 0),
      0
    );
    const finalSum = totalSum - discountSum;
    setTotalAmount(totalSum);
    setDiscountAmount(discountSum);
    setFinalAmount(finalSum);
  }, [receiptItems]);

  // Создание нового чека
  const createNewReceipt = async () => {
    if (!warehouseId || !currentShift) {
      setError('Необходимо открыть кассовую смену перед созданием чека');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await cashierApi.createReceipt(warehouseId, {
        cashShiftId: currentShift.id,
        cashRegisterId: currentShift.cashRegister.id,
      });

      setReceiptId(response.id);
      setReceiptNumber(response.number);
      setError(null);

      return response.id;
    } catch (err: any) {
      console.error('Ошибка при создании чека:', err);

      // Более детальные сообщения об ошибках
      if (err.response) {
        if (err.response.status === 400) {
          setError(
            `Не удалось создать чек: ${
              err.response.data?.message || 'Неверные данные'
            }`
          );
        } else if (err.response.status === 404) {
          setError(
            'Не найдена активная смена или касса. Обновите страницу и попробуйте снова.'
          );
        } else {
          setError(
            `Ошибка сервера: ${
              err.response.data?.message || 'Не удалось создать чек'
            }`
          );
        }
      } else if (err.request) {
        setError(
          'Не удалось соединиться с сервером. Проверьте подключение к интернету.'
        );
      } else {
        setError(
          'Произошла ошибка при создании чека. Пожалуйста, попробуйте еще раз.'
        );
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  // Добавление или обновление товара в чеке на сервере
  const addItemToReceiptOnServer = async (
    receiptId: string,
    item: ReceiptItem
  ) => {
    if (!warehouseId || !item.warehouseProductId) return;

    try {
      const response = await cashierApi.addItemToReceipt(
        warehouseId,
        receiptId,
        {
          warehouseProductId: item.warehouseProductId,
          quantity: item.quantity,
          price: item.price,
          discountPercent: item.discountPercent,
        }
      );

      // Обновляем ID товара на сервере в локальном состоянии
      setReceiptItems((prevItems) =>
        prevItems.map((prevItem) =>
          prevItem.id === item.id
            ? { ...prevItem, serverItemId: response.id }
            : prevItem
        )
      );

      return response;
    } catch (err) {
      console.error('Ошибка при добавлении/обновлении товара в чеке:', err);
      setError('Не удалось обновить товар в чеке');
      return null;
    }
  };

  const handleProductSelect = async (product: Product) => {
    // Проверяем, есть ли уже такой товар в чеке
    const existingItemIndex = receiptItems.findIndex(
      (item) => item.warehouseProductId === product.id
    );

    if (existingItemIndex >= 0) {
      // Если товар уже есть, увеличиваем количество
      const updatedItems = [...receiptItems];
      const item = updatedItems[existingItemIndex];

      const newQuantity = item.quantity + 1;
      const newAmount = product.price * newQuantity;
      const newDiscountAmount = (newAmount * item.discountPercent) / 100;
      const newFinalAmount = newAmount - newDiscountAmount;

      updatedItems[existingItemIndex] = {
        ...item,
        quantity: newQuantity,
        amount: newAmount,
        discountAmount: newDiscountAmount,
        finalAmount: newFinalAmount,
      };

      setReceiptItems(updatedItems);

      // Если чек уже создан, обновляем товар на сервере
      if (receiptId) {
        try {
          await addItemToReceiptOnServer(
            receiptId,
            updatedItems[existingItemIndex]
          );
        } catch (err) {
          console.error('Ошибка при обновлении товара в чеке:', err);
          setError('Не удалось обновить количество товара в чеке');
        }
      }
    } else {
      // Если товара еще нет, добавляем новый
      const newItem: ReceiptItem = {
        id: uuidv4(), // Временный ID для фронтенда
        name: product.name,
        price: product.price,
        quantity: 1,
        amount: product.price,
        discountPercent: 0,
        discountAmount: 0,
        finalAmount: product.price,
        type: product.isService ? 'service' : 'product',
        warehouseProductId: product.id,
      };

      setReceiptItems([...receiptItems, newItem]);

      // Если чек еще не создан, создаем его
      let activeReceiptId = receiptId;
      if (!activeReceiptId) {
        activeReceiptId = await createNewReceipt();
        if (!activeReceiptId) return;
      }

      // Добавляем товар на сервер
      try {
        const newItem = await cashierApi.addItemToReceipt(
          warehouseId || '',
          activeReceiptId,
          {
            warehouseProductId: product.id,
            quantity: 1,
            price: product.price,
            discountPercent: 0,
          }
        );

        // Добавляем товар в локальное состояние
        const newReceiptItem: ReceiptItem = {
          id: new Date().getTime().toString(), // Временный ID до получения с сервера
          serverItemId: newItem.id, // ID на сервере
          name: product.name,
          price: product.price,
          quantity: 1,
          amount: product.price,
          discountPercent: 0,
          discountAmount: 0,
          finalAmount: product.price,
          type: product.isService ? 'service' : 'product',
          warehouseProductId: product.id,
        };

        setReceiptItems([...receiptItems, newReceiptItem]);
      } catch (err) {
        console.error('Ошибка при добавлении товара в чек:', err);
        setError('Не удалось добавить товар в чек');
      }
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const itemIndex = receiptItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    const itemToRemove = receiptItems[itemIndex];

    // Если чек создан на сервере, удаляем товар с сервера
    if (receiptId && itemToRemove.serverItemId) {
      try {
        await cashierApi.removeItemFromReceipt(
          warehouseId || '',
          receiptId,
          itemToRemove.serverItemId
        );

        // Удаляем товар из локального состояния
        const updatedItems = [...receiptItems];
        updatedItems.splice(itemIndex, 1);
        setReceiptItems(updatedItems);
      } catch (err) {
        console.error('Ошибка при удалении товара из чека:', err);
        setError('Не удалось удалить товар из чека');
      }
    } else {
      // Если чек еще не создан, просто удаляем из локального состояния
      const updatedItems = [...receiptItems];
      updatedItems.splice(itemIndex, 1);
      setReceiptItems(updatedItems);
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const itemIndex = receiptItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    const updatedItems = [...receiptItems];
    updatedItems[itemIndex].quantity = newQuantity;
    updatedItems[itemIndex].amount =
      updatedItems[itemIndex].price * newQuantity;
    updatedItems[itemIndex].finalAmount =
      updatedItems[itemIndex].amount -
      (updatedItems[itemIndex].discountAmount || 0);

    setReceiptItems(updatedItems);

    // Если чек создан на сервере, обновляем товар на сервере
    if (receiptId && updatedItems[itemIndex].serverItemId) {
      try {
        await cashierApi.addItemToReceipt(warehouseId || '', receiptId, {
          warehouseProductId: updatedItems[itemIndex].warehouseProductId || '',
          quantity: newQuantity,
          price: updatedItems[itemIndex].price,
          discountPercent: updatedItems[itemIndex].discountPercent,
        });
      } catch (err) {
        console.error('Ошибка при обновлении количества товара:', err);
        setError('Не удалось обновить количество товара');
      }
    }
  };

  const handlePayment = () => {
    if (receiptItems.length === 0) {
      setError('Добавьте товары в чек для оплаты');
      return;
    }

    if (error) {
      setError(null);
    }

    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (paymentData: {
    paymentMethod: PaymentMethodType;
    amount: number;
    change?: number;
  }) => {
    if (!receiptId || !warehouseId) {
      setError('Не удалось оплатить чек: отсутствует ID чека');
      setIsPaymentModalOpen(false);
      return;
    }

    setLoading(true);
    setError(null);

    const paymentRequest = async (retryCount = 0): Promise<boolean> => {
      try {
        await cashierApi.payReceipt(warehouseId, receiptId, {
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount,
        });
        return true;
      } catch (err: any) {
        console.error(`Попытка ${retryCount + 1} оплаты чека не удалась:`, err);

        // Если ошибка связана с сетью и не превышено количество повторных попыток, повторяем запрос
        if (err.request && !err.response && retryCount < 2) {
          // Делаем паузу перед повторной попыткой
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return paymentRequest(retryCount + 1);
        }

        // Обработка различных типов ошибок
        if (err.response) {
          if (err.response.status === 400) {
            setError(
              `Не удалось оплатить чек: ${
                err.response.data?.message || 'Неверные данные платежа'
              }`
            );
          } else if (err.response.status === 404) {
            setError('Чек не найден или уже был оплачен/отменен');
          } else if (err.response.status === 409) {
            setError('Чек уже был обработан (оплачен или отменен)');
          } else {
            setError(
              `Ошибка сервера: ${
                err.response.data?.message || 'Не удалось оплатить чек'
              }`
            );
          }
        } else if (err.request) {
          setError(
            'Не удалось соединиться с сервером. Проверьте подключение к интернету.'
          );
        } else {
          setError(
            'Произошла ошибка при оплате чека. Пожалуйста, попробуйте еще раз.'
          );
        }

        return false;
      }
    };

    try {
      const success = await paymentRequest();

      if (success) {
        // Сбрасываем состояние и закрываем модальное окно
        clearReceipt();
        setIsPaymentModalOpen(false);

        // Обновляем данные о текущей смене
        const shift = await cashierApi.getCurrentShift(warehouseId);
        setCurrentShift(shift);

        // Уведомляем пользователя об успешной оплате
        alert('Чек успешно оплачен!');
      }
    } catch (err) {
      console.error('Непредвиденная ошибка при оплате чека:', err);
      setError(
        'Произошла непредвиденная ошибка. Пожалуйста, повторите попытку.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReceipt = () => {
    if (receiptItems.length === 0) return;

    if (window.confirm('Вы действительно хотите очистить чек?')) {
      // Если чек уже был создан на сервере, отменяем его
      if (receiptId) {
        cancelReceiptOnServer(receiptId);
      }

      setReceiptItems([]);
      setReceiptId(null);
      createNewReceipt(); // Создаем новый чек
    }
  };

  // Отмена чека на сервере
  const cancelReceiptOnServer = async (receiptId: string) => {
    if (!warehouseId) return;

    try {
      await cashierApi.cancelReceipt(warehouseId, receiptId);
    } catch (err) {
      console.error('Ошибка при отмене чека:', err);
      setError('Не удалось отменить чек');
    }
  };

  const handleAddFastProduct = () => {
    alert('Открытие модального окна быстрых товаров');
  };

  const handleChangeQuantity = () => {
    alert('Открытие модального окна изменения количества');
  };

  const handleExtraFunctions = () => {
    alert('Открытие модального окна дополнительных функций');
  };

  const handleRemove = () => {
    if (receiptItems.length === 0) {
      alert('Нет товаров для удаления');
      return;
    }

    if (window.confirm('Вы действительно хотите удалить выбранные товары?')) {
      // В будущем здесь будет удаление выбранных товаров
      // Пока просто очищаем весь чек
      handleCancelReceipt();
    }
  };

  // Очистка состояния чека
  const clearReceipt = () => {
    setReceiptItems([]);
    setTotalAmount(0);
    setDiscountAmount(0);
    setFinalAmount(0);
    setReceiptId(null);
    setReceiptNumber('');
    setError(null);
  };

  // Обработчик перехода на страницу смены
  const handleGoToShiftPage = () => {
    if (warehouseId) {
      navigate(`/cashier/${warehouseId}/shift`);
    }
  };

  // Проверка наличия открытой кассовой смены при загрузке страницы
  const checkCurrentShift = async () => {
    if (!warehouseId) return;

    try {
      const shift = await cashierApi.getCurrentShift(warehouseId);
      setCurrentShift(shift);
      setError(null);
    } catch (err: any) {
      console.error('Ошибка при получении текущей смены:', err);
      setCurrentShift(null);

      // Более детальные сообщения об ошибках
      if (err.response) {
        // Ошибка от сервера с кодом статуса
        if (err.response.status === 404) {
          setError(
            'Нет открытой кассовой смены. Пожалуйста, откройте смену перед началом работы.'
          );
        } else if (err.response.status === 401 || err.response.status === 403) {
          setError(
            'У вас нет прав для работы с кассовой сменой. Обратитесь к администратору.'
          );
        } else {
          setError(
            `Ошибка сервера: ${
              err.response.data?.message || 'Неизвестная ошибка'
            }`
          );
        }
      } else if (err.request) {
        // Запрос был сделан, но не получен ответ
        setError(
          'Не удалось соединиться с сервером. Проверьте подключение к интернету.'
        );
      } else {
        // Что-то пошло не так при настройке запроса
        setError(
          'Произошла ошибка при подготовке запроса. Пожалуйста, обновите страницу.'
        );
      }
    }
  };

  return (
    <div className={styles.salesPage}>
      {error && (
        <div className={styles.errorMessage}>
          {error}
          {error.includes('Нет открытой кассовой смены') && (
            <button
              className={styles.openShiftButton}
              onClick={handleGoToShiftPage}
            >
              Открыть кассовую смену
            </button>
          )}
          {error.includes('401') && (
            <button
              className={styles.openShiftButton}
              onClick={handleGoToShiftPage}
            >
              Открыть кассовую смену
            </button>
          )}
        </div>
      )}

      <div className={styles.receiptHeader}>
        <div className={styles.receiptNumber}>
          Номер чека: {receiptNumber || 'Новый чек'}
        </div>
        <div className={styles.searchContainer}>
          <ProductSearch
            warehouseId={warehouseId || ''}
            onProductSelect={handleProductSelect}
          />
        </div>
      </div>

      <ProductsTable
        items={receiptItems}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleQuantityChange}
      />

      <TotalPanel
        total={finalAmount}
        received={0}
        change={0}
        onPay={handlePayment}
        onClear={handleCancelReceipt}
        onAddFastProduct={handleAddFastProduct}
        onChangeQuantity={handleChangeQuantity}
        onExtraFunctions={handleExtraFunctions}
        onRemove={handleRemove}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={finalAmount}
        onSubmit={handlePaymentSubmit}
      />

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Обработка платежа...</div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
