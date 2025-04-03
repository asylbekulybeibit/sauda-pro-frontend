import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useShift } from '../../components/cashier/CashierLayout';
import { cashierApi } from '../../services/cashierApi';
import { cashRegistersApi } from '../../services/cashRegistersApi';
import { CashShift, CashRegister } from '../../types/cashier';
import styles from './ShiftPage.module.css';
import { CloseShiftDialog } from '../../components/cashier/CloseShiftDialog';

const ShiftPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const { updateShiftStatus } = useShift(); // Получаем функцию обновления из контекста
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('');
  const [initialAmount, setInitialAmount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

  // Загрузка текущей смены и списка касс при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      if (!warehouseId) return;

      setLoading(true);
      try {
        // Получаем список всех касс
        const registers = await fetchCashRegisters();
        setCashRegisters(registers);

        // Пытаемся получить текущую открытую смену
        try {
          const data = await cashierApi.getCurrentShift(warehouseId);
          setCurrentShift(data);
          // По умолчанию установим финальную сумму равной текущей
          setFinalAmount(
            typeof data.currentAmount === 'number'
              ? data.currentAmount
              : Number(data.currentAmount) || 0
          );
          setError(null);

          // Обновляем статус смены в CashierLayout
          updateShiftStatus().then((shift) => {
            console.log(
              'Обновлен статус смены при загрузке страницы:',
              shift?.status
            );
          });
        } catch (errUnknown: unknown) {
          console.log('Текущая смена не найдена:', errUnknown);
          setCurrentShift(null);

          // Приводим ошибку к типу с response
          const err = errUnknown as {
            response?: {
              status: number;
            };
          };

          // Проверяем, является ли ошибка 404 (смена не найдена)
          const is404Error = err.response && err.response.status === 404;

          if (is404Error) {
            setError(
              'Нет открытой смены. Откройте новую смену для начала работы.'
            );
          } else {
            console.error('Ошибка при получении данных о смене:', errUnknown);
            setError(
              'Не удалось загрузить данные о смене. Пожалуйста, обновите страницу.'
            );
          }

          // Также обновляем статус смены в CashierLayout, даже если произошла ошибка
          updateShiftStatus().then(() => {
            console.log('Обновлен статус смены после ошибки загрузки');
          });
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [warehouseId]);

  // Функция для получения списка касс
  const fetchCashRegisters = async (): Promise<CashRegister[]> => {
    if (!warehouseId) return [];

    try {
      const registers = await cashierApi.getCashRegisters(warehouseId);

      if (!registers || registers.length === 0) {
        setError('Не найдены доступные кассы для данного склада');
      }

      return registers;
    } catch (err) {
      console.error('Ошибка при загрузке списка касс:', err);
      setError('Не удалось загрузить список доступных касс');
      return [];
    }
  };

  const handleOpenShift = async () => {
    if (!warehouseId || !selectedRegisterId) return;

    setLoading(true);
    setError(null);
    try {
      console.log('=== ОТКРЫТИЕ СМЕНЫ ===');
      console.log('warehouseId:', warehouseId);
      console.log('cashRegisterId:', selectedRegisterId);
      console.log('initialAmount:', initialAmount);

      const data = await cashierApi.openShift(warehouseId, {
        cashRegisterId: selectedRegisterId,
        initialAmount: initialAmount,
      });

      console.log('=== ОТВЕТ ОТ СЕРВЕРА (СМЕНА ОТКРЫТА) ===');
      console.log('Данные новой смены (сырые):', JSON.stringify(data));
      console.log('Статус новой смены:', data?.status);

      // Убедимся, что статус в нижнем регистре
      if (data && typeof data.status === 'string') {
        data.status = data.status.toLowerCase();
      }

      // Сразу обновляем статус смены в контексте
      try {
        const updatedShift = await updateShiftStatus();
        console.log('Статус смены обновлен:', updatedShift);

        // Дополнительно проверяем текущую смену
        const currentShiftData = await cashierApi.getCurrentShift(warehouseId);
        console.log('Получены данные текущей смены:', currentShiftData);

        setCurrentShift(currentShiftData);

        // Устанавливаем финальную сумму равной начальной
        setFinalAmount(
          typeof currentShiftData.currentAmount === 'number'
            ? currentShiftData.currentAmount
            : Number(currentShiftData.currentAmount) || initialAmount
        );
      } catch (updateError) {
        console.error('Ошибка при обновлении статуса смены:', updateError);
        throw updateError;
      }
    } catch (err) {
      console.error('=== ОШИБКА ПРИ ОТКРЫТИИ СМЕНЫ ===', err);
      setError(
        'Не удалось открыть смену. Проверьте, что такая смена еще не открыта.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = () => {
    if (!warehouseId || !currentShift) return;
    setIsCloseDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCloseDialogOpen(false);
    // После закрытия диалога обновляем данные
    if (warehouseId) {
      cashierApi.getCurrentShift(warehouseId).then((shift) => {
        setCurrentShift(shift);
        if (!shift) {
          setError(
            'Нет открытой смены. Откройте новую смену для начала работы.'
          );
        }
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className={styles.shiftPage}>
      <h2 className={styles.pageTitle}>Управление сменой</h2>

      {loading ? (
        <div className={styles.loading}>Загрузка данных...</div>
      ) : error && !currentShift ? (
        <div className={styles.noShift}>
          <div className={styles.error}>{error}</div>
          <h2>Открытие смены</h2>
          <div className={styles.formGroup}>
            <label>Выберите кассу:</label>
            <select
              value={selectedRegisterId}
              onChange={(e) => setSelectedRegisterId(e.target.value)}
              className={styles.select}
            >
              <option value="">Выберите кассу</option>
              {cashRegisters.map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Начальная сумма в кассе:</label>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              className={styles.input}
              min="0"
              step="0.01"
            />
          </div>

          <button
            onClick={handleOpenShift}
            className={styles.button}
            disabled={!selectedRegisterId}
          >
            Открыть смену
          </button>
        </div>
      ) : currentShift ? (
        <div className={styles.currentShift}>
          <h2>Информация о текущей смене</h2>

          <div className={styles.shiftInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Касса:</span>
              <span className={styles.value}>
                {currentShift.cashRegister.name}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Кассир:</span>
              <span className={styles.value}>
                {currentShift.cashier?.name || 'Не указан'}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Время начала:</span>
              <span className={styles.value}>
                {formatDateTime(currentShift.startTime)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Начальная сумма:</span>
              <span className={styles.value}>
                {typeof currentShift.initialAmount === 'number'
                  ? currentShift.initialAmount.toFixed(2)
                  : Number(currentShift.initialAmount).toFixed(2)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Текущая сумма:</span>
              <span className={styles.value}>
                {typeof currentShift.currentAmount === 'number'
                  ? currentShift.currentAmount.toFixed(2)
                  : Number(currentShift.currentAmount).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCloseShift}
            className={`${styles.button} ${styles.closeButton}`}
          >
            Закрыть смену
          </button>

          {isCloseDialogOpen && currentShift && warehouseId && (
            <CloseShiftDialog
              open={isCloseDialogOpen}
              onClose={handleCloseDialog}
              shift={currentShift}
              warehouseId={warehouseId}
            />
          )}
        </div>
      ) : (
        <div className={styles.noShift}>
          <div className={styles.info}>
            Нет открытой смены. Откройте новую смену для начала работы.
          </div>
          <h2>Открытие смены</h2>
          <div className={styles.formGroup}>
            <label>Выберите кассу:</label>
            <select
              value={selectedRegisterId}
              onChange={(e) => setSelectedRegisterId(e.target.value)}
              className={styles.select}
            >
              <option value="">Выберите кассу</option>
              {cashRegisters.map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Начальная сумма в кассе:</label>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              className={styles.input}
              min="0"
              step="0.01"
            />
          </div>

          <button
            onClick={handleOpenShift}
            className={styles.button}
            disabled={!selectedRegisterId}
          >
            Открыть смену
          </button>
        </div>
      )}
    </div>
  );
};

export default ShiftPage;
