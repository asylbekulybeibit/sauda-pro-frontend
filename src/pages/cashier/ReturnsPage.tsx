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
`;

const BottomSection = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #333;
  border-radius: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

const BottomPanel = styled(Box)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #333;
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ReturnAmount = styled.div`
  font-size: 24px;
  font-weight: bold;
`;

const ReturnButton = styled.button`
  padding: 12px 24px;
  background-color: #00a65a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #008d4c;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
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

  const handleModeSelect = (mode: 'withReceipt' | 'withoutReceipt') => {
    setReturnMode(mode);
    if (mode === 'withReceipt') {
      setShowReceiptDialog(true);
    }
  };

  const handleNumPadClick = (value: string) => {
    if (value === 'backspace') {
      setCashAmount((prev) => prev.slice(0, -1));
      return;
    }
    setCashAmount((prev) => prev + value);
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
    if (!warehouseId) {
      console.error('warehouseId is not defined');
      return;
    }

    setLoading(true);
    try {
      const allReceipts = await cashierApi.getReceipts(warehouseId);
      const receipt = allReceipts.find(
        (r: Receipt) => r.number === receiptNumber && r.status === 'PAID'
      );

      if (receipt) {
        await handleReceiptSelect(receipt);
        setShowReceiptDialog(false);
        setError(null);
      } else {
        setError('Чек не найден или не оплачен');
      }
    } catch (err) {
      setError('Чек не найден или не оплачен');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (reasonInputRef.current) {
      const start = reasonInputRef.current.selectionStart || 0;
      const end = reasonInputRef.current.selectionEnd || 0;
      const currentValue = reasonInputRef.current.value;

      if (key === 'backspace') {
        // Если есть выделенный текст
        if (start !== end) {
          const newValue =
            currentValue.substring(0, start) + currentValue.substring(end);
          setReturnReason(newValue);
          // Устанавливаем курсор в позицию после удаления
          setTimeout(() => {
            reasonInputRef.current?.setSelectionRange(start, start);
            reasonInputRef.current?.focus();
          }, 0);
        }
        // Если нет выделенного текста, удаляем один символ перед курсором
        else if (start > 0) {
          const newValue =
            currentValue.substring(0, start - 1) +
            currentValue.substring(start);
          setReturnReason(newValue);
          // Устанавливаем курсор в позицию после удаления
          setTimeout(() => {
            reasonInputRef.current?.setSelectionRange(start - 1, start - 1);
            reasonInputRef.current?.focus();
          }, 0);
        }
      } else {
        // Обычный ввод символа
        const newValue =
          currentValue.substring(0, start) + key + currentValue.substring(end);
        setReturnReason(newValue);
        // Устанавливаем курсор после вставленного символа
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
      .reduce((sum, product) => sum + product.price * product.quantity, 0);
  };

  const handleReturn = async () => {
    if (selectedProductIds.size === 0) {
      setError('Выберите товары для возврата');
      return;
    }

    setShowReasonDialog(true);
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

  const handleFinalReturn = async () => {
    try {
      if (!warehouseId) {
        setError('ID склада не указан');
        return;
      }

      if (selectedProducts.length === 0 || selectedProductIds.size === 0) {
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

  const handleReturnWithPaymentMethod = async () => {
    try {
      if (!selectedPaymentMethod) {
        setError('Выберите метод оплаты');
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
        cashAmount:
          selectedPaymentMethod.systemType === 'CASH'
            ? parseFloat(cashAmount)
            : undefined,
      };

      if (!warehouseId) {
        throw new Error('ID склада не указан');
      }

      await cashierApi.createReturnWithoutReceipt(
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

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ₽`;
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
    const returnTotal = calculateReturnAmount();
    return Math.max(0, inputAmount - returnTotal);
  };

  useEffect(() => {
    setReturnAmount(calculateReturnAmount());
  }, [selectedProducts]);

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

      <BottomPanel>
        <ReturnAmount>
          СУММА ВОЗВРАТА: {calculateReturnAmount().toFixed(2)}
        </ReturnAmount>
        <ButtonGroup>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#dc3545',
              '&:hover': { bgcolor: '#c82333' },
              minWidth: '120px',
              height: '48px',
              fontSize: '16px',
            }}
            onClick={handleDeleteSelected}
            disabled={selectedProductIds.size === 0}
          >
            УДАЛИТЬ
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#28a745',
              '&:hover': { bgcolor: '#218838' },
              minWidth: '120px',
              height: '48px',
              fontSize: '16px',
            }}
            onClick={handleReturn}
            disabled={selectedProductIds.size === 0}
          >
            ВОЗВРАТ
          </Button>
        </ButtonGroup>
      </BottomPanel>

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
              onFocus={handleReasonInputFocus}
              placeholder="Укажите причину возврата (необязательно)"
            />
            <ButtonGroup>
              <DialogButton
                className="cancel"
                onClick={() => setShowReasonDialog(false)}
              >
                ОТМЕНА
              </DialogButton>
              <DialogButton className="confirm" onClick={handleFinalReturn}>
                ВОЗВРАТ
              </DialogButton>
            </ButtonGroup>
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
                    {calculateReturnAmount().toFixed(2)} ₸
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
                  onClick={handleReturnWithPaymentMethod}
                  disabled={
                    !selectedPaymentMethod ||
                    (selectedPaymentMethod.systemType === 'CASH' &&
                      parseFloat(cashAmount) < calculateReturnAmount())
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
    </StyledBox>
  );
};

export default ReturnsPage;
