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

      // Если смена была закрыта (есть данные о закрытии), очищаем localStorage
      if (closingData) {
        clearReceiptStorage();
      }

      setNotes('');
      setClosingData(null);
      onClose();
    }
  }, [isLoading, onClose, closingData]);

  /**
   * Очистка данных о текущем чеке из localStorage
   */
  const clearReceiptStorage = () => {
    try {
      console.log('[CloseShiftDialog] Очистка данных о чеке из localStorage');

      // Текущие ключи, используемые в SalesPage для хранения данных о чеке
      const CURRENT_STORAGE_KEYS = {
        RECEIPT_ID: 'cashier_receipt_id',
        RECEIPT_NUMBER: 'cashier_receipt_number',
        RECEIPT_ITEMS: 'cashier_receipt_items',
        TOTAL_AMOUNT: 'cashier_total_amount',
        DISCOUNT_AMOUNT: 'cashier_discount_amount',
        FINAL_AMOUNT: 'cashier_final_amount',
      };

      // Старые/устаревшие ключи, которые могли использоваться ранее
      const LEGACY_STORAGE_KEYS = {
        RECEIPT_ID: 'SAUDA_PRO_RECEIPT_ID',
        RECEIPT_NUMBER: 'SAUDA_PRO_RECEIPT_NUMBER',
        RECEIPT_ITEMS: 'SAUDA_PRO_RECEIPT_ITEMS',
        TOTAL_AMOUNT: 'SAUDA_PRO_TOTAL_AMOUNT',
        DISCOUNT_AMOUNT: 'SAUDA_PRO_DISCOUNT_AMOUNT',
        FINAL_AMOUNT: 'SAUDA_PRO_FINAL_AMOUNT',
      };

      // Очищаем текущие ключи
      Object.values(CURRENT_STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
        console.log(
          `[CloseShiftDialog] Удален текущий ключ из localStorage: ${key}`
        );
      });

      // Очищаем устаревшие ключи
      Object.values(LEGACY_STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
        console.log(
          `[CloseShiftDialog] Удален устаревший ключ из localStorage: ${key}`
        );
      });

      console.log('[CloseShiftDialog] Хранилище успешно очищено');
    } catch (error) {
      console.error(
        '[CloseShiftDialog] Ошибка при очистке localStorage:',
        error
      );
      // Продолжаем работу даже при ошибке очистки хранилища
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      console.log('Проверка наличия незакрытого чека перед закрытием смены...');

      // Проверяем наличие открытого чека и удаляем его перед закрытием смены
      try {
        console.log(
          `[DEBUG] Запрашиваем текущий чек для склада: ${warehouseId}`
        );
        const currentReceipt = await cashierApi.getCurrentReceipt(warehouseId);
        console.log(
          `[DEBUG] Получен ответ от getCurrentReceipt:`,
          currentReceipt
        );

        if (currentReceipt) {
          console.log(`[DEBUG] Текущий чек найден:`, {
            id: currentReceipt.id,
            status: currentReceipt.status,
            statusType: typeof currentReceipt.status,
            statusLower:
              typeof currentReceipt.status === 'string'
                ? currentReceipt.status.toLowerCase()
                : null,
            receiptNumber: currentReceipt.receiptNumber,
          });

          // Проверяем статус с учетом нижнего регистра
          // В базе данных статус хранится как 'created' в нижнем регистре
          const currentStatus =
            typeof currentReceipt.status === 'string'
              ? currentReceipt.status.toLowerCase()
              : String(currentReceipt.status).toLowerCase();

          const isCreated = currentStatus === 'created';

          console.log(
            `[DEBUG] Проверка статуса чека: текущий="${currentStatus}", isCreated=${isCreated}`
          );

          if (isCreated) {
            console.log(
              `[DEBUG] Найден открытый чек в статусе "created" (${currentReceipt.status}), удаляем его перед закрытием смены:`,
              currentReceipt.id
            );

            try {
              const startTime = new Date().getTime();
              const deleteResponse = await cashierApi.deleteReceipt(
                warehouseId,
                currentReceipt.id,
                true
              );
              const endTime = new Date().getTime();
              console.log(
                `[DEBUG] Ответ на запрос удаления чека (${
                  endTime - startTime
                }ms):`,
                deleteResponse
              );
              console.log('Открытый чек успешно удален');

              // Дополнительная проверка, что чек действительно удален
              try {
                const checkReceipt = await cashierApi.getSalesReceiptDetails(
                  warehouseId,
                  currentReceipt.id
                );
                if (checkReceipt) {
                  console.warn(
                    '[DEBUG] ВНИМАНИЕ: Чек всё еще можно найти в базе после удаления!',
                    checkReceipt
                  );
                } else {
                  console.log(
                    '[DEBUG] Проверка подтвердила, что чек полностью удален из базы'
                  );
                }
              } catch (checkError) {
                console.log(
                  '[DEBUG] Ошибка при проверке удаления чека (это нормально, если чек удален):',
                  checkError
                );
              }
            } catch (error: any) {
              console.error('[DEBUG] Ошибка при удалении чека:', error);

              if (error.response) {
                console.error('[DEBUG] Детали ошибки:', {
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  data: error.response?.data,
                  headers: error.response?.headers,
                  config: {
                    url: error.response?.config?.url,
                    method: error.response?.config?.method,
                    params: error.response?.config?.params,
                  },
                });

                // Проверяем особые случаи ошибок
                if (
                  error.response.status === 400 &&
                  error.response.data?.message ===
                    'Нельзя удалить чек с товарами'
                ) {
                  console.warn(
                    '[DEBUG] Не удалось удалить чек, так как он содержит товары'
                  );
                }
              } else if (error.request) {
                console.error(
                  '[DEBUG] Ошибка запроса (нет ответа):',
                  error.request
                );
              } else {
                console.error(
                  '[DEBUG] Ошибка настройки запроса:',
                  error.message
                );
              }

              // Пробуем повторно удалить чек после небольшой задержки
              try {
                console.log(
                  '[DEBUG] Повторная попытка удаления чека после задержки...'
                );
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const retryResponse = await cashierApi.deleteReceipt(
                  warehouseId,
                  currentReceipt.id,
                  true
                );
                console.log(
                  '[DEBUG] Повторное удаление успешно:',
                  retryResponse
                );
              } catch (retryError) {
                console.error(
                  '[DEBUG] Ошибка при повторном удалении чека:',
                  retryError
                );
                // Продолжаем даже при ошибке повторного удаления
              }
            }
          } else {
            console.log(
              `[DEBUG] Найденный чек имеет статус ${currentReceipt.status}, пропускаем удаление`
            );
          }
        } else {
          console.log('[DEBUG] Текущий чек не найден');
        }
      } catch (receiptError) {
        console.warn(
          'Ошибка при проверке или удалении открытого чека:',
          receiptError
        );
        // Продолжаем закрытие смены даже при ошибке удаления чека
      }

      // Проверяем наличие отложенных чеков и удаляем их перед закрытием смены
      if (warehouseId) {
        try {
          const postponedResponse = await cashierApi.getPostponedReceipts(
            warehouseId
          );

          // Проверяем, что результат - массив, и используем его напрямую
          // функция API возвращает массив чеков, а не объект с полем data
          const postponedReceipts = Array.isArray(postponedResponse)
            ? postponedResponse
            : [];
          console.log(
            `[DEBUG] Найдено ${postponedReceipts.length} отложенных чеков для удаления:`
          );

          // Подробный вывод списка отложенных чеков
          postponedReceipts.forEach((receipt: any, index: number) => {
            const statusType = typeof receipt.status;
            const statusLower = String(receipt.status).toLowerCase();
            const statusUpper = String(receipt.status).toUpperCase();
            console.log(
              `[DEBUG] Отложенный чек #${index + 1}: id=${receipt.id}, номер=${
                receipt.receiptNumber
              }, статус=${
                receipt.status
              }, тип=${statusType}, нижний регистр=${statusLower}, верхний=${statusUpper}`
            );
          });

          for (const receipt of postponedReceipts) {
            console.log(`Удаление отложенного чека: ${receipt.id}`);
            try {
              const startTime = new Date().getTime();
              const deleteResponse = await cashierApi.deleteReceipt(
                warehouseId,
                receipt.id,
                true
              );
              const endTime = new Date().getTime();
              console.log(
                `[DEBUG] Отложенный чек ${receipt.id} удален (${
                  endTime - startTime
                }ms): статус=${receipt.status}`,
                deleteResponse
              );

              // Отладочная информация о статусе чека
              const receiptStatus =
                typeof receipt.status === 'string'
                  ? receipt.status.toLowerCase()
                  : String(receipt.status).toLowerCase();

              console.log(
                `[DEBUG] Проверка статуса отложенного чека: ${receiptStatus}, должен быть 'postponed'`
              );

              // Дополнительная проверка, что чек действительно удален
              try {
                const checkReceipt = await cashierApi.getSalesReceiptDetails(
                  warehouseId,
                  receipt.id
                );
                if (checkReceipt) {
                  console.warn(
                    '[DEBUG] ВНИМАНИЕ: Отложенный чек всё еще можно найти в базе после удаления!',
                    checkReceipt
                  );
                } else {
                  console.log(
                    '[DEBUG] Проверка подтвердила, что отложенный чек полностью удален из базы'
                  );
                }
              } catch (checkError) {
                console.log(
                  '[DEBUG] Ошибка при проверке удаления отложенного чека (это нормально, если чек удален):',
                  checkError
                );
              }
            } catch (error: any) {
              console.error(
                `[DEBUG] Ошибка при удалении отложенного чека ${receipt.id}:`,
                error
              );
              if (error.response) {
                console.error('[DEBUG] Детали ошибки:', {
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  data: error.response?.data,
                  headers: error.response?.headers,
                  config: {
                    url: error.response?.config?.url,
                    method: error.response?.config?.method,
                    params: error.response?.config?.params,
                  },
                });
              }

              // Пробуем повторно удалить чек после небольшой задержки
              try {
                console.log(
                  `[DEBUG] Повторная попытка удаления отложенного чека ${receipt.id} после задержки...`
                );
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const retryResponse = await cashierApi.deleteReceipt(
                  warehouseId,
                  receipt.id,
                  true
                );
                console.log(
                  '[DEBUG] Повторное удаление отложенного чека успешно:',
                  retryResponse
                );
              } catch (retryError) {
                console.error(
                  `[DEBUG] Ошибка при повторном удалении отложенного чека ${receipt.id}:`,
                  retryError
                );
                // Продолжаем со следующим чеком даже при ошибке повторного удаления
              }
            }
          }

          console.log('Все отложенные чеки успешно удалены');
        } catch (postponedError) {
          console.warn(
            'Ошибка при проверке или удалении отложенных чеков:',
            postponedError
          );
          // Продолжаем закрытие смены даже при ошибке удаления отложенных чеков
        }
      }

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

      // Очищаем данные о чеке из localStorage, чтобы предотвратить использование удаленного чека в новой смене
      clearReceiptStorage();

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
