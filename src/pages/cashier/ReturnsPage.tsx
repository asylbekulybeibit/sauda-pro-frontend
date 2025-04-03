import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { cashierApi } from '../../services/cashierApi';
import { Receipt, ReceiptItem, Product } from '../../types/cashier';
import styles from './ReturnsPage.module.css';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import KeyboardAltIcon from '@mui/icons-material/KeyboardAlt';
import styled from '@emotion/styled';
import VirtualKeyboard from '../../components/cashier/VirtualKeyboard';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  cashRegisterId: string;
  isShared: boolean;
  systemType: string;
  currentBalance: number;
}

const StyledBox = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0px;
`;

const TopSection = styled(Box)`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px 0 0 16px;
`;

const RadioButton = styled(Box)<{ selected?: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  background-color: ${(props) => (props.selected ? '#666' : 'transparent')};
  color: ${(props) => (props.selected ? '#fff' : '#000')};
  border: 1px solid ${(props) => (props.selected ? '#666' : '#ccc')};
`;

const SearchSection = styled(Box)`
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 4px;
  padding: 8px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  padding: 8px;
  font-size: 16px;
  &:focus {
    outline: none;
  }
`;

const ContentSection = styled(Box)`
  flex: 1;
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: auto;
  padding: 20px;
`;

const ReceiptInfoSection = styled(Box)`
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 20px;
`;

const ReceiptHeader = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
`;

const ReceiptHeaderItem = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const ReceiptTable = styled(Box)`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;

  & table {
    width: 100%;
    border-collapse: collapse;
  }

  & th {
    background-color: #f5f5f5;
    padding: 12px;
    text-align: left;
    font-weight: 600;
  }

  & td {
    padding: 12px;
    border-bottom: 1px solid #eee;
  }

  & tr:hover {
    background-color: #f9f9f9;
  }
`;

const BottomSection = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  padding: 32px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
`;

const ReturnAmount = styled(Box)`
  display: flex;
  flex-direction: column;
  color: white;
  min-width: 300px;
`;

const ReturnAmountLabel = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.7);
`;

const ReturnAmountValue = styled.div`
  font-size: 32px;
  font-weight: bold;
`;

const ButtonsGroup = styled(Box)`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled(Button)`
  min-width: 120px;
  height: 48px;
  font-size: 16px;
  text-transform: uppercase;
`;

const ReceiptNumberDialog = styled(Dialog)`
  .MuiDialog-paper {
    width: 400px;
    padding: 20px;
  }
`;

const ReceiptNumberInput = styled(Box)`
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  margin: 20px 0;
  text-align: center;
  font-size: 24px;
  min-height: 40px;
`;

const NumPadGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 20px;
`;

const NumPadButton = styled(Button)`
  height: 60px;
  font-size: 24px;
`;

const ActionButtons = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const ErrorMessage = styled(Typography)`
  color: #dc3545;
  text-align: center;
  margin: 10px 0;
  font-size: 14px;
`;

const ProductList = styled(List)`
  width: 100%;
  background-color: white;
  border-radius: 4px;
  overflow: auto;
`;

const ProductListItem = styled(ListItem)`
  display: flex;
  justify-content: space-between;
  padding: 12px;
  cursor: pointer;
  &:hover {
    background-color: #f5f5f5;
  }
`;

const ProductInfo = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled(Typography)`
  font-weight: bold;
`;

const ProductCode = styled(Typography)`
  color: #666;
  font-size: 0.9em;
`;

const ProductPrice = styled(Typography)`
  font-weight: bold;
  color: #00a65a;
`;

const SearchResultsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ccc;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const SearchResultItem = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background-color: #f9f9f9;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const SelectedProductsList = styled.div`
  width: 100%;
  background: white;
  border-radius: 4px;
  overflow: auto;
`;

const SelectedProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const SelectedProductInfo = styled.div`
  flex: 1;
`;

const SelectedProductName = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const SelectedProductCode = styled.div`
  color: #666;
  font-size: 0.9em;
`;

const SelectedProductActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProductTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  font-weight: bold;
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const TableRow = styled.tr<{ selected?: boolean }>`
  background-color: ${(props: { selected?: boolean }) =>
    props.selected ? '#e8f5e9' : 'white'};
  cursor: pointer;
  &:hover {
    background-color: ${(props: { selected?: boolean }) =>
      props.selected ? '#e8f5e9' : '#f5f5f5'};
  }
`;

const QuantityControlCell = styled(TableCell)`
  padding: 6px 12px;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 240px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  margin: 0 auto;
