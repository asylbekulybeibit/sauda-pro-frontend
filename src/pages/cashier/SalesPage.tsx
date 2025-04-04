import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductSearch from '../../components/cashier/ProductSearch';
import ProductsTable from '../../components/cashier/ProductsTable';
import TotalPanel from '../../components/cashier/TotalPanel';
import PaymentModal from '../../components/cashier/PaymentModal';
import PostponedReceiptsModal from '../../components/cashier/PostponedReceiptsModal';
import InsufficientStockModal from '../../components/cashier/InsufficientStockModal';
import { cashierApi } from '../../services/cashierApi';
import {
  Product,
  ReceiptItem,
  PaymentData,
  CashShift,
  PaymentMethodType,
  Receipt,
} from '../../types/cashier';
import { RegisterPaymentMethod } from '../../types/cash-register';
import { v4 as uuidv4 } from 'uuid';
import styles from './SalesPage.module.css';
import { Snackbar, Alert } from '@mui/material';

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
  const [isPostponedModalOpen, setIsPostponedModalOpen] = useState(false);
  const [postponedReceipts, setPostponedReceipts] = useState<Receipt[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<RegisterPaymentMethod[]>(
    []
  );
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showInsufficientStockModal, setShowInsufficientStockModal] =
    useState(false);
  const [insufficientStockInfo, setInsufficientStockInfo] = useState<{
    productName: string;
    availableQuantity: number;
    requiredQuantity: number;
  } | null>(null);

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
    console.log('[checkCurrentShift] Starting check:', {
      warehouseId,
      currentShift,
      currentShiftId: currentShift?.id,
      currentShiftStatus: currentShift?.status,
      currentShiftCashRegisterId: currentShift?.cashRegister?.id,
    });

    if (!warehouseId) {
      console.log('[checkCurrentShift] warehouseId not defined');
      return;
    }

    try {
      console.log('[checkCurrentShift] Requesting current shift from server');
      const response = await cashierApi.getCurrentShift(warehouseId);
      console.log('[checkCurrentShift] Server response:', {
        response,
        shiftId: response?.id,
        status: response?.status,
        cashRegisterId: response?.cashRegisterId,
        cashRegister: response?.cashRegister,
      });

      if (response && response.id) {
        console.log('[checkCurrentShift] Checking shift status:', {
          shiftId: response.id,
          status: response.status,
          expectedStatus: 'OPEN',
          areEqual: response.status.toLowerCase() === 'open',
          cashRegisterId: response.cashRegisterId,
          cashRegister: response.cashRegister,
        });

        if (response.status.toLowerCase() === 'open') {
          console.log(
            '[checkCurrentShift] Shift is open, setting current shift'
          );
          setCurrentShift(response);

          // После установки смены пытаемся восстановить состояние
          await restoreStateFromStorage(response);
        } else {
          console.log(
            '[checkCurrentShift] Shift is not open, status:',
            response.status
          );
          setCurrentShift(null);
          clearStorageState();
        }
      } else {
        console.log('[checkCurrentShift] No active shift');
        setCurrentShift(null);
        clearStorageState();
      }
    } catch (error) {
      console.error('[checkCurrentShift] Error checking shift:', error);
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
    if (!shift || !warehouseId) return null;

    try {
      // Проверяем, есть ли активный чек
      const existingReceipt = await cashierApi.getCurrentReceipt(warehouseId);

      // Если есть активный чек и он не оплачен/отменен, используем его
      if (existingReceipt && existingReceipt.status === 'CREATED') {
        setCurrentReceipt(existingReceipt);
        setReceiptId(existingReceipt.id);
        setReceiptNumber(existingReceipt.receiptNumber);
        setReceiptItems(existingReceipt.items || []);
        return existingReceipt;
      }

      // Создаем новый чек
      const newReceipt = await cashierApi.createReceipt(warehouseId, {
        cashShiftId: shift.id,
        cashRegisterId: shift.cashRegister.id,
      });

      setCurrentReceipt(newReceipt);
      setReceiptId(newReceipt.id);
      setReceiptNumber(newReceipt.receiptNumber);
      setReceiptItems([]);

      // Сохраняем состояние в localStorage
      saveStateToStorage();

      return newReceipt;
    } catch (error: any) {
      console.error('Error creating new receipt:', error);
      setError(error.message || 'Не удалось создать новый чек');
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

    try {
      // Создаем чек если его еще нет
      let currentReceiptId = receiptId;
      if (!currentReceiptId) {
        console.log('Создание нового чека для первого товара');
        const newReceipt = await createNewReceipt(currentShift);
        if (!newReceipt?.id) {
          console.error('Не удалось создать чек');
          return;
        }
        currentReceiptId = newReceipt.id;
      }

      // Проверяем, есть ли уже такой товар в чеке
      const existingItemIndex = receiptItems.findIndex(
        (item) => item.warehouseProductId === product.id
      );

      if (existingItemIndex !== -1) {
        // Если товар уже есть в чеке, увеличиваем его количество на 1
        const existingItem = receiptItems[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        await handleQuantityChange(existingItem.id, newQuantity);
      } else {
        // Создаем объект нового товара для чека
        const formattedQuantity = Number(Number(1).toFixed(3));
        const formattedPrice = Number(Number(product.price).toFixed(2));
        const formattedAmount = Number(
          (formattedPrice * formattedQuantity).toFixed(2)
        );
        const formattedDiscountPercent = 0;
        const formattedDiscountAmount = 0;
        const formattedFinalAmount = formattedAmount;

        const newItem: ReceiptItem = {
          id: uuidv4(),
          name: product.name,
          price: formattedPrice,
          quantity: formattedQuantity,
          amount: formattedAmount,
          discountPercent: formattedDiscountPercent,
          discountAmount: formattedDiscountAmount,
          finalAmount: formattedFinalAmount,
          type: product.isService ? 'service' : 'product',
          warehouseProductId: product.id,
        };

        // Добавляем товар в чек на сервере
        if (currentReceiptId) {
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
            throw new Error(
              'Не получен ответ от сервера при добавлении товара'
            );
          }
        }

        setError(null);
      }
    } catch (err) {
      console.error('Ошибка при добавлении товара:', err);
      setError('Не удалось добавить товар в чек');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const itemIndex = receiptItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      console.error('Товар не найден:', itemId);
      return;
    }

    const itemToRemove = receiptItems[itemIndex];
    const serverItemId = itemToRemove.serverItemId || itemToRemove.id; // Используем либо serverItemId, либо id

    console.log('Удаление товара:', {
      itemId,
      serverItemId,
      receiptId,
    });

    // Если чек создан на сервере, удаляем товар с сервера
    if (receiptId && serverItemId) {
      try {
        console.log('Отправка запроса на удаление товара:', {
          warehouseId,
          receiptId,
          serverItemId,
        });

        await cashierApi.removeItemFromReceipt(
          warehouseId || '',
          receiptId,
          serverItemId
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

    // Prevent quantity from going below 1
    if (newQuantity < 1) {
      return;
    }

    const itemIndex = receiptItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    const item = receiptItems[itemIndex];
    const oldQuantity = item.quantity; // Сохраняем старое значение ДО любых изменений

    console.log('Исходные значения товара:', {
      price: item.price,
      priceType: typeof item.price,
      oldQuantity,
      oldQuantityType: typeof oldQuantity,
      oldAmount: item.amount,
      oldAmountType: typeof item.amount,
      discountAmount: item.discountAmount,
      discountAmountType: typeof item.discountAmount,
    });

    // Форматируем числовые значения
    const formattedQuantity = Number(Number(newQuantity).toFixed(3));
    const formattedPrice = Number(Number(item.price).toFixed(2));
    const formattedAmount = Number(
      (formattedPrice * formattedQuantity).toFixed(2)
    );
    const formattedDiscountAmount = Number(
      ((formattedAmount * (item.discountPercent || 0)) / 100).toFixed(2)
    );
    const formattedFinalAmount = Number(
      (formattedAmount - formattedDiscountAmount).toFixed(2)
    );

    // Если чек создан на сервере, сначала обновляем товар на сервере
    if (receiptId && item.serverItemId) {
      try {
        // Вычисляем разницу в количестве для отправки на сервер
        const quantityDifference = formattedQuantity - oldQuantity;

        console.log('Подготовка данных для отправки на сервер:', {
          warehouseProductId: item.warehouseProductId,
          quantity: quantityDifference,
          oldQuantity,
          newQuantity: formattedQuantity,
          price: formattedPrice,
          discountPercent: item.discountPercent,
        });

        await cashierApi.addItemToReceipt(warehouseId || '', receiptId, {
          warehouseProductId: item.warehouseProductId || '',
          quantity: quantityDifference,
          price: formattedPrice,
          discountPercent: Number((item.discountPercent || 0).toFixed(2)),
        });

        // После успешного обновления на сервере, обновляем локальное состояние
        const updatedItems = [...receiptItems];
        const updatedItem = updatedItems[itemIndex];
        updatedItem.quantity = formattedQuantity;
        updatedItem.amount = formattedAmount;
        updatedItem.discountAmount = formattedDiscountAmount;
        updatedItem.finalAmount = formattedFinalAmount;

        console.log('Обновленные значения товара:', {
          newQuantity: updatedItem.quantity,
          newQuantityType: typeof updatedItem.quantity,
          newAmount: updatedItem.amount,
          newAmountType: typeof updatedItem.amount,
          newFinalAmount: updatedItem.finalAmount,
          newFinalAmountType: typeof updatedItem.finalAmount,
        });

        setReceiptItems(updatedItems);
      } catch (err) {
        console.error('Ошибка при обновлении количества товара:', err);
        if (err instanceof Error) {
          console.error('Детали ошибки:', {
            message: err.message,
            stack: err.stack,
          });
        }
        setError('Не удалось обновить количество товара');
      }
    } else {
      // Если чек еще не создан на сервере, просто обновляем локальное состояние
      const updatedItems = [...receiptItems];
      const updatedItem = updatedItems[itemIndex];
      updatedItem.quantity = formattedQuantity;
      updatedItem.amount = formattedAmount;
      updatedItem.discountAmount = formattedDiscountAmount;
      updatedItem.finalAmount = formattedFinalAmount;
      setReceiptItems(updatedItems);
    }
  };

  const handlePayment = async () => {
    console.log('handlePayment called:', {
      currentShift,
      warehouseId,
      receiptItems: receiptItems.length,
    });

    if (receiptItems.length === 0) {
      setError('Добавьте товары в чек для оплаты');
      return;
    }

    if (error) {
      setError(null);
    }

    // Обновляем статус смены перед проверкой
    if (warehouseId) {
      try {
        console.log('Fetching current shift for warehouseId:', warehouseId);
        const updatedShift = await cashierApi.getCurrentShift(warehouseId);
        console.log('Received updated shift:', updatedShift);
        if (updatedShift) {
          setCurrentShift(updatedShift);
        }
      } catch (err) {
        console.error('Error updating shift status:', err);
      }
    }

    if (!currentShift) {
      setError('Не удалось загрузить методы оплаты: смена не открыта');
      return;
    }

    if (currentShift.status.toLowerCase() !== 'open') {
      setError('Не удалось загрузить методы оплаты: смена закрыта');
      return;
    }

    // Загружаем методы оплаты при открытии модального окна
    if (currentShift.cashRegister?.id && warehouseId) {
      console.log('Loading payment methods:', {
        warehouseId,
        cashRegisterId: currentShift.cashRegister.id,
        currentShift,
      });

      cashierApi
        .getPaymentMethods(warehouseId, currentShift.cashRegister.id)
        .then((methods) => {
          console.log('Payment methods loaded:', methods);
          setPaymentMethods(methods);
          setIsPaymentModalOpen(true);
        })
        .catch((err) => {
          console.error('Ошибка при загрузке методов оплаты:', err);
          setError('Не удалось загрузить методы оплаты');
        });
    } else {
      console.error('Missing required data:', {
        warehouseId,
        cashRegisterId: currentShift?.cashRegister?.id,
        currentShift,
      });
      setError('Не удалось загрузить методы оплаты: некорректные данные кассы');
    }
  };

  const handlePaymentSubmit = async (paymentData: {
    paymentMethodId: string;
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
          paymentMethodId: paymentData.paymentMethodId,
          amount: paymentData.amount,
        });

        // После успешной оплаты создаем новый чек
        await createNewReceipt();

        // Закрываем модальное окно оплаты
        setIsPaymentModalOpen(false);

        // Очищаем состояние текущего чека
        setReceiptItems([]);

        return true;
      } catch (error: any) {
        console.error('Error processing payment:', error);

        // Проверяем, является ли ошибка связанной с недостатком товара
        if (
          error.response?.data?.message?.includes(
            'Недостаточное количество товара'
          )
        ) {
          const match = error.response.data.message.match(
            /товара "(.+)" на складе\. В наличии: (\d+), требуется: (\d+)/
          );
          if (match) {
            const [, productName, available, required] = match;
            setInsufficientStockInfo({
              productName,
              availableQuantity: parseInt(available),
              requiredQuantity: parseInt(required),
            });
            setShowInsufficientStockModal(true);
            setIsPaymentModalOpen(false);
          }
          return false;
        }

        if (retryCount < 2) {
          // Пробуем обновить статус смены и повторить оплату
          const shift = await cashierApi.getCurrentShift(warehouseId);
          if (shift) {
            setCurrentShift(shift);
            return paymentRequest(retryCount + 1);
          }
        }

        setError(error.message || 'Не удалось обработать оплату');
        return false;
      }
    };

    try {
      const success = await paymentRequest();
      if (success) {
        setShowSuccessSnackbar(true);
        // Автоматически скроем через 2 секунды
        setTimeout(() => setShowSuccessSnackbar(false), 2000);
      }
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

  // Add this function to load postponed receipts
  const loadPostponedReceipts = async () => {
    if (!warehouseId) return;
    try {
      const receipts = await cashierApi.getPostponedReceipts(warehouseId);
      setPostponedReceipts(receipts);
    } catch (error) {
      console.error('Error loading postponed receipts:', error);
      setError('Не удалось загрузить отложенные чеки');
    }
  };

  // Add effect to load postponed receipts when modal opens
  useEffect(() => {
    if (isPostponedModalOpen) {
      loadPostponedReceipts();
    }
  }, [isPostponedModalOpen]);

  // Add function to postpone current receipt
  const handlePostponeReceipt = async () => {
    if (!warehouseId || !receiptId) {
      setError('Нет активного чека для отложения');
      return;
    }

    try {
      await cashierApi.postponeReceipt(warehouseId, receiptId);
      clearReceipt();
      setIsPostponedModalOpen(false);
      await createNewReceipt();
    } catch (error) {
      console.error('Error postponing receipt:', error);
      setError('Не удалось отложить чек');
    }
  };

  // Add function to restore postponed receipt
  const handleRestoreReceipt = async (receipt: Receipt) => {
    if (!warehouseId) return;

    try {
      // Если есть активный чек
      if (receiptId) {
        if (receiptItems.length > 0) {
          // Если в чеке есть товары - откладываем его
          await cashierApi.postponeReceipt(warehouseId, receiptId);
        } else {
          // Если чек пустой - удаляем его
          await cashierApi.deleteReceipt(warehouseId, receiptId);
        }
      }

      // Clear current receipt state
      clearReceipt();

      // Restore the selected postponed receipt
      const restoredReceipt = await cashierApi.restorePostponedReceipt(
        warehouseId,
        receipt.id
      );

      // Update state with restored receipt data, ensuring serverItemId is set correctly
      setReceiptId(restoredReceipt.id);
      setReceiptNumber(restoredReceipt.receiptNumber);
      setReceiptItems(
        restoredReceipt.items.map((item: ReceiptItem) => ({
          ...item,
          serverItemId: item.id, // Сохраняем ID товара с сервера
        }))
      );
      setIsPostponedModalOpen(false);
    } catch (error) {
      console.error('Error restoring receipt:', error);
      setError('Не удалось восстановить отложенный чек');
    }
  };

  // Update the handlePostpone function to open the modal
  const handlePostpone = () => {
    setIsPostponedModalOpen(true);
  };

  // Загрузка методов оплаты при открытии смены
  useEffect(() => {
    if (currentShift?.cashRegister?.id && warehouseId) {
      cashierApi
        .getPaymentMethods(warehouseId, currentShift.cashRegister.id)
        .then((methods) => {
          setPaymentMethods(methods);
        })
        .catch((err) => {
          console.error('Ошибка при загрузке методов оплаты:', err);
          setError('Не удалось загрузить методы оплаты');
        });
    }
  }, [currentShift?.cashRegister?.id, warehouseId]);

  const handleIncreaseQuantity = () => {
    if (selectedItemId) {
      const item = receiptItems.find((item) => item.id === selectedItemId);
      if (item) {
        handleQuantityChange(item.id, item.quantity + 1);
      }
    }
  };

  const handleDecreaseQuantity = () => {
    if (selectedItemId) {
      const item = receiptItems.find((item) => item.id === selectedItemId);
      if (item) {
        handleQuantityChange(item.id, item.quantity - 1);
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
          onPostpone={handlePostpone}
          onIncreaseQuantity={handleIncreaseQuantity}
          onDecreaseQuantity={handleDecreaseQuantity}
        />
      </div>

      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          totalAmount={finalAmount}
          onSubmit={handlePaymentSubmit}
          paymentMethods={paymentMethods}
        />
      )}

      <PostponedReceiptsModal
        isOpen={isPostponedModalOpen}
        onClose={() => setIsPostponedModalOpen(false)}
        onSelect={handleRestoreReceipt}
        onPostpone={handlePostponeReceipt}
        postponedReceipts={postponedReceipts}
      />

      {showInsufficientStockModal && insufficientStockInfo && (
        <InsufficientStockModal
          isOpen={showInsufficientStockModal}
          onClose={() => setShowInsufficientStockModal(false)}
          productName={insufficientStockInfo.productName}
          availableQuantity={insufficientStockInfo.availableQuantity}
          requiredQuantity={insufficientStockInfo.requiredQuantity}
        />
      )}

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Обработка...</div>
        </div>
      )}

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          bottom: '50% !important',
          transform: 'translateY(50%)',
        }}
      >
        <Alert
          severity="success"
          sx={{
            width: '100%',
            fontSize: '1.2rem',
            padding: '1rem 2rem',
            boxShadow: 3,
          }}
        >
          Чек успешно оплачен!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SalesPage;
