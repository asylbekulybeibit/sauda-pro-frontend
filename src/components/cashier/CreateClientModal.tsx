import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import styles from './CreateClientModal.module.css';
import { createClientFromWarehouse } from '../../services/managerApi';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  onClientCreated: (client: any) => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  onClientCreated,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);

  // Получаем shopId из warehouseId при открытии модального окна
  React.useEffect(() => {
    if (isOpen && warehouseId) {
      const getWarehouseInfo = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/manager/warehouses/${warehouseId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error('Не удалось получить информацию о складе');
          }

          const data = await response.json();
          if (data.shopId) {
            setShopId(data.shopId);
          } else {
            setError('Не удалось получить идентификатор магазина');
          }
        } catch (err) {
          console.error('Ошибка при получении информации о складе:', err);
          setError('Ошибка при получении информации о складе');
        }
      };

      getWarehouseInfo();
    }
  }, [isOpen, warehouseId]);

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      setError('Имя обязательно для заполнения');
      return false;
    }
    if (!lastName.trim()) {
      setError('Фамилия обязательна для заполнения');
      return false;
    }
    if (!phone.trim()) {
      setError('Телефон обязателен для заполнения');
      return false;
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setError('Некорректный формат email');
      return false;
    }
    if (discountPercent < 0 || discountPercent > 100) {
      setError('Скидка должна быть от 0 до 100 процентов');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!shopId) {
      setError('Не удалось определить идентификатор магазина');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const clientData = {
        firstName,
        lastName,
        phone,
        email: email || undefined,
        discountPercent,
        notes: notes || undefined,
      };

      console.log('[CreateClientModal] Создание клиента:', clientData);
      const newClient = await createClientFromWarehouse(
        shopId,
        warehouseId,
        clientData
      );
      console.log('[CreateClientModal] Клиент создан:', newClient);

      onClientCreated(newClient);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('[CreateClientModal] Ошибка при создании клиента:', err);
      setError(err.response?.data?.message || 'Не удалось создать клиента');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setDiscountPercent(0);
    setNotes('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Добавление нового клиента"
    >
      <div className={styles.modalContent}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.label}>
              Имя *
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={styles.input}
              placeholder="Введите имя"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.label}>
              Фамилия *
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={styles.input}
              placeholder="Введите фамилию"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>
              Телефон *
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
              placeholder="Введите номер телефона"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Введите email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="discountPercent" className={styles.label}>
              Скидка (%)
            </label>
            <input
              id="discountPercent"
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className={styles.input}
              placeholder="Введите процент скидки"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes" className={styles.label}>
              Примечания
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
              placeholder="Введите примечания (необязательно)"
              rows={3}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonContainer}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateClientModal;