`;

const QuantityButton = styled.button<{ isPlus?: boolean }>`
  width: 48px;
  height: 48px;
  border: none;
  background-color: ${(props) => {
    if (props.disabled) return '#ccc';
    return props.isPlus ? '#00a65a' : '#dc3545';
  }};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  font-size: 28px;
  border-radius: 6px;
  transition: all 0.2s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background-color: ${(props) => {
      if (props.disabled) return '#ccc';
      return props.isPlus ? '#008d4c' : '#c82333';
    }};
  }

  &:active {
    background-color: ${(props) => {
      if (props.disabled) return '#ccc';
      return props.isPlus ? '#007540' : '#bd2130';
    }};
    transform: ${(props) => (props.disabled ? 'none' : 'scale(0.95)')};
  }
`;

const QuantityValue = styled.span`
  padding: 0 24px;
  font-size: 21px;
  font-weight: bold;
  min-width: 120px;
  text-align: center;
  user-select: none;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
`;

const SuccessDialog = styled(Dialog)`
  .MuiDialog-paper {
    padding: 24px;
    min-width: 320px;
  }
`;

const ReasonDialog = styled.div`
  position: fixed;
  top: 2%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 800px;
  max-width: 95%;
  z-index: 1001;
`;

const ReasonTextArea = styled.textarea`
  width: 100%;
  height: 150px;
  margin: 20px 0;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  resize: none;
  &:focus {
    outline: none;
    border-color: #1890ff;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const DialogButton = styled.button`
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 150px;
  height: 48px;
  border: none;

  &.cancel {
    background-color: #dc3545;
    color: white;
    border: none;

    &:hover {
      background-color: #c82333;
    }
  }

  &.confirm {
    background-color: #1890ff;
    color: white;

    &:hover {
      background-color: #40a9ff;
    }
  }
`;

const ReturnsPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [returnReason, setReturnReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [returnMode, setReturnMode] = useState<
    'withReceipt' | 'withoutReceipt' | null
  >(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [returnAmount, setReturnAmount] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{
      id: string;
      name: string;
      code: string;
      quantity: number;
      price: number;
    }>
  >([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const reasonInputRef = useRef<HTMLTextAreaElement>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [showNumpad, setShowNumpad] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] =
    useState(false);
  const [showReturnReceiptError, setShowReturnReceiptError] = useState(false);

  const handleModeSelect = (mode: 'withReceipt' | 'withoutReceipt') => {
    // Очищаем все данные перед сменой режима
    handleClearAll();

    setReturnMode(mode);
    if (mode === 'withReceipt') {
      setShowReceiptDialog(true);
    }
  };

  const handleNumPadClick = (value: string) => {
    if (showReceiptDialog) {
      // Очищаем ошибку при любом изменении номера чека
      setError(null);

      // Для ввода номера чека
      if (value === 'backspace') {
        setReceiptNumber((prev) => prev.slice(0, -1));
        return;
      }
      setReceiptNumber((prev) => prev + value);
    } else {
      // Для ввода суммы наличных
      if (value === 'backspace') {
        setCashAmount((prev) => prev.slice(0, -1));
        return;
      }
      setCashAmount((prev) => prev + value);
    }
  };

  const handleDelete = () => {
    setError(null);
    setReceiptNumber((prev) => prev.slice(0, -1));
  };

  const handleCancel = () => {
    setReceiptNumber('');
    setShowReceiptDialog(false);
    setReturnMode(null);
    setError(null);
  };

  const handleOk = async () => {
    if (!receiptNumber) {
      setError('Введите номер чека');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const foundReceipts = await cashierApi.searchReceipts(
        warehouseId!,
        receiptNumber
      );

      if (foundReceipts.length === 0) {
        setError('Чек не найден или не оплачен');
        return;
      }

      // Берем первый найденный чек
      const receipt = foundReceipts[0];

      // Получаем детали чека
      const receiptDetails = await cashierApi.getReceiptDetails(
        warehouseId!,
        receipt.id
      );

      if (!receiptDetails || !receiptDetails.items) {
        setError('Не удалось загрузить детали чека');
        return;
      }

      setSelectedReceipt(receipt);
      setReceiptItems(receiptDetails.items);
      setShowReceiptDialog(false);
      setReceiptNumber('');

      // Отображаем информацию о чеке
      const receiptTable = document.querySelector('.receipt-info-table');
      if (receiptTable) {
        receiptTable.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error searching for receipt:', error);
      setError('Ошибка при поиске чека');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (returnMode === 'withoutReceipt' && !showReasonDialog) {
      // Обработка ввода для поля поиска
      if (key === 'backspace') {
        setSearchValue((prev) => prev.slice(0, -1));
      } else {
        setSearchValue((prev) => prev + key);
      }
      // Запускаем поиск при вводе
      searchProducts(
        key === 'backspace' ? searchValue.slice(0, -1) : searchValue + key
      );
    } else if (reasonInputRef.current) {
      // Существующая логика для поля причины возврата
      const start = reasonInputRef.current.selectionStart || 0;
      const end = reasonInputRef.current.selectionEnd || 0;
      const currentValue = reasonInputRef.current.value;

      if (key === 'backspace') {
        if (start !== end) {
          const newValue =
            currentValue.substring(0, start) + currentValue.substring(end);
          setReturnReason(newValue);
          setTimeout(() => {
            reasonInputRef.current?.setSelectionRange(start, start);
            reasonInputRef.current?.focus();
          }, 0);
        } else if (start > 0) {
          const newValue =
            currentValue.substring(0, start - 1) +
            currentValue.substring(start);
          setReturnReason(newValue);
          setTimeout(() => {
            reasonInputRef.current?.setSelectionRange(start - 1, start - 1);
            reasonInputRef.current?.focus();
          }, 0);
        }
      } else {
        const newValue =
          currentValue.substring(0, start) + key + currentValue.substring(end);
        setReturnReason(newValue);
        setTimeout(() => {
          reasonInputRef.current?.setSelectionRange(start + 1, start + 1);
          reasonInputRef.current?.focus();
        }, 0);
      }
    }
  };

  const handleSearch = async () => {
    if (!warehouseId || !searchQuery) {
      setError('Введите номер чека для поиска');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // В реальном приложении тут будет поиск чека по номеру/получение по ID
      // Пока используем временное решение - получение списка чеков и фильтрацию
      const allReceipts = await cashierApi.getReceipts(warehouseId);
      const filtered = allReceipts.filter(
        (receipt: Receipt) =>
          receipt.number.includes(searchQuery) && receipt.status === 'PAID'
      );

      setReceipts(filtered);

      if (filtered.length === 0) {
        setError('Чеков с таким номером не найдено или они не оплачены');
      }
    } catch (err) {
      console.error('Ошибка при поиске чеков:', err);
      setError('Не удалось выполнить поиск чеков');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptSelect = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setSelectedItems({});

    try {
      if (!warehouseId) return;

      const data = await cashierApi.getReceiptDetails(warehouseId, receipt.id);
      setReceiptItems(data.items);
    } catch (err) {
      console.error('Ошибка при загрузке деталей чека:', err);
      setError('Не удалось загрузить детали чека');
      setReceiptItems([]);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const calculateReturnAmount = () => {
    return selectedProducts
      .filter((product) => selectedProductIds.has(product.id))
      .reduce((sum, product) => {
        const quantity = quantities[product.id] || 1;
        return sum + product.price * quantity;
      }, 0);
  };

  const handleReturn = async () => {
    if (returnMode === 'withReceipt') {
      if (!selectedReceipt) {
        setError('Выберите чек для возврата');
        return;
      }

      // Проверяем, является ли чек возвратным
      if (selectedReceipt.finalAmount < 0) {
        setShowReturnReceiptError(true);
        return;
      }

      // Показываем диалог для ввода причины возврата
      setShowReasonDialog(true);
    } else {
      // Существующая логика для возврата без чека
      if (selectedProductIds.size === 0) {
        setError('Выберите товары для возврата');
        return;
      }

      setShowReasonDialog(true);
    }
  };

  const handleFinalReturn = async () => {
    try {
      if (!warehouseId) {
        setError('ID склада не указан');
        return;
      }

      if (
        returnMode === 'withoutReceipt' &&
        (selectedProducts.length === 0 || selectedProductIds.size === 0)
      ) {
        setError('Выберите товары для возврата');
        return;
      }

      // Загружаем методы оплаты и показываем диалог выбора
      await loadPaymentMethods();
      setShowReasonDialog(false);
      setShowKeyboard(false);
      setShowPaymentMethodDialog(true);
    } catch (error: any) {
      console.error('Error in handleFinalReturn:', error);
      setError(error?.message || 'Ошибка при создании возврата');
    }
  };

  const handleReasonSubmit = () => {
    setShowReasonDialog(false);
    setShowPaymentMethodDialog(true);
  };

  const handlePaymentMethodSelect = async () => {
    if (!selectedPaymentMethod) {
      setError('Выберите метод оплаты');
      return;
    }

    // Check if payment method has sufficient balance for return with receipt
    if (returnMode === 'withReceipt' && selectedReceipt) {
      if (
        selectedPaymentMethod.currentBalance <
        Math.abs(selectedReceipt.finalAmount)
      ) {
        setShowInsufficientBalanceModal(true);
        return;
      }
    }

    setShowPaymentMethodDialog(false);

    if (returnMode === 'withReceipt') {
      try {
        if (!warehouseId || !selectedReceipt) {
          setError('Ошибка при возврате');
          return;
        }

        const returnData = {
          items: [],
          reason: returnReason || 'Возврат товара',
          paymentMethodId: selectedPaymentMethod.id,
        };

        await cashierApi.createReturn(
          warehouseId,
          selectedReceipt.id,
          returnData
        );

        // Очищаем состояние
        setSelectedReceipt(null);
        setReceiptItems([]);
        setReturnReason('');
        setError(null);
        setSelectedPaymentMethod(null);

        // Показываем сообщение об успехе
        setSuccess('Возврат успешно выполнен');
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccess(null);
        }, 2000);
      } catch (error: any) {
        console.error('Error creating return:', error);
        setError(error?.message || 'Ошибка при создании возврата');
      }
    } else {
      // Существующая логика для возврата без чека
      handleReturnWithPaymentMethod();
    }
  };

  const loadPaymentMethods = async () => {
    try {
      if (!warehouseId) return;
      const currentShift = await cashierApi.getCurrentShift(warehouseId);
      if (currentShift && currentShift.cashRegister) {
        console.log('Current shift:', currentShift);
        const methods = await cashierApi.getPaymentMethods(
          warehouseId,
          currentShift.cashRegister.id
        );
        console.log('Available payment methods:', methods);
        // Фильтруем методы оплаты - берем только те, которые доступны для текущей кассы
        const availableMethods = methods.filter(
          (method: PaymentMethod) =>
            method.cashRegisterId === currentShift.cashRegister.id ||
            method.isShared
        );
        console.log('Filtered payment methods:', availableMethods);
        setPaymentMethods(availableMethods);
      } else {
        throw new Error('Не удалось получить информацию о текущей смене');
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setError('Не удалось загрузить методы оплаты');
    }
  };

  const handleReturnWithPaymentMethod = async () => {
    try {
      if (!selectedPaymentMethod) {
        setError('Выберите метод оплаты');
        return;
      }

      const returnTotal = calculateReturnAmount();

      // Check if the payment method has sufficient balance
      if (selectedPaymentMethod.currentBalance < returnTotal) {
        setShowInsufficientBalanceModal(true);
        return;
      }

      const preparedItems = selectedProducts
        .filter((product) => selectedProductIds.has(product.id))
        .map((product) => {
          const quantity = Number(quantities[product.id] || 1);
          const price = Number(product.price);
          return {
            productId: product.id,
            quantity,
            price: Number(price.toFixed(2)),
          };
        });

      const preparedReturnData = {
        items: preparedItems,
        reason: returnReason,
        paymentMethodId: selectedPaymentMethod.id,
      };

      if (!warehouseId) {
        throw new Error('ID склада не указан');
      }

      const savedReceipts = await cashierApi.createReturnWithoutReceipt(
        warehouseId,
        preparedReturnData
      );

      // Очищаем состояние после успешного возврата
      setSelectedProducts([]);
      setSelectedProductIds(new Set());
      setQuantities({});
      setReturnReason('');
      setError(null);
      setShowPaymentMethodDialog(false);
      setSelectedPaymentMethod(null);
      setCashAmount('');
      setShowNumpad(false);

      // Показываем модальное окно успешного возврата
      setSuccess('Возврат успешно выполнен');
      setShowSuccessModal(true);

      // Закрываем модальное окно успеха через 2 секунды
      setTimeout(() => {
        setShowSuccessModal(false);
        setSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error creating return:', error);
      setError(error?.message || 'Ошибка при создании возврата');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return '0.00 ₸';
    }
    return `${Number(amount).toFixed(2)} ₸`;
  };

  const formatDiscount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return '0.00';
    }
    return Number(amount).toFixed(2);
  };

  const handleKeyboardCancel = () => {
    setShowKeyboard(false);
  };

  const handleKeyboardOk = () => {
    setShowKeyboard(false);
  };

  const handleReasonInputFocus = () => {
    setShowKeyboard(true);
  };

  const handleProductSelect = (product: any) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts((prev) => [...prev, { ...product, quantity: 1 }]);
    }
    setSearchValue('');
    setSearchResults([]);
    setShowKeyboard(false);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleQuantityChange = (productId: string, change: number) => {
    setQuantities((prev) => {
      const currentQuantity = prev[productId] || 1;
      const newQuantity = Math.max(1, currentQuantity + change);
      console.log('Updating quantity:', {
        productId,
        currentQuantity,
        change,
        newQuantity,
      });
      return {
        ...prev,
        [productId]: newQuantity,
      };
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const searchProducts = async (query: string) => {
    if (!warehouseId || !query) return;

    setLoading(true);
    try {
      const products = await cashierApi.searchProducts(warehouseId, query);
      setSearchResults(products);
      setError(null);
    } catch (err) {
      console.error('Ошибка при поиске товаров:', err);
      setError('Не удалось выполнить поиск товаров');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setError(null);
    if (returnMode === 'withoutReceipt') {
      searchProducts(value);
    }
  };

  const handleDeleteSelected = () => {
    setSelectedProducts((prev) =>
      prev.filter((product) => !selectedProductIds.has(product.id))
    );
    setSelectedProductIds(new Set());
  };

  const calculateChange = () => {
    const inputAmount = parseFloat(cashAmount) || 0;
    const returnTotal = getReturnAmount();
    return Math.max(0, inputAmount - returnTotal);
  };

  const handleClearAll = () => {
    // Очищаем все данные
    setSelectedReceipt(null);
    setReceiptItems([]);
    setSelectedItems({});
    setReturnReason('');
    setError(null);
    setSuccess(null);
    setReturnMode(null);
    setSearchValue('');
    setReceiptNumber('');
    setSearchResults([]);
    setSelectedProducts([]);
    setSelectedProductIds(new Set());
    setQuantities({});
    setReturnAmount(0);
  };

  const getReturnAmount = () => {
    if (returnMode === 'withReceipt' && selectedReceipt) {
      return Number(selectedReceipt.finalAmount) || 0;
    } else if (returnMode === 'withoutReceipt') {
      return calculateReturnAmount();
    }
    return 0;
  };

  useEffect(() => {
    setReturnAmount(calculateReturnAmount());
  }, [selectedProducts]);

  useEffect(() => {
    if (returnMode === 'withoutReceipt' && searchValue) {
      searchProducts(searchValue);
    }
  }, [searchValue, returnMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore input if any dialog is open
      if (showReasonDialog || showPaymentMethodDialog) return;

      // Handle Enter key in withReceipt mode
      if (e.key === 'Enter' && returnMode === 'withReceipt') {
        e.preventDefault();
        handleOk();
        return;
      }

      // Only handle numeric keys and backspace
      if ((e.key >= '0' && e.key <= '9') || e.key === 'Backspace') {
        e.preventDefault(); // Prevent default browser behavior

        // Clear error message when typing or deleting
        setError(null);

        // Handle input based on mode
        if (returnMode === 'withReceipt') {
          // In receipt mode, update receipt number
          if (e.key === 'Backspace') {
            setReceiptNumber((prev) => prev.slice(0, -1));
          } else {
            setReceiptNumber((prev) => prev + e.key);
          }
        } else if (returnMode === 'withoutReceipt') {
          // In without receipt mode, update search value
          if (e.key === 'Backspace') {
            setSearchValue((prev) => prev.slice(0, -1));
          } else {
            setSearchValue((prev) => prev + e.key);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [returnMode, showReasonDialog, showPaymentMethodDialog]);

  return (
    <StyledBox>
      <TopSection>
        <RadioButton
          selected={returnMode === 'withReceipt'}
          onClick={() => handleModeSelect('withReceipt')}
        >
          С ЧЕКОМ
        </RadioButton>
        <RadioButton
          selected={returnMode === 'withoutReceipt'}
          onClick={() => handleModeSelect('withoutReceipt')}
        >
          БЕЗ ЧЕКА
        </RadioButton>
        <SearchSection>
          <Box sx={{ position: 'relative', width: '33.33%' }}>
            <TextField
              fullWidth
              value={searchValue}
              onChange={handleSearchInputChange}
              placeholder="Поиск товара"
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowKeyboard(!showKeyboard)}>
                    <KeyboardAltIcon />
                  </IconButton>
                ),
              }}
            />
            {searchResults.length > 0 && (
              <SearchResultsList>
                {searchResults.map((product) => (
                  <SearchResultItem
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                  >
                    {product.name} ({product.code})
                  </SearchResultItem>
                ))}
              </SearchResultsList>
            )}
          </Box>
        </SearchSection>
      </TopSection>

      <ContentSection>
        {selectedReceipt && (
          <ReceiptInfoSection>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
              }}
            >
              <Typography variant="h6">Информация о чеке</Typography>
              {selectedReceipt && selectedReceipt.finalAmount < 0 && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    color: '#d32f2f',
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 6,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: '1px solid rgba(211, 47, 47, 0.2)',
                    '&::before': {
                      content: '""',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#d32f2f',
                      marginRight: 1,
                      display: 'inline-block',
                    },
                  }}
                >
                  ВОЗВРАТНЫЙ ЧЕК
                </Box>
              )}
            </Box>
            <ReceiptHeader>
              <ReceiptHeaderItem>
                <Typography variant="body2" color="textSecondary">
                  Номер чека:
                </Typography>
                <Typography variant="body1">
                  {selectedReceipt.receiptNumber}
                </Typography>
              </ReceiptHeaderItem>
              <ReceiptHeaderItem>
                <Typography variant="body2" color="textSecondary">
                  Дата:
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedReceipt.createdAt).toLocaleString('ru-RU')}
                </Typography>
              </ReceiptHeaderItem>
              <ReceiptHeaderItem>
                <Typography variant="body2" color="textSecondary">
                  Скидка:
                </Typography>
                <Typography variant="body1">
                  {formatDiscount(selectedReceipt.discountAmount)}
                </Typography>
              </ReceiptHeaderItem>
            </ReceiptHeader>

            <ReceiptTable>
              <table>
                <thead>
                  <tr>
                    <th>НАИМЕНОВАНИЕ</th>
                    <th>ЦЕНА</th>
                    <th>КОЛ-ВО</th>
                    <th>СКИДКА</th>
                    <th>СУММА</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatDiscount(item.discountAmount)}</td>
                      <td>{formatCurrency(item.finalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReceiptTable>
          </ReceiptInfoSection>
        )}
        {error && (
          <Typography color="error" sx={{ p: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
        {returnMode === 'withoutReceipt' && selectedProducts.length > 0 && (
          <ProductTable>
            <thead>
              <tr>
                <TableHeader style={{ width: '40px' }}></TableHeader>
                <TableHeader>НАИМЕНОВАНИЕ</TableHeader>
                <TableHeader style={{ width: '150px' }}>ЦЕНА</TableHeader>
                <TableHeader style={{ width: '300px' }}>КОЛИЧЕСТВО</TableHeader>
                <TableHeader style={{ width: '150px' }}>СУММА</TableHeader>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((product) => (
                <TableRow
                  key={product.id}
                  selected={selectedProductIds.has(product.id)}
                  onClick={() => toggleProductSelection(product.id)}
                >
                  <TableCell>
                    <Checkbox
                      type="checkbox"
                      checked={selectedProductIds.has(product.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleProductSelection(product.id);
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{Number(product.price).toFixed(2)}</TableCell>
                  <QuantityControlCell onClick={(e) => e.stopPropagation()}>
                    <QuantityControl>
                      <QuantityButton
                        onClick={() => handleQuantityChange(product.id, -1)}
                        disabled={(quantities[product.id] || 1) <= 1}
                      >
                        -
                      </QuantityButton>
                      <QuantityValue>
                        {(quantities[product.id] || 1).toFixed(3)}
                      </QuantityValue>
                      <QuantityButton
                        isPlus
                        onClick={() => handleQuantityChange(product.id, 1)}
                      >
                        +
                      </QuantityButton>
                    </QuantityControl>
                  </QuantityControlCell>
                  <TableCell>
                    {(
                      Number(product.price) * (quantities[product.id] || 1)
                    ).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </ProductTable>
        )}
      </ContentSection>

      <BottomSection>
        <ReturnAmount>
          <ReturnAmountLabel>СУММА ВОЗВРАТА</ReturnAmountLabel>
          <ReturnAmountValue>
            {formatCurrency(getReturnAmount())}
          </ReturnAmountValue>
        </ReturnAmount>
        <ButtonsGroup>
          <ActionButton
            variant="contained"
            sx={{ bgcolor: '#666', '&:hover': { bgcolor: '#555' } }}
            onClick={handleClearAll}
          >
            ОТМЕНА
          </ActionButton>
          <ActionButton
            variant="contained"
            color="error"
            onClick={() =>
              returnMode === 'withReceipt'
                ? handleClearAll()
                : handleDeleteSelected()
            }
          >
            УДАЛИТЬ
          </ActionButton>
          <ActionButton
            variant="contained"
            color="success"
            onClick={handleReturn}
          >
            ВОЗВРАТ
          </ActionButton>
        </ButtonsGroup>
      </BottomSection>

      <ReceiptNumberDialog open={showReceiptDialog} onClose={handleCancel}>
        <Typography variant="h6" align="center">
          Номер чека
        </Typography>
        <ReceiptNumberInput>{receiptNumber || '\u00A0'}</ReceiptNumberInput>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <NumPadGrid>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
            <NumPadButton
              key={num}
              variant="contained"
              onClick={() => handleNumPadClick(num.toString())}
              sx={{ bgcolor: '#f0f0f0', color: '#000' }}
            >
              {num}
            </NumPadButton>
          ))}
        </NumPadGrid>
        <ActionButtons>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ height: '60px' }}
          >
            УДАЛИТЬ
          </Button>
          <Button
            variant="contained"
            onClick={handleCancel}
            sx={{ bgcolor: '#666', height: '60px' }}
          >
            ОТМЕНА
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleOk}
            sx={{ height: '60px' }}
            disabled={loading}
          >
            {loading ? 'ПОИСК...' : 'ОК'}
          </Button>
        </ActionButtons>
      </ReceiptNumberDialog>

      {showKeyboard && (
        <VirtualKeyboard
          onKeyPress={handleKeyPress}
          onCancel={handleKeyboardCancel}
          onOk={handleKeyboardOk}
        />
      )}

      <SuccessDialog
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      >
        <DialogTitle sx={{ textAlign: 'center', color: '#28a745' }}>
          Успешно
        </DialogTitle>
        <DialogContent>
          <Typography align="center" sx={{ fontSize: '18px', mt: 2 }}>
            {success || 'Возврат успешно выполнен'}
          </Typography>
        </DialogContent>
      </SuccessDialog>

      {showReasonDialog && (
        <>
          <Overlay onClick={() => setShowReasonDialog(false)} />
          <ReasonDialog>
            <Typography variant="h6" align="center">
              Причина возврата
            </Typography>
            <ReasonTextArea
              ref={reasonInputRef}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Укажите причину возврата (необязательно)"
            />
            <ButtonsGroup>
              <DialogButton
                className="cancel"
                onClick={() => setShowReasonDialog(false)}
              >
                ОТМЕНА
              </DialogButton>
              <DialogButton className="confirm" onClick={handleFinalReturn}>
                ВОЗВРАТ
              </DialogButton>
            </ButtonsGroup>
          </ReasonDialog>
          {showKeyboard && (
            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onCancel={handleKeyboardCancel}
              onOk={handleKeyboardOk}
            />
          )}
        </>
      )}

      {showPaymentMethodDialog && (
        <>
          <Overlay onClick={() => setShowPaymentMethodDialog(false)} />
          <Dialog
            open={showPaymentMethodDialog}
            onClose={() => setShowPaymentMethodDialog(false)}
            PaperProps={{
              style: {
                borderRadius: '8px',
                maxWidth: '1000px',
                width: '100%',
                margin: '20px',
                overflow: 'visible',
              },
            }}
          >
            <DialogTitle
              style={{
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                padding: '24px',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              Выберите метод оплаты для возврата
            </DialogTitle>
            <DialogContent style={{ padding: '24px', overflow: 'visible' }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: '24px',
                }}
              >
                {/* Left side - Payment methods */}
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                    }}
                  >
                    <Button
                      variant={
                        selectedPaymentMethod?.systemType === 'cash'
                          ? 'contained'
                          : 'outlined'
                      }
                      onClick={() => {
                        const cashMethod = paymentMethods.find(
                          (method) => method.systemType === 'cash'
                        );
                        if (cashMethod) {
                          setSelectedPaymentMethod(cashMethod);
                          setCashAmount(calculateReturnAmount().toFixed(2));
                          setShowNumpad(true);
                        }
                      }}
                      sx={{
                        height: '56px',
                        fontSize: '18px',
                        backgroundColor:
                          selectedPaymentMethod?.systemType === 'cash'
                            ? '#1976d2'
                            : 'transparent',
                        color:
                          selectedPaymentMethod?.systemType === 'cash'
                            ? 'white'
                            : '#1976d2',
                        border: '2px solid #1976d2',
                        '&:hover': {
                          backgroundColor:
                            selectedPaymentMethod?.systemType === 'cash'
                              ? '#1565c0'
                              : 'rgba(25, 118, 210, 0.04)',
                          border: '2px solid #1976d2',
                        },
                      }}
                    >
                      НАЛИЧНЫЕ
                    </Button>

                    {paymentMethods
                      .filter((method: PaymentMethod) => method && method.name)
                      .map((method) => (
                        <Button
                          key={method.id}
                          variant={
                            selectedPaymentMethod?.id === method.id
                              ? 'contained'
                              : 'outlined'
                          }
                          onClick={() => {
                            setSelectedPaymentMethod(method);
                            setShowNumpad(false);
                          }}
                          sx={{
                            height: '56px',
                            fontSize: '18px',
                            backgroundColor:
                              selectedPaymentMethod?.id === method.id
                                ? '#1976d2'
                                : 'transparent',
                            color:
                              selectedPaymentMethod?.id === method.id
                                ? 'white'
                                : '#1976d2',
                            border: '2px solid #1976d2',
                            '&:hover': {
                              backgroundColor:
                                selectedPaymentMethod?.id === method.id
                                  ? '#1565c0'
                                  : 'rgba(25, 118, 210, 0.04)',
                              border: '2px solid #1976d2',
                            },
                          }}
                        >
                          {method.name}
                        </Button>
                      ))}
                  </Box>
                </Box>

                {/* Right side - Numpad and amount */}
                <Box sx={{ width: '300px' }}>
                  <Typography
                    sx={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      mb: 2,
                    }}
                  >
                    {getReturnAmount().toFixed(2)} ₸
                  </Typography>

                  {selectedPaymentMethod?.systemType === 'cash' && (
                    <>
                      <TextField
                        fullWidth
                        value={cashAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setCashAmount(value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace') {
                            setCashAmount((prev) => prev.slice(0, -1));
                          }
                        }}
                        label="Сумма наличных"
                        variant="outlined"
                        sx={{ mb: 2 }}
                        InputProps={{
                          sx: { fontSize: '24px', textAlign: 'right' },
                        }}
                      />
                      {parseFloat(cashAmount) > calculateReturnAmount() && (
                        <Typography
                          sx={{
                            color: 'green',
                            mb: 2,
                            fontSize: '18px',
                            textAlign: 'right',
                          }}
                        >
                          Сдача: {calculateChange().toFixed(2)}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'backspace'].map(
                          (num) => (
                            <Button
                              key={num}
                              variant="outlined"
                              onClick={() => handleNumPadClick(num.toString())}
                              sx={{
                                height: '56px',
                                fontSize: '24px',
                              }}
                            >
                              {num === 'backspace' ? '←' : num}
                            </Button>
                          )
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: '12px',
                  p: 3,
                  borderTop: '1px solid #e0e0e0',
                }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setShowPaymentMethodDialog(false);
                    setSelectedPaymentMethod(null);
                    setCashAmount('');
                    setShowNumpad(false);
                    setReturnReason('');
                  }}
                  sx={{
                    height: '56px',
                    fontSize: '18px',
                    backgroundColor: '#dc3545',
                    '&:hover': {
                      backgroundColor: '#c82333',
                    },
                  }}
                >
                  ОТМЕНА
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handlePaymentMethodSelect}
                  disabled={
                    !selectedPaymentMethod ||
                    (selectedPaymentMethod.systemType === 'CASH' &&
                      parseFloat(cashAmount) < getReturnAmount())
                  }
                  sx={{
                    height: '56px',
                    fontSize: '18px',
                    backgroundColor: '#28a745',
                    '&:hover': {
                      backgroundColor: '#218838',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#cccccc',
                    },
                  }}
                >
                  ВОЗВРАТ
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        </>
      )}

      {showInsufficientBalanceModal && (
        <Dialog
          open={showInsufficientBalanceModal}
          onClose={() => setShowInsufficientBalanceModal(false)}
          PaperProps={{
            style: {
              borderRadius: '8px',
              maxWidth: '500px',
              width: '100%',
              margin: '20px',
            },
          }}
        >
          <DialogTitle
            style={{
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              padding: '24px',
              color: '#dc3545',
            }}
          >
            Недостаточно средств
          </DialogTitle>
          <DialogContent style={{ padding: '24px' }}>
            <Typography align="center" style={{ marginBottom: '20px' }}>
              У выбранного метода оплаты недостаточно средств для выполнения
              возврата. Пожалуйста, выберите другой метод оплаты или пополните
              баланс текущего метода.
            </Typography>
            <Box
              sx={{ display: 'flex', justifyContent: 'center', gap: '12px' }}
            >
              <Button
                variant="contained"
                onClick={() => setShowInsufficientBalanceModal(false)}
                sx={{
                  height: '48px',
                  fontSize: '16px',
                  backgroundColor: '#666',
                  '&:hover': {
                    backgroundColor: '#555',
                  },
                }}
              >
                ОК
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Добавляем новый диалог для ошибки возвратного чека */}
      <Dialog
        open={showReturnReceiptError}
        onClose={() => setShowReturnReceiptError(false)}
        PaperProps={{
          style: {
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            margin: '20px',
          },
        }}
      >
        <DialogTitle
          style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            padding: '24px',
            color: '#dc3545',
            borderBottom: '1px solid #eee',
          }}
        >
          Невозможно выполнить возврат
        </DialogTitle>
        <DialogContent style={{ padding: '24px' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: '18px',
                mb: 3,
                color: '#666',
              }}
            >
              Данный чек уже является возвратным. Невозможно выполнить возврат
              по возвратному чеку.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowReturnReceiptError(false)}
              sx={{
                height: '48px',
                fontSize: '16px',
                minWidth: '120px',
                backgroundColor: '#666',
                '&:hover': {
                  backgroundColor: '#555',
                },
              }}
            >
              Понятно
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </StyledBox>
  );
};

export default ReturnsPage;
