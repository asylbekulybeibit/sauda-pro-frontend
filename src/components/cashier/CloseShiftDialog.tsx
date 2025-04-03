import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { cashierApi } from '../../services/cashierApi';
import { ShiftClosingData } from '../../types/cashier';
import { ShiftClosingReport } from './ShiftClosingReport';
import { useSnackbar } from 'notistack';

interface CloseShiftDialogProps {
  open: boolean;
  onClose: () => void;
  shift: {
    id: string;
    currentAmount: number;
  };
  warehouseId: string;
}

export const CloseShiftDialog: React.FC<CloseShiftDialogProps> = ({
  open,
  onClose,
  shift,
  warehouseId,
}) => {
  const [finalAmount, setFinalAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [closingData, setClosingData] = useState<ShiftClosingData | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleClose = () => {
    if (!isLoading) {
      setFinalAmount('');
      setNotes('');
      setClosingData(null);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!finalAmount) {
      enqueueSnackbar('Пожалуйста, введите сумму в кассе', {
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Отправка запроса на закрытие смены:', {
        shiftId: shift.id,
        finalAmount: Number(finalAmount),
        notes: notes.trim(),
      });

      const data = await cashierApi.closeShift(warehouseId, {
        shiftId: shift.id,
        finalAmount: Number(finalAmount),
        notes: notes.trim() || undefined,
      });

      console.log('Получены данные о закрытии смены:', data);

      if (!data) {
        throw new Error('Не получены данные о закрытии смены');
      }

      setClosingData(data);
      enqueueSnackbar('Смена успешно закрыта', { variant: 'success' });
    } catch (error: any) {
      console.error('Ошибка при закрытии смены:', error);
      enqueueSnackbar(error.message || 'Произошла ошибка при закрытии смены', {
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReport = async () => {
    if (!closingData) {
      console.error('Нет данных для печати отчета');
      return;
    }

    try {
      await cashierApi.printShiftReport(warehouseId, closingData.id);
      enqueueSnackbar('Отчет отправлен на печать', { variant: 'success' });
    } catch (error) {
      console.error('Ошибка при печати отчета:', error);
      enqueueSnackbar('Ошибка при печати отчета', { variant: 'error' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: closingData ? '80vh' : 'auto' },
      }}
    >
      {!closingData ? (
        <>
          <DialogTitle>Закрытие смены</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Сумма в кассе"
              type="number"
              fullWidth
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              disabled={isLoading}
              helperText={`Текущая сумма в кассе: ${shift.currentAmount}`}
            />
            <TextField
              margin="dense"
              label="Примечания"
              multiline
              rows={4}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading ? 'Закрытие...' : 'Закрыть смену'}
            </Button>
          </DialogActions>
        </>
      ) : (
        <DialogContent>
          <ShiftClosingReport
            data={closingData}
            onPrint={handlePrintReport}
            onClose={handleClose}
          />
        </DialogContent>
      )}
    </Dialog>
  );
};
