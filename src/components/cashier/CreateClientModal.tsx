import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/modal';
import styles from './CreateClientModal.module.css';
import { createClientFromWarehouse } from '../../services/managerApi';
import { cashierApi } from '../../services/cashierApi';
import VirtualKeyboard from './VirtualKeyboard';
import NumericKeyboard from './NumericKeyboard';

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

  // Состояния для виртуальных клавиатур
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showNumericKeyboard, setShowNumericKeyboard] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Ссылки на поля ввода для фокусировки
  const formRef = useRef<HTMLFormElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Функция для прокрутки активного поля в видимую область
  const scrollToActiveField = () => {
    if (!modalContentRef.current || !activeField) return;

    // Получаем активный элемент
    let activeElement: HTMLElement | null = null;
    switch (activeField) {
      case 'firstName':
        activeElement = firstNameRef.current;
        break;
      case 'lastName':
        activeElement = lastNameRef.current;
        break;
      case 'phone':
        activeElement = phoneRef.current;
        break;
      case 'email':
        activeElement = emailRef.current;
        break;
      case 'discountPercent':
        activeElement = discountRef.current;
        break;
      case 'notes':
        activeElement = notesRef.current;
        break;
    }

    if (!activeElement) return;

    // Экстремальные значения для гарантированной видимости
    const keyboardHeight = 350;
    const padding = 400; // Очень большой отступ для гарантированной видимости всего поля, включая границы

    // Получаем размеры и позиции элементов
    const elementRect = activeElement.getBoundingClientRect();
    const modalRect = modalContentRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Вычисляем границу видимой области с учетом клавиатуры
    const bottomVisiblePosition = viewportHeight - keyboardHeight - padding;

    // Всегда прокручиваем, независимо от текущей позиции с большим запасом
    const scrollNeeded = elementRect.bottom - bottomVisiblePosition + 150; // Очень большой запас (150px)

    // Применяем прокрутку мгновенно (без анимации) для быстрого эффекта
    modalContentRef.current.scrollTo({
      top: modalContentRef.current.scrollTop + scrollNeeded,
      behavior: 'auto', // Используем мгновенную прокрутку для первого раза
    });

    // Дополнительная прокрутка сразу и с задержкой для гарантии
    setTimeout(() => {
      if (modalContentRef.current && activeElement) {
        // Повторно проверяем позицию
        const updatedRect = activeElement.getBoundingClientRect();

        // Всегда добавляем дополнительную прокрутку с экстра-запасом
        const additionalScroll =
          updatedRect.bottom - bottomVisiblePosition + 200; // Увеличиваем запасной отступ до 200px!

        modalContentRef.current.scrollTo({
          top: modalContentRef.current.scrollTop + additionalScroll,
          behavior: 'smooth',
        });

        // Еще одна проверка для надежности
        setTimeout(() => {
          if (modalContentRef.current && activeElement) {
            const finalRect = activeElement.getBoundingClientRect();
            if (finalRect.bottom > viewportHeight - keyboardHeight - 300) {
              // Проверяем с меньшим порогом
              // Добавляем последнюю прокрутку с максимальным запасом
              modalContentRef.current.scrollTo({
                top: modalContentRef.current.scrollTop + 300, // Фиксированное огромное значение для надежности
                behavior: 'smooth',
              });
            }
          }
        }, 150);
      }
    }, 50);
  };

  // Эффект для прокрутки при открытии клавиатуры и удержания позиции
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout>;

    if (showKeyboard || showNumericKeyboard) {
      // Запускаем несколько прокруток с разными интервалами для надежности
      scrollTimer = setTimeout(scrollToActiveField, 10);
      setTimeout(scrollToActiveField, 100);
      setTimeout(scrollToActiveField, 300);
      setTimeout(scrollToActiveField, 500);

      // Предотвращаем сброс скролла и добавляем дополнительную прокрутку при вводе
      const preventScrollReset = () => {
        if (activeField) {
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(scrollToActiveField, 10);
        }
      };

      // Подписываемся на события скролла и ввода
      modalContentRef.current?.addEventListener('scroll', preventScrollReset, {
        passive: true,
      });
      window.addEventListener('resize', scrollToActiveField);

      return () => {
        clearTimeout(scrollTimer);
        modalContentRef.current?.removeEventListener(
          'scroll',
          preventScrollReset
        );
        window.removeEventListener('resize', scrollToActiveField);
      };
    }

    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('resize', scrollToActiveField);
    };
  }, [showKeyboard, showNumericKeyboard, activeField]);

  // Получаем shopId из warehouseId при открытии модального окна
  React.useEffect(() => {
    if (isOpen && warehouseId) {
      const getWarehouseInfo = async () => {
        try {
          setError(null);
          console.log(
            '[CreateClientModal] Запрос информации о складе:',
            warehouseId
          );

          const warehouseInfo = await cashierApi.getWarehouseInfo(warehouseId);

          if (warehouseInfo && warehouseInfo.shopId) {
            console.log(
              '[CreateClientModal] Получен shopId:',
              warehouseInfo.shopId
            );
            setShopId(warehouseInfo.shopId);
          } else {
            console.error('[CreateClientModal] В ответе отсутствует shopId');
            setError('Не удалось получить идентификатор магазина');
          }
        } catch (err) {
          console.error(
            '[CreateClientModal] Ошибка при получении информации о складе:',
            err
          );
          setError('Ошибка при получении информации о складе');
        }
      };

      getWarehouseInfo();
    }
  }, [isOpen, warehouseId]);

  // Обработчик нажатия клавиш клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        if (showKeyboard || showNumericKeyboard) {
          handleKeyboardClose();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showKeyboard, showNumericKeyboard]);

  // Функция для обработки нажатия клавиш на виртуальной клавиатуре
  const handleKeyPress = (key: string) => {
    if (!activeField) return;

    let currentValue = '';
    let setter = (val: string) => {};

    switch (activeField) {
      case 'firstName':
        currentValue = firstName;
        setter = setFirstName;
        break;
      case 'lastName':
        currentValue = lastName;
        setter = setLastName;
        break;
      case 'phone':
        currentValue = phone;
        setter = setPhone;
        break;
      case 'email':
        currentValue = email;
        setter = setEmail;
        break;
      case 'discountPercent':
        currentValue = discountPercent.toString();
        setter = (val: string) => setDiscountPercent(Number(val) || 0);
        break;
      case 'notes':
        currentValue = notes;
        setter = setNotes;
        break;
      default:
        return;
    }

    if (key === 'backspace') {
      setter(currentValue.slice(0, -1));
    } else {
      setter(currentValue + key);
    }
  };

  // Функция для фокусировки на поле ввода
  const focusField = (field: string) => {
    switch (field) {
      case 'firstName':
        firstNameRef.current?.focus();
        break;
      case 'lastName':
        lastNameRef.current?.focus();
        break;
      case 'phone':
        phoneRef.current?.focus();
        break;
      case 'email':
        emailRef.current?.focus();
        break;
      case 'discountPercent':
        discountRef.current?.focus();
        break;
      case 'notes':
        notesRef.current?.focus();
        break;
    }
  };

  // Обработчики для активации клавиатуры с улучшенной прокруткой
  const handleTextFieldFocus = (field: string) => {
    setActiveField(field);

    // Немедленно устанавливаем состояние клавиатуры
    setShowKeyboard(true);
    setShowNumericKeyboard(false);

    // Запускаем серию прокруток с разными интервалами для надежности
    scrollToActiveField();
    setTimeout(scrollToActiveField, 50);
    setTimeout(scrollToActiveField, 150);
    setTimeout(scrollToActiveField, 300);
    setTimeout(scrollToActiveField, 600);
  };

  const handleNumericFieldFocus = (field: string) => {
    setActiveField(field);

    // Немедленно устанавливаем состояние клавиатуры
    setShowNumericKeyboard(true);
    setShowKeyboard(false);

    // Запускаем серию прокруток с разными интервалами для надежности
    scrollToActiveField();
    setTimeout(scrollToActiveField, 50);
    setTimeout(scrollToActiveField, 150);
    setTimeout(scrollToActiveField, 300);
    setTimeout(scrollToActiveField, 600);
  };

  const handleKeyboardClose = () => {
    // Снимаем фокус с активного поля, чтобы предотвратить появление системной клавиатуры
    if (activeField) {
      switch (activeField) {
        case 'firstName':
          firstNameRef.current?.blur();
          break;
        case 'lastName':
          lastNameRef.current?.blur();
          break;
        case 'phone':
          phoneRef.current?.blur();
          break;
        case 'email':
          emailRef.current?.blur();
          break;
        case 'discountPercent':
          discountRef.current?.blur();
          break;
        case 'notes':
          notesRef.current?.blur();
          break;
      }
    }

    setShowKeyboard(false);
    setShowNumericKeyboard(false);
    setActiveField(null);
  };

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
      setError(
        'Не удалось определить магазин. Пожалуйста, обновите страницу и попробуйте снова.'
      );
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
      let errorMessage = 'Не удалось создать клиента. ';

      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Пожалуйста, проверьте соединение и попробуйте снова.';
      }

      setError(errorMessage);
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
    setShowKeyboard(false);
    setShowNumericKeyboard(false);
    setActiveField(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Новый клиент"
      className={styles.largeModal}
    >
      <div className={styles.modalContent} ref={modalContentRef}>
        <form onSubmit={handleSubmit} className={styles.form} ref={formRef}>
          <div className={styles.formRow}>
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
                autoComplete="off"
                ref={firstNameRef}
                onFocus={() => handleTextFieldFocus('firstName')}
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
                autoComplete="off"
                ref={lastNameRef}
                onFocus={() => handleTextFieldFocus('lastName')}
              />
            </div>
          </div>

          <div className={styles.formRow}>
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
                autoComplete="off"
                ref={phoneRef}
                onFocus={() => handleNumericFieldFocus('phone')}
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
                autoComplete="off"
                ref={emailRef}
                onFocus={() => handleTextFieldFocus('email')}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="discountPercent" className={styles.label}>
                Скидка (%)
              </label>
              <input
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className={styles.input}
                placeholder="Введите процент скидки"
                autoComplete="off"
                ref={discountRef}
                onFocus={() => handleNumericFieldFocus('discountPercent')}
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
                autoComplete="off"
                ref={notesRef}
                onFocus={() => handleTextFieldFocus('notes')}
              />
            </div>
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

        {showKeyboard && (
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onCancel={handleKeyboardClose}
            onOk={() => {
              handleKeyboardClose();
            }}
          />
        )}

        {showNumericKeyboard && (
          <NumericKeyboard
            onKeyPress={handleKeyPress}
            onCancel={handleKeyboardClose}
            onOk={() => {
              handleKeyboardClose();
            }}
            includeDecimal={true}
          />
        )}
      </div>
    </Modal>
  );
};

export default CreateClientModal;
