import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CashierLayout from '../../components/cashier/CashierLayout';
import { cashierApi } from '../../services/cashierApi';
import { CashShift, CashRegister } from '../../types/cashier';
import styles from './ShiftPage.module.css';

const ShiftPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
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
          setFinalAmount(data.currentAmount);
          setError(null);
        } catch (err) {
          console.error('Текущая смена не найдена:', err);
          setCurrentShift(null);
          setError(
            'Текущая смена не найдена. Откройте новую смену для начала работы.'
          );
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
      const data = await cashierApi.openShift(warehouseId, {
        cashRegisterId: selectedRegisterId,
        initialAmount: initialAmount,
      });
      setCurrentShift(data);
      // Устанавливаем финальную сумму равной начальной
      setFinalAmount(initialAmount);
    } catch (err) {
      console.error('Ошибка при открытии смены:', err);
      setError(
        'Не удалось открыть смену. Проверьте, что такая смена еще не открыта.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!warehouseId || !currentShift) return;

    setLoading(true);
    setError(null);
    try {
      await cashierApi.closeShift(warehouseId, {
        shiftId: currentShift.id,
        finalAmount: finalAmount,
        notes: notes,
      });
      setCurrentShift(null);
      // Сбрасываем поля формы
      setInitialAmount(0);
      setFinalAmount(0);
      setNotes('');
      setSelectedRegisterId('');
      alert('Смена успешно закрыта');
    } catch (err) {
      console.error('Ошибка при закрытии смены:', err);
      setError('Не удалось закрыть смену. Проверьте введенные данные.');
    } finally {
      setLoading(false);
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
                  {currentShift.initialAmount.toFixed(2)}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Текущая сумма:</span>
                <span className={styles.value}>
                  {currentShift.currentAmount.toFixed(2)}
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
          <div className={styles.error}>
            Произошла ошибка при загрузке данных. Пожалуйста, обновите страницу.
          </div>
        )}
      </div>
    </CashierLayout>
  );
};

export default ShiftPage;
