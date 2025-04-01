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

// Ключи для localStorage
const STORAGE_KEYS = {
  RECEIPT_ID: 'cashier_receipt_id',
  RECEIPT_NUMBER: 'cashier_receipt_number',
  RECEIPT_ITEMS: 'cashier_receipt_items',
  TOTAL_AMOUNT: 'cashier_total_amount',
  DISCOUNT_AMOUNT: 'cashier_discount_amount',
  FINAL_AMOUNT: 'cashier_final_amount',
} as const;

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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Сохранение состояния в localStorage
  const saveStateToStorage = () => {
    // Получаем текущие данные из localStorage
    const currentStoredData = {
      receiptId: localStorage.getItem(STORAGE_KEYS.RECEIPT_ID),
      receiptNumber: localStorage.getItem(STORAGE_KEYS.RECEIPT_NUMBER),
      items: localStorage.getItem(STORAGE_KEYS.RECEIPT_ITEMS),
      totalAmount: localStorage.getItem(STORAGE_KEYS.TOTAL_AMOUNT),
      discountAmount: localStorage.getItem(STORAGE_KEYS.DISCOUNT_AMOUNT),
      finalAmount: localStorage.getItem(STORAGE_KEYS.FINAL_AMOUNT),
    };

    // Проверяем, есть ли активный чек или товары для сохранения
    const hasReceipt = Boolean(receiptId && receiptNumber);
    const hasItems = receiptItems.length > 0;

    if (!hasReceipt && !hasItems) {
      console.log('Нет данных для сохранения (нет товаров и нет чека)');
      return;
    }

    // Создаем объект с новыми данными
    const newData = {
      [STORAGE_KEYS.RECEIPT_ID]: receiptId,
      [STORAGE_KEYS.RECEIPT_NUMBER]: receiptNumber,
      [STORAGE_KEYS.RECEIPT_ITEMS]: receiptItems,
      [STORAGE_KEYS.TOTAL_AMOUNT]: totalAmount,
      [STORAGE_KEYS.DISCOUNT_AMOUNT]: discountAmount,
      [STORAGE_KEYS.FINAL_AMOUNT]: finalAmount,
    };

    // Проверяем, изменились ли данные
    const currentItemsStr = currentStoredData.items
      ? JSON.parse(currentStoredData.items)
      : [];
    const hasChanges =
      currentStoredData.receiptId !== receiptId ||
      currentStoredData.receiptNumber !== receiptNumber ||
      JSON.stringify(currentItemsStr) !== JSON.stringify(receiptItems) ||
      currentStoredData.totalAmount !== totalAmount?.toString() ||
      currentStoredData.discountAmount !== discountAmount?.toString() ||
      currentStoredData.finalAmount !== finalAmount?.toString();

    if (!hasChanges) {
      console.log('Данные не изменились, пропускаем сохранение');
      return;
    }

    try {
      // Сохраняем только если есть изменения
      Object.entries(newData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const valueToStore =
            typeof value === 'object' ? JSON.stringify(value) : String(value);
          localStorage.setItem(key, valueToStore);
          console.log(`Сохранено ${key}:`, valueToStore);
        }
      });
      console.log('Состояние успешно сохранено в localStorage');
    } catch (error) {
      console.error('Ошибка при сохранении состояния:', error);
    }
  };

  // Восстановление состояния из localStorage
  const restoreStateFromStorage = async (shift: CashShift) => {
    console.log('[restoreStateFromStorage] Начало восстановления состояния:', {
      warehouseId,
      shiftId: shift?.id,
      shiftStatus: shift?.status,
    });

    if (!warehouseId || !shift?.id) {
      console.log(
        '[restoreStateFromStorage] Невозможно восстановить состояние: нет warehouseId или смены'
      );
      return;
    }

    const storedReceiptId = localStorage.getItem(STORAGE_KEYS.RECEIPT_ID);
    const storedItems = localStorage.getItem(STORAGE_KEYS.RECEIPT_ITEMS);
    const storedReceiptNumber = localStorage.getItem(
      STORAGE_KEYS.RECEIPT_NUMBER
    );
    const storedTotalAmount = localStorage.getItem(STORAGE_KEYS.TOTAL_AMOUNT);
    const storedDiscountAmount = localStorage.getItem(
      STORAGE_KEYS.DISCOUNT_AMOUNT
    );
    const storedFinalAmount = localStorage.getItem(STORAGE_KEYS.FINAL_AMOUNT);

    console.log('[restoreStateFromStorage] Данные из localStorage:', {
      receiptId: storedReceiptId,
      items: storedItems,
      receiptNumber: storedReceiptNumber,
      totalAmount: storedTotalAmount,
      discountAmount: storedDiscountAmount,
      finalAmount: storedFinalAmount,
    });

    if (!storedReceiptId || !storedItems) {
      console.log(
        '[restoreStateFromStorage] Нет сохраненных данных для восстановления'
      );
      return;
    }

    try {
      console.log(
        '[restoreStateFromStorage] Получаем детали чека с сервера:',
        storedReceiptId
      );
      const receiptDetails = await cashierApi.getReceiptDetails(
        warehouseId,
        storedReceiptId
      );
      console.log(
        '[restoreStateFromStorage] Получены детали чека:',
        receiptDetails
      );

      if (
        receiptDetails &&
        receiptDetails.status !== 'CANCELLED' &&
        receiptDetails.status !== 'PAID'
      ) {
        console.log(
          '[restoreStateFromStorage] Чек активен, восстанавливаем состояние'
        );

        const parsedItems = JSON.parse(storedItems);
        console.log(
          '[restoreStateFromStorage] Распарсенные товары:',
          parsedItems
        );

        setReceiptId(storedReceiptId);
        setReceiptNumber(storedReceiptNumber || '');
        setReceiptItems(parsedItems);
        setTotalAmount(Number(storedTotalAmount) || 0);
        setDiscountAmount(Number(storedDiscountAmount) || 0);
        setFinalAmount(Number(storedFinalAmount) || 0);

        console.log(
          '[restoreStateFromStorage] Состояние успешно восстановлено'
        );
      } else {
        console.log(
          '[restoreStateFromStorage] Чек не активен, очищаем состояние'
        );
        clearStorageState();
      }
    } catch (error) {
      console.error(
        '[restoreStateFromStorage] Ошибка при восстановлении состояния:',
        error
      );
      clearStorageState();
    }
  };

  // Очистка состояния в localStorage
  const clearStorageState = async () => {
    try {
      console.log('Проверка необходимости очистки состояния в localStorage');

      // Проверяем текущее состояние
      const currentState = {
        receiptId: localStorage.getItem(STORAGE_KEYS.RECEIPT_ID),
        receiptNumber: localStorage.getItem(STORAGE_KEYS.RECEIPT_NUMBER),
        items: localStorage.getItem(STORAGE_KEYS.RECEIPT_ITEMS),
      };

      // Если нет данных, нет необходимости очищать
      if (
        !currentState.receiptId &&
        !currentState.receiptNumber &&
        !currentState.items
      ) {
        console.log('Нет данных для очистки в localStorage');
        return;
      }

      console.log('Текущее состояние перед очисткой:', currentState);

      // Проверяем, связаны ли сохраненные данные с текущей сменой
      if (currentShift && currentState.receiptId) {
        try {
          // Пытаемся получить детали чека
          const receiptDetails = await cashierApi.getReceiptDetails(
            warehouseId!,
            currentState.receiptId
          );

          // Если чек существует и активен, не очищаем хранилище
          if (
            receiptDetails &&
            receiptDetails.status !== 'CANCELLED' &&
            receiptDetails.status !== 'PAID'
          ) {
            console.log('Найден активный чек, пропускаем очистку хранилища');
            return;
          }
        } catch (error) {
          console.log('Не удалось проверить статус чека:', error);
        }
      }

      // Очищаем хранилище
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
        console.log(`Очищен ключ ${key}`);
      });
      console.log('Состояние успешно очищено');
    } catch (error) {
      console.error('Ошибка при очистке состояния:', error);
    }
  };

  // Проверка наличия открытой кассовой смены при загрузке страницы
  const checkCurrentShift = async () => {
    console.log('[checkCurrentShift] Начало проверки текущей смены:', {
      warehouseId,
      currentShift,
    });

    if (!warehouseId) {
      console.log('[checkCurrentShift] warehouseId не определен');
      return;
    }

    try {
      console.log('[checkCurrentShift] Запрос текущей смены с сервера');
      const response = await cashierApi.getCurrentShift(warehouseId);
      console.log('[checkCurrentShift] Ответ от сервера:', response);

      if (response && response.id) {
        console.log('[checkCurrentShift] Проверка статуса смены:', {
          shiftId: response.id,
          status: response.status,
          expectedStatus: 'OPEN',
          areEqual: response.status === 'OPEN',
        });

        if (response.status === 'OPEN') {
          console.log(
            '[checkCurrentShift] Смена открыта, устанавливаем текущую смену'
          );
          setCurrentShift(response);

          // После установки смены пытаемся восстановить состояние
          await restoreStateFromStorage(response);
        } else {
          console.log(
            '[checkCurrentShift] Смена не открыта, статус:',
            response.status
          );
          setCurrentShift(null);
          clearStorageState();
        }
      } else {
        console.log('[checkCurrentShift] Нет активной смены');
        setCurrentShift(null);
        clearStorageState();
      }
    } catch (error) {
      console.error('[checkCurrentShift] Ошибка при проверке смены:', error);
      setCurrentShift(null);
      clearStorageState();
    }
  };

  // Обновляем useEffect для правильного порядка проверок
  useEffect(() => {
    if (warehouseId) {
      // Сначала проверяем смену, она сама вызовет восстановление состояния если смена открыта
      checkCurrentShift();
    }

    // Добавляем обработчик для сохранения состояния при переключении вкладок
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveStateToStorage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [warehouseId]);

  // Сохранение состояния при изменении данных
  useEffect(() => {
    if (warehouseId && currentShift) {
      saveStateToStorage();
    }
  }, [
    warehouseId,
    currentShift,
    receiptItems,
    receiptId,
    receiptNumber,
    totalAmount,
    discountAmount,
    finalAmount,
  ]);

  // Обработчик события перед закрытием/обновлением страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveStateToStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    receiptItems,
    receiptId,
    receiptNumber,
    totalAmount,
    discountAmount,
    finalAmount,
  ]);

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

  const createNewReceipt = async (shift = currentShift) => {
    console.log('Запуск функции createNewReceipt с данными смены:', shift);
    if (!warehouseId) {
      console.error('warehouseId не определен');
      setError('Не выбран склад');
      return null;
    }

    if (!shift) {
      console.error('shift не определен');
      setError('Смена не открыта');
      return null;
    }

    console.log('Создание нового чека:', {
      warehouseId,
      cashShiftId: shift.id,
      cashRegisterId: shift.cashRegister.id,
    });

    setLoading(true);
    try {
      const response = await cashierApi.createReceipt(warehouseId, {
        cashShiftId: shift.id,
        cashRegisterId: shift.cashRegister.id,
      });

      console.log('Чек успешно создан:', response);

      setReceiptId(response.id);
      setReceiptNumber(response.receiptNumber);
      setError(null);
      setLoading(false);
      return response.id;
    } catch (err: any) {
      console.error('Ошибка при создании чека:', err);

      if (err.response) {
        console.error('Детали ошибки:', err.response.status, err.response.data);
        if (err.response.status === 400) {
          setError(
            `Ошибка при создании чека: ${
              err.response.data.message || 'Неверные данные'
            }`
          );
        } else if (err.response.status === 404) {
          setError('Невозможно создать чек: смена не найдена');
        } else if (err.response.status === 403) {
          setError('У вас нет прав для создания чека');
        } else {
          setError(
            `Невозможно создать чек: ${
              err.response.data.message || 'Неизвестная ошибка'
            }`
          );
        }
      } else if (err.request) {
        setError('Сервер не отвечает. Проверьте подключение к интернету.');
      } else {
        setError(
          `Невозможно создать чек: ${err.message || 'Неизвестная ошибка'}`
        );
      }

      setLoading(false);
      return null;
    }
  };

  // Добавление или обновление товара в чеке на сервере
  const addItemToReceiptOnServer = async (
    receiptId: string,
    item: ReceiptItem
  ) => {
    if (!warehouseId || !item.warehouseProductId) {
      console.error('Отсутствует warehouseId или warehouseProductId');
      return null;
    }

    try {
      // Логируем исходные значения
      console.log('Исходные значения:', {
        price: item.price,
        priceType: typeof item.price,
        quantity: item.quantity,
        quantityType: typeof item.quantity,
        discountPercent: item.discountPercent,
        discountPercentType: typeof item.discountPercent,
      });

      // Форматируем числовые значения перед отправкой
      const priceString = item.price.toString();
      const priceFloat = parseFloat(priceString);
      const priceFormatted = priceFloat.toFixed(2);
      const price = Number(priceFormatted);

      const quantity = Number(item.quantity);

      const discountPercentString = (item.discountPercent || 0).toString();
      const discountPercentFloat = parseFloat(discountPercentString);
      const discountPercentFormatted = discountPercentFloat.toFixed(2);
      const discountPercent = Number(discountPercentFormatted);

      // Логируем промежуточные значения форматирования цены
      console.log('Форматирование цены:', {
        priceString,
        priceFloat,
        priceFormatted,
        price,
      });

      // Логируем промежуточные значения форматирования скидки
      console.log('Форматирование скидки:', {
        discountPercentString,
        discountPercentFloat,
        discountPercentFormatted,
        discountPercent,
      });

      const requestData = {
        warehouseProductId: item.warehouseProductId,
        quantity,
        price,
        discountPercent,
      };

      // Логируем финальный объект запроса
      console.log('Отправка запроса на сервер:', {
        requestData,
        priceType: typeof requestData.price,
        quantityType: typeof requestData.quantity,
        discountPercentType: typeof requestData.discountPercent,
      });

      const response = await cashierApi.addItemToReceipt(
        warehouseId,
        receiptId,
        requestData
      );

      console.log('Ответ сервера:', response);
      return response;
    } catch (err) {
      console.error('Ошибка при добавлении/обновлении товара в чеке:', err);
      // Логируем детали ошибки
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as {
          response: {
            status: number;
            data: unknown;
            headers: unknown;
          };
        };
        console.error('Детали ошибки:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
      throw new Error('Не удалось добавить товар в чек');
    }
  };

  const handleProductSelect = async (product: Product) => {
    console.log('Выбран товар:', product);

    if (!currentShift) {
      console.error('Смена не открыта');
      setError('Необходимо открыть кассовую смену перед добавлением товаров');
      return;
    }

    let currentReceiptId = receiptId;

    try {
      // Создаем чек только если его еще нет и добавляется первый товар
      if (!currentReceiptId) {
        console.log('Создание нового чека для первого товара');
        currentReceiptId = await createNewReceipt(currentShift);
        if (!currentReceiptId) {
          console.error('Не удалось создать чек');
          return;
        }
      }

      // Проверяем, есть ли уже такой товар в чеке
      const existingItemIndex = receiptItems.findIndex(
        (item) => item.warehouseProductId === product.id
      );

      if (existingItemIndex !== -1) {
        // Если товар уже есть в чеке, увеличиваем его количество
        const existingItem = receiptItems[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        const itemPrice = Number(
          parseFloat(product.price.toString()).toFixed(2)
        );
        const newAmount = Number((itemPrice * newQuantity).toFixed(2));
        const newDiscountAmount = Number(
          (existingItem.discountAmount || 0).toFixed(2)
        );
        const newFinalAmount = Number(
          (newAmount - newDiscountAmount).toFixed(2)
        );

        // Создаем объект для обновления на сервере
        const updateItem: ReceiptItem = {
          id: existingItem.id,
          name: product.name,
          warehouseProductId: product.id,
          quantity: newQuantity,
          price: itemPrice,
          amount: newAmount,
          discountPercent: Number(
            (existingItem.discountPercent || 0).toFixed(2)
          ),
          discountAmount: newDiscountAmount,
          finalAmount: newFinalAmount,
          type: product.isService ? 'service' : 'product',
        };

        // Обновляем товар на сервере
        const serverResponse = await addItemToReceiptOnServer(
          currentReceiptId,
          updateItem
        );

        // Обновляем локальное состояние
        const updatedItems = [...receiptItems];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          amount: newAmount,
          finalAmount: newFinalAmount,
          serverItemId: serverResponse.id,
        };
        setReceiptItems(updatedItems);
      } else {
        // Создаем объект нового товара для чека
        const itemPrice = Number(
          parseFloat(product.price.toString()).toFixed(2)
        );
        const newItem: ReceiptItem = {
          id: uuidv4(),
          name: product.name,
          price: itemPrice,
          quantity: 1,
          amount: itemPrice,
          discountPercent: 0,
          discountAmount: 0,
          finalAmount: itemPrice,
          type: product.isService ? 'service' : 'product',
          warehouseProductId: product.id,
        };

        // Добавляем товар в чек на сервере
        const serverResponse = await addItemToReceiptOnServer(
          currentReceiptId,
          newItem
        );

        if (serverResponse) {
          // Обновляем локальное состояние с учетом ответа сервера
          setReceiptItems((prevItems) => [
            ...prevItems,
            {
              ...newItem,
              id: serverResponse.id,
              serverItemId: serverResponse.id,
            },
          ]);
        } else {
          throw new Error('Не получен ответ от сервера при добавлении товара');
        }
      }

      // Сбрасываем ошибку при успешном добавлении
      setError(null);
    } catch (error: any) {
      console.error('Ошибка при добавлении товара в чек:', error);
      setError(error.message || 'Не удалось добавить товар в чек');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const itemIndex = receiptItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      console.error('Товар не найден:', itemId);
      return;
    }

    const itemToRemove = receiptItems[itemIndex];
    console.log('Удаление товара:', {
      itemId,
      serverItemId: itemToRemove.serverItemId,
      receiptId,
    });

    // Если чек создан на сервере, удаляем товар с сервера
    if (receiptId && itemToRemove.serverItemId) {
      try {
        console.log('Отправка запроса на удаление товара:', {
          warehouseId,
          receiptId,
          serverItemId: itemToRemove.serverItemId,
        });

        await cashierApi.removeItemFromReceipt(
          warehouseId || '',
          receiptId,
          itemToRemove.serverItemId
        );

        console.log('Товар успешно удален с сервера');

        // Удаляем товар из локального состояния только после успешного удаления с сервера
        const updatedItems = [...receiptItems];
        updatedItems.splice(itemIndex, 1);
        setReceiptItems(updatedItems);
        setSelectedItemId(null); // Сбрасываем выбранный товар
      } catch (err: any) {
        console.error('Ошибка при удалении товара из чека:', err);
        if (err.response) {
          console.error('Детали ошибки:', {
            status: err.response.status,
            data: err.response.data,
          });
        }
        setError(
          `Не удалось удалить товар из чека: ${
            err.response?.data?.message || 'Неизвестная ошибка'
          }`
        );
      }
    } else {
      // Если чек еще не создан или у товара нет serverItemId, просто удаляем из локального состояния
      console.log('Удаление товара только из локального состояния');
      const updatedItems = [...receiptItems];
      updatedItems.splice(itemIndex, 1);
      setReceiptItems(updatedItems);
      setSelectedItemId(null); // Сбрасываем выбранный товар
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    console.log('Начало обновления количества:', {
      itemId,
      newQuantity,
      newQuantityType: typeof newQuantity,
    });

    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const itemIndex = receiptItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    const updatedItems = [...receiptItems];
    const item = updatedItems[itemIndex];

    console.log('Исходные значения товара:', {
      price: item.price,
      priceType: typeof item.price,
      oldQuantity: item.quantity,
      oldQuantityType: typeof item.quantity,
      oldAmount: item.amount,
      oldAmountType: typeof item.amount,
      discountAmount: item.discountAmount,
      discountAmountType: typeof item.discountAmount,
    });

    // Форматируем числовые значения
    item.quantity = newQuantity;
    const newAmount = parseFloat((item.price * newQuantity).toFixed(2));
    item.amount = newAmount;
    const newFinalAmount = parseFloat(
      (newAmount - (item.discountAmount || 0)).toFixed(2)
    );
    item.finalAmount = newFinalAmount;

    console.log('Обновленные значения товара:', {
      newQuantity: item.quantity,
      newQuantityType: typeof item.quantity,
      newAmount: item.amount,
      newAmountType: typeof item.amount,
      newFinalAmount: item.finalAmount,
      newFinalAmountType: typeof item.finalAmount,
    });

    setReceiptItems(updatedItems);

    // Если чек создан на сервере, обновляем товар на сервере
    if (receiptId && item.serverItemId) {
      try {
        console.log('Подготовка данных для отправки на сервер:', {
          warehouseProductId: item.warehouseProductId,
          quantity: newQuantity,
          price: item.price,
          discountPercent: item.discountPercent,
        });

        await cashierApi.addItemToReceipt(warehouseId || '', receiptId, {
          warehouseProductId: item.warehouseProductId || '',
          quantity: newQuantity,
          price: parseFloat(item.price.toString()),
          discountPercent: parseFloat((item.discountPercent || 0).toString()),
        });
      } catch (err) {
        console.error('Ошибка при обновлении количества товара:', err);
        // Логируем детали ошибки
        if (err instanceof Error) {
          console.error('Детали ошибки:', {
            message: err.message,
            stack: err.stack,
          });
        }
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
    const selectedItem = receiptItems.find(
      (item) => item.id === selectedItemId
    );
    if (!selectedItem) {
      return;
    }
    handleRemoveItem(selectedItem.id);
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
    clearStorageState(); // Очищаем состояние в localStorage
  };

  // Обработчик перехода на страницу смены
  const handleGoToShiftPage = () => {
    if (warehouseId) {
      navigate(`/cashier/${warehouseId}/shift`);
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
          Номер чека:{' '}
          {receiptNumber ? receiptNumber.replace('R-', '') : 'Новый чек'}
        </div>
        <ProductSearch
          warehouseId={warehouseId || ''}
          onProductSelect={handleProductSelect}
        />
      </div>

      <div className={styles.mainContent}>
        <div className={styles.tableContainer}>
          <ProductsTable
            items={receiptItems}
            onRemoveItem={handleRemoveItem}
            onUpdateQuantity={handleQuantityChange}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
          />
        </div>

        <TotalPanel
          total={totalAmount || 0}
          received={0}
          change={0}
          onPay={handlePayment}
          onClear={clearReceipt}
          onAddFastProduct={handleAddFastProduct}
          onChangeQuantity={handleChangeQuantity}
          onExtraFunctions={handleExtraFunctions}
          onRemove={handleRemove}
        />
      </div>

      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          totalAmount={finalAmount}
          onSubmit={handlePaymentSubmit}
        />
      )}

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Обработка...</div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
