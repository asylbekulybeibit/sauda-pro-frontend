import React, { useState, useCallback } from 'react';
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
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [closingData, setClosingData] = useState<ShiftClosingData | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleClose = useCallback(() => {
    if (!isLoading) {
      console.log('Закрытие диалога, текущее состояние:', {
        isLoading,
        hasClosingData: !!closingData,
      });
      setNotes('');
      setClosingData(null);
      onClose();
    }
  }, [isLoading, onClose, closingData]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      console.log('Отправка запроса на закрытие смены:', {
        shiftId: shift.id,
        finalAmount: shift.currentAmount,
        notes: notes.trim(),
      });

      const data = await cashierApi.closeShift(warehouseId, {
        shiftId: shift.id,
        finalAmount: shift.currentAmount,
        notes: notes.trim() || undefined,
      });

      console.log('Получены данные о закрытии смены:', data);

      if (!data || !data.warehouse || !data.cashRegister || !data.cashier) {
        throw new Error('Получены неполные данные от сервера');
      }

      console.log('Установка данных в состояние...');
      setClosingData(data);

      enqueueSnackbar('Смена успешно закрыта', { variant: 'success' });

      console.log('Отчет должен отобразиться:', {
        hasClosingData: !!data,
        closingDataId: data.id,
      });
    } catch (error: any) {
      console.error('Ошибка при закрытии смены:', error);
      enqueueSnackbar(error.message || 'Произошла ошибка при закрытии смены', {
        variant: 'error',
      });
      handleClose();
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

  console.log('Рендер диалога:', {
    isOpen: open,
    isLoading,
    hasClosingData: !!closingData,
    closingDataId: closingData?.id,
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          margin: '16px',
          height: 'auto',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {!closingData ? (
        <>
          <DialogTitle>Закрытие смены</DialogTitle>
          <DialogContent>
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
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Закрытие...' : 'Закрыть смену'}
            </Button>
          </DialogActions>
        </>
      ) : (
        <DialogContent sx={{ padding: 0, overflow: 'visible' }}>
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
