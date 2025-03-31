import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CashierLayout, {
  useShift,
} from '../../components/cashier/CashierLayout';
import { cashierApi } from '../../services/cashierApi';
import { CashShift, CashRegister } from '../../types/cashier';
import styles from './ShiftPage.module.css';

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
      console.log('Тип статуса:', typeof data?.status);

      // Убедимся, что статус в нижнем регистре
      if (data && typeof data.status === 'string') {
        data.status = data.status.toLowerCase();
        console.log('Нормализованный статус:', data.status);
      }

      setCurrentShift(data);
      console.log('Установлен локальный currentShift:', data);

      // Обновляем статус смены в CashierLayout с небольшой задержкой
      console.log('=== ОБНОВЛЕНИЕ СТАТУСА СМЕНЫ В LAYOUT ===');
      setTimeout(async () => {
        try {
          const updatedShift = await updateShiftStatus();
          console.log('Статус обновлен, получена смена:', updatedShift);

          if (updatedShift) {
            console.log('Статус обновленной смены:', updatedShift.status);
          } else {
            console.warn('Не удалось получить обновленную смену');
          }
        } catch (updateError) {
          console.error('Ошибка при обновлении статуса:', updateError);
        }
      }, 100); // Небольшая задержка для обеспечения обновления

      // Устанавливаем финальную сумму равной начальной
      setFinalAmount(
        typeof data.currentAmount === 'number'
          ? data.currentAmount
          : Number(data.currentAmount) || initialAmount
      );
      console.log('Установлена финальная сумма:', finalAmount);
    } catch (err) {
      console.error('=== ОШИБКА ПРИ ОТКРЫТИИ СМЕНЫ ===', err);
      setError(
        'Не удалось открыть смену. Проверьте, что такая смена еще не открыта.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!warehouseId || !currentShift) return;

    console.log('=== ЗАКРЫТИЕ СМЕНЫ ===');
    console.log('warehouseId:', warehouseId);
    console.log('shiftId:', currentShift.id);
    console.log('finalAmount:', finalAmount);
    console.log('notes:', notes);

    setLoading(true);
    setError(null);
    try {
      console.log('Вызов API для закрытия смены...');
      const response = await cashierApi.closeShift(warehouseId, {
        shiftId: currentShift.id,
        finalAmount: Number(finalAmount),
        notes: notes,
      });

      console.log('=== ОТВЕТ ОТ СЕРВЕРА (СМЕНА ЗАКРЫТА) ===');
      console.log('Данные закрытой смены:', response);
      console.log('Статус закрытой смены:', response?.status);

      setCurrentShift(null);
      console.log('Сброшен локальный currentShift на null');

      // Обновляем статус смены в CashierLayout с небольшой задержкой
      console.log('=== ОБНОВЛЕНИЕ СТАТУСА СМЕНЫ В LAYOUT ===');
      setTimeout(async () => {
        try {
          const updatedShift = await updateShiftStatus();
          console.log('Статус обновлен, новая смена:', updatedShift);
        } catch (updateError) {
          console.error('Ошибка при обновлении статуса:', updateError);
        }
      }, 100); // Небольшая задержка для обеспечения обновления

      // Сбрасываем поля формы
      setInitialAmount(0);
      setFinalAmount(0);
      setNotes('');
      setSelectedRegisterId('');
      console.log('Поля формы сброшены');
    } catch (err) {
      console.error('=== ОШИБКА ПРИ ЗАКРЫТИИ СМЕНЫ ===', err);
      console.log(
        'Тип ошибки:',
        err instanceof Error ? err.constructor.name : typeof err
      );
      console.log('Данные ошибки:', err);

      setError('Не удалось закрыть смену. Проверьте введенные данные.');
    } finally {
      setLoading(false);
      console.log('=== ЗАВЕРШЕНО ЗАКРЫТИЕ СМЕНЫ ===');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <CashierLayout>
      <div className={styles.shiftPage}>
        <h1 className={styles.pageTitle}>Управление сменой</h1>

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
                  {currentShift.cashier.name}
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

            <h2>Закрытие смены</h2>

            <div className={styles.formGroup}>
              <label>Финальная сумма в кассе:</label>
              <input
                type="number"
                value={finalAmount}
                onChange={(e) => setFinalAmount(Number(e.target.value))}
                className={styles.input}
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Примечания:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.textarea}
                placeholder="Укажите дополнительную информацию о смене, например, причину расхождения"
              />
            </div>

            <button
              onClick={handleCloseShift}
              className={`${styles.button} ${styles.closeButton}`}
            >
              Закрыть смену
            </button>
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
    </CashierLayout>
  );
};

export default ShiftPage;
