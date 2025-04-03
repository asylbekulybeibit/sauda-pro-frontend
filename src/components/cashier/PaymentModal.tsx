import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  Typography,
  TextField,
} from '@mui/material';
import { RegisterPaymentMethod } from '../../types/cash-register';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSubmit: (paymentData: {
    paymentMethodId: string;
    amount: number;
    change?: number;
  }) => void;
  paymentMethods: RegisterPaymentMethod[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onSubmit,
  paymentMethods,
}) => {
  const [selectedMethod, setSelectedMethod] =
    useState<RegisterPaymentMethod | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>(
    totalAmount.toFixed(2)
  );
  const [change, setChange] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showNumpad, setShowNumpad] = useState(false);

  // Recalculate change when received amount changes
  useEffect(() => {
    if (selectedMethod?.systemType === 'cash') {
      const received = parseFloat(receivedAmount);
      const changeAmount = received - totalAmount;
      setChange(changeAmount >= 0 ? changeAmount : 0);
    } else {
      setChange(0);
    }
  }, [receivedAmount, totalAmount, selectedMethod]);

  // Handle payment confirmation
  const handleSubmit = () => {
    if (!selectedMethod) {
      setError('Выберите метод оплаты');
      return;
    }

    if (selectedMethod.systemType === 'cash') {
      const received = parseFloat(receivedAmount);
      if (isNaN(received) || received < totalAmount) {
        setError('Полученная сумма должна быть не меньше суммы чека');
        return;
      }
    }

    onSubmit({
      paymentMethodId: selectedMethod.id,
      amount:
        selectedMethod.systemType === 'cash'
          ? parseFloat(receivedAmount)
          : totalAmount,
      change: selectedMethod.systemType === 'cash' ? change : 0,
    });
  };

  // Handle received amount change
  const handleReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setReceivedAmount(value);
      setError(null);
    }
  };

  // Handle numpad click
  const handleNumPadClick = (value: string) => {
    if (value === 'backspace') {
      setReceivedAmount((prev) => prev.slice(0, -1));
    } else {
      setReceivedAmount((prev) => prev + value);
    }
    setError(null);
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ₸`;
  };

  // Get payment method name
  const getPaymentMethodName = (method: RegisterPaymentMethod) => {
    if (method.source === 'system') {
      switch (method.systemType) {
        case 'cash':
          return 'НАЛИЧНЫЕ';
        case 'card':
          return 'КАРТА';
        case 'qr':
          return 'QR-КОД';
        default:
          return method.systemType;
      }
    }
    return method.name;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
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
          padding: '16px 24px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        Оплата
      </DialogTitle>
      <DialogContent style={{ padding: '16px 24px', overflow: 'visible' }}>
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
                  selectedMethod?.systemType === 'cash'
                    ? 'contained'
                    : 'outlined'
                }
                onClick={() => {
                  const cashMethod = paymentMethods.find(
                    (method) => method.systemType === 'cash'
                  );
                  if (cashMethod) {
                    setSelectedMethod(cashMethod);
                    setReceivedAmount(totalAmount.toFixed(2));
                    setShowNumpad(true);
                  }
                }}
                sx={{
                  height: '56px',
                  fontSize: '18px',
                  backgroundColor:
                    selectedMethod?.systemType === 'cash'
                      ? '#1976d2'
                      : 'transparent',
                  color:
                    selectedMethod?.systemType === 'cash' ? 'white' : '#1976d2',
                  border: '2px solid #1976d2',
                  '&:hover': {
                    backgroundColor:
                      selectedMethod?.systemType === 'cash'
                        ? '#1565c0'
                        : 'rgba(25, 118, 210, 0.04)',
                    border: '2px solid #1976d2',
                  },
                }}
              >
                НАЛИЧНЫЕ
              </Button>

              {paymentMethods
                .filter(
                  (method) =>
                    method && method.name && method.systemType !== 'cash'
                )
                .map((method) => (
                  <Button
                    key={method.id}
                    variant={
                      selectedMethod?.id === method.id
                        ? 'contained'
                        : 'outlined'
                    }
                    onClick={() => {
                      setSelectedMethod(method);
                      setShowNumpad(false);
                    }}
                    sx={{
                      height: '56px',
                      fontSize: '18px',
                      backgroundColor:
                        selectedMethod?.id === method.id
                          ? '#1976d2'
                          : 'transparent',
                      color:
                        selectedMethod?.id === method.id ? 'white' : '#1976d2',
                      border: '2px solid #1976d2',
                      '&:hover': {
                        backgroundColor:
                          selectedMethod?.id === method.id
                            ? '#1565c0'
                            : 'rgba(25, 118, 210, 0.04)',
                        border: '2px solid #1976d2',
                      },
                    }}
                  >
                    {getPaymentMethodName(method)}
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
              {formatCurrency(totalAmount)}
            </Typography>

            {selectedMethod?.systemType === 'cash' && (
              <>
                <TextField
                  fullWidth
                  value={receivedAmount}
                  onChange={handleReceivedChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      setReceivedAmount((prev) => prev.slice(0, -1));
                    }
                  }}
                  label="Сумма наличных"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { fontSize: '24px', textAlign: 'right' },
                  }}
                />
                {parseFloat(receivedAmount) > totalAmount && (
                  <Typography
                    sx={{
                      color: 'green',
                      mb: 2,
                      fontSize: '18px',
                      textAlign: 'right',
                    }}
                  >
                    Сдача: {change.toFixed(2)}
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

        {error && (
          <Typography
            color="error"
            sx={{
              mt: 2,
              p: 1,
              bgcolor: '#fff2f0',
              borderRadius: 1,
            }}
          >
            {error}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            gap: '12px',
            p: 3,
            borderTop: '1px solid #e0e0e0',
            mt: 3,
          }}
        >
          <Button
            variant="contained"
            fullWidth
            onClick={onClose}
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
            onClick={handleSubmit}
            disabled={
              !selectedMethod ||
              (selectedMethod.systemType === 'cash' &&
                parseFloat(receivedAmount) < totalAmount)
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
            ОПЛАТИТЬ
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
