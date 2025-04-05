import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/modal';
import styles from './CreateClientModal.module.css';
import { createClientFromWarehouse } from '../../services/managerApi';
import { cashierApi } from '../../services/cashierApi';
import VirtualKeyboard from './VirtualKeyboard';
import NumericKeyboard from './NumericKeyboard';
import FloatingInput from './FloatingInput';

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

  // Состояния для плавающего поля ввода
  const [showFloatingInput, setShowFloatingInput] = useState(false);
  const [floatingFieldName, setFloatingFieldName] = useState('');
  const [floatingFieldValue, setFloatingFieldValue] = useState('');
  const [floatingFieldType, setFloatingFieldType] = useState('text');
  const [floatingFieldPlaceholder, setFloatingFieldPlaceholder] = useState('');
  const [activeRealField, setActiveRealField] = useState<string>('');

  // Ссылки на поля ввода для фокусировки
  const formRef = useRef<HTMLFormElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const discountPercentRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Добавим еще ссылки для клавиатур
  const keyboardRef = useRef<HTMLDivElement>(null);
  const numericKeyboardRef = useRef<HTMLDivElement>(null);
  const floatingInputRef = useRef<HTMLDivElement>(null);

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

  // Обработчик нажатия клавиш виртуальной клавиатуры
  const handleKeyPress = (key: string) => {
    if (!activeField) return;

    if (showFloatingInput) {
      // Обработка ввода для всплывающего поля
      if (
        floatingInputRef.current &&
        floatingInputRef.current.querySelector('input')
      ) {
        const input = floatingInputRef.current.querySelector(
          'input'
        ) as HTMLInputElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;

        let newValue: string;
        let newPosition: number;

        if (key === 'backspace') {
          // Если выделен текст, удаляем его
          if (start !== end) {
            newValue = value.substring(0, start) + value.substring(end);
            newPosition = start;
          }
          // Иначе удаляем символ перед курсором
          else if (start > 0) {
            newValue = value.substring(0, start - 1) + value.substring(end);
            newPosition = start - 1;
          } else {
            return; // Нечего удалять
          }
        } else {
          // Проверка валидации для различных типов полей
          if (activeRealField === 'phone') {
            // Проверка для телефонного номера
            if (!/^[0-9+\-() ]$/.test(key)) {
              return; // Игнорируем не подходящие для телефона символы
            }
          } else if (activeRealField === 'discountPercent') {
            // Только цифры для скидки
            if (!/^[0-9]$/.test(key)) {
              return; // Игнорируем нецифровые символы
            }

            // Проверяем, что значение не превысит 100
            const potentialNewValue =
              value.substring(0, start) + key + value.substring(end);
            const numValue = parseInt(potentialNewValue, 10);
            if (!isNaN(numValue) && numValue > 100) {
              return; // Не позволяем превысить 100%
            }
          }

          // Вставляем новый символ в позицию курсора
          newValue = value.substring(0, start) + key + value.substring(end);
          newPosition = start + key.length;
        }

        // Обновляем значение
        handleFloatingInputChange(newValue);

        // Восстанавливаем позицию курсора
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    } else {
      // Обработка ввода для стандартных полей (не всплывающих)
      let inputElement: HTMLInputElement | HTMLTextAreaElement | null = null;
      let currentValue = '';
      let setter = (val: string) => {};

      switch (activeField) {
        case 'firstName':
          inputElement = firstNameRef.current;
          currentValue = firstName;
          setter = setFirstName;
          break;
        case 'lastName':
          inputElement = lastNameRef.current;
          currentValue = lastName;
          setter = setLastName;
          break;
        case 'phone':
          inputElement = phoneRef.current;
          currentValue = phone;
          setter = (val: string) => {
            // Проверяем, что значение содержит только допустимые символы для телефона
            if (/^[0-9+\-() ]*$/.test(val)) {
              setPhone(val);
            }
          };
          break;
        case 'email':
          inputElement = emailRef.current;
          currentValue = email;
          setter = setEmail;
          break;
        case 'discountPercent':
          inputElement = discountPercentRef.current;
          currentValue = discountPercent?.toString() || '';
          setter = (val: string) => {
            // Проверяем, что значение состоит из цифр и не превышает 100
            if (/^$|^[0-9]+$/.test(val)) {
              const numValue = parseInt(val, 10);
              if (isNaN(numValue) || numValue <= 100) {
                setDiscountPercent(val ? Number(val) : 0);
              }
            }
          };
          break;
        case 'notes':
          inputElement = notesRef.current;
          currentValue = notes;
          setter = setNotes;
          break;
        default:
          return;
      }

      if (inputElement) {
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;

        let newValue: string;
        let newPosition: number;

        if (key === 'backspace') {
          // Если выделен текст, удаляем его
          if (start !== end) {
            newValue =
              currentValue.substring(0, start) + currentValue.substring(end);
            newPosition = start;
          }
          // Иначе удаляем символ перед курсором
          else if (start > 0) {
            newValue =
              currentValue.substring(0, start - 1) +
              currentValue.substring(end);
            newPosition = start - 1;
          } else {
            return; // Нечего удалять
          }
        } else {
          // Проверка для специальных полей
          if (activeField === 'phone') {
            // Проверка для телефонного номера
            if (!/^[0-9+\-() ]$/.test(key)) {
              return; // Игнорируем не подходящие для телефона символы
            }
          } else if (activeField === 'discountPercent') {
            // Только цифры для скидки
            if (!/^[0-9]$/.test(key)) {
              return; // Игнорируем нецифровые символы
            }

            // Проверяем, что значение не превысит 100
            const potentialNewValue =
              currentValue.substring(0, start) +
              key +
              currentValue.substring(end);
            const numValue = parseInt(potentialNewValue, 10);
            if (!isNaN(numValue) && numValue > 100) {
              return; // Не позволяем превысить 100%
            }
          }

          // Вставляем новый символ в позицию курсора
          newValue =
            currentValue.substring(0, start) +
            key +
            currentValue.substring(end);
          newPosition = start + key.length;
        }

        // Обновляем значение
        setter(newValue);

        // Восстанавливаем позицию курсора
        setTimeout(() => {
          inputElement?.focus();
          inputElement?.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    }
  };

  // Обработчик изменения значения во всплывающем поле
  const handleFloatingInputChange = (value: string) => {
    setFloatingFieldValue(value);

    // Синхронизируем с соответствующим полем формы
    switch (activeRealField) {
      case 'firstName':
        setFirstName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'discountPercent':
        setDiscountPercent(value ? Number(value) : 0);
        break;
      case 'notes':
        setNotes(value);
        break;
    }
  };

  // Обновленный обработчик фокуса на текстовых полях
  const handleTextFieldFocus = (field: string) => {
    setActiveField(field);

    // Определяем элемент, на который пришел фокус
    let activeElement: HTMLElement | null = null;
    switch (field) {
      case 'firstName':
        activeElement = firstNameRef.current;
        break;
      case 'lastName':
        activeElement = lastNameRef.current;
        break;
      case 'email':
        activeElement = emailRef.current;
        break;
      case 'notes':
        activeElement = notesRef.current;
        break;
      default:
        break;
    }

    // Проверяем, будет ли поле закрыто клавиатурой
    if (activeElement) {
      const elementRect = activeElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const keyboardHeight = 350; // Примерная высота клавиатуры

      // Если нижняя граница поля ввода находится ниже верхней границы клавиатуры
      if (elementRect.bottom > viewportHeight - keyboardHeight) {
        // Поле будет под клавиатурой - используем плавающий ввод

        // Определяем значение и название поля для всплывающего ввода
        let value = '';
        let fieldName = '';
        let placeholder = '';

        switch (field) {
          case 'firstName':
            value = firstName;
            fieldName = 'Имя';
            placeholder = 'Введите имя';
            break;
          case 'lastName':
            value = lastName;
            fieldName = 'Фамилия';
            placeholder = 'Введите фамилию';
            break;
          case 'email':
            value = email;
            fieldName = 'Email';
            placeholder = 'Введите email';
            break;
          case 'notes':
            value = notes;
            fieldName = 'Примечания';
            placeholder = 'Введите примечания (необязательно)';
            break;
          default:
            return;
        }

        // Настраиваем всплывающее поле
        setFloatingFieldName(fieldName);
        setFloatingFieldValue(value);
        setFloatingFieldType('text');
        setFloatingFieldPlaceholder(placeholder);
        setActiveRealField(field);

        // Показываем всплывающее поле и клавиатуру
        setShowFloatingInput(true);
      } else {
        // Поле видно над клавиатурой - используем стандартный ввод
        setShowFloatingInput(false);

        // Сохраняем фокус на инпуте, чтобы пользователь видел курсор
        setTimeout(() => {
          if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement
          ) {
            activeElement.focus();
          }
        }, 10);
      }
    }

    // Показываем клавиатуру
    setShowKeyboard(true);
    setShowNumericKeyboard(false);
  };

  // Обновленный обработчик фокуса на числовых полях
  const handleNumericFieldFocus = (field: string) => {
    setActiveField(field);

    // Определяем элемент, на который пришел фокус
    let activeElement: HTMLElement | null = null;
    switch (field) {
      case 'phone':
        activeElement = phoneRef.current;
        break;
      case 'discountPercent':
        activeElement = discountPercentRef.current;
        break;
      default:
        break;
    }

    // Проверяем, будет ли поле закрыто клавиатурой
    if (activeElement) {
      const elementRect = activeElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const keyboardHeight = 350; // Примерная высота клавиатуры

      // Если нижняя граница поля ввода находится ниже верхней границы клавиатуры
      if (elementRect.bottom > viewportHeight - keyboardHeight) {
        // Поле будет под клавиатурой - используем плавающий ввод

        // Определяем значение и название поля для всплывающего ввода
        let value = '';
        let fieldName = '';
        let placeholder = '';

        switch (field) {
          case 'phone':
            value = phone;
            fieldName = 'Телефон';
            placeholder = 'Введите номер телефона';
            break;
          case 'discountPercent':
            value = discountPercent.toString();
            fieldName = 'Скидка (%)';
            placeholder = 'Введите процент скидки';
            break;
          default:
            return;
        }

        // Настраиваем всплывающее поле
        setFloatingFieldName(fieldName);
        setFloatingFieldValue(value);
        setFloatingFieldType('text');
        setFloatingFieldPlaceholder(placeholder);
        setActiveRealField(field);

        // Показываем всплывающее поле
        setShowFloatingInput(true);
      } else {
        // Поле видно над клавиатурой - используем стандартный ввод
        setShowFloatingInput(false);

        // Сохраняем фокус на инпуте, чтобы пользователь видел курсор
        setTimeout(() => {
          if (activeElement instanceof HTMLInputElement) {
            activeElement.focus();
          }
        }, 10);
      }
    }

    // Показываем клавиатуру
    setShowKeyboard(false);
    setShowNumericKeyboard(true);
  };

  // Обработчик закрытия клавиатуры
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
          discountPercentRef.current?.blur();
          break;
        case 'notes':
          notesRef.current?.blur();
          break;
      }
    }

    setShowKeyboard(false);
    setShowNumericKeyboard(false);
    setActiveField(null);
    setShowFloatingInput(false);
    setActiveRealField('');
  };

  // Добавляем эффект для закрытия клавиатуры при клике вне клавиатуры и активного поля
  useEffect(() => {
    // Создаем обработчик клика для закрытия клавиатуры
    const handleClickOutsideKeyboard = (event: MouseEvent) => {
      // Если клавиатура открыта
      if (showKeyboard || showNumericKeyboard) {
        // Проверяем, что клик был не по плавающему вводу
        if (
          floatingInputRef.current &&
          floatingInputRef.current.contains(event.target as Node)
        ) {
          return; // Клик был по плавающему вводу, ничего не делаем
        }

        // Проверяем, что клик был не по клавиатуре
        if (
          (keyboardRef.current &&
            keyboardRef.current.contains(event.target as Node)) ||
          (numericKeyboardRef.current &&
            numericKeyboardRef.current.contains(event.target as Node))
        ) {
          return; // Клик был по клавиатуре, ничего не делаем
        }

        // Проверяем, что клик был не по активному полю ввода
        let activeInputElement: HTMLElement | null = null;
        if (activeField) {
          switch (activeField) {
            case 'firstName':
              activeInputElement = firstNameRef.current;
              break;
            case 'lastName':
              activeInputElement = lastNameRef.current;
              break;
            case 'phone':
              activeInputElement = phoneRef.current;
              break;
            case 'email':
              activeInputElement = emailRef.current;
              break;
            case 'discountPercent':
              activeInputElement = discountPercentRef.current;
              break;
            case 'notes':
              activeInputElement = notesRef.current;
              break;
          }
        }

        // Если клик был не по активному полю
        if (
          !activeInputElement ||
          !activeInputElement.contains(event.target as Node)
        ) {
          // Закрываем клавиатуру
          handleKeyboardClose();
        }
      }
    };

    // Добавляем слушатель события
    document.addEventListener('mousedown', handleClickOutsideKeyboard);

    // Удаляем слушатель при размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideKeyboard);
    };
  }, [showKeyboard, showNumericKeyboard, activeField]);

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
    setShowFloatingInput(false);
    setActiveRealField('');
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
        {/* Всплывающее поле для ввода */}
        {showFloatingInput && (
          <div ref={floatingInputRef}>
            <FloatingInput
              fieldName={floatingFieldName}
              value={floatingFieldValue}
              onChange={handleFloatingInputChange}
              type={floatingFieldType}
              placeholder={floatingFieldPlaceholder}
            />
          </div>
        )}

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
                type="text"
                inputMode="tel"
                pattern="[0-9+\-() ]*"
                value={phone}
                onChange={(e) => {
                  // Разрешаем только цифры и специальные символы для телефона
                  if (/^[0-9+\-() ]*$/.test(e.target.value)) {
                    setPhone(e.target.value);
                  }
                }}
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                max="100"
                step="1"
                value={discountPercent}
                onChange={(e) => {
                  // Разрешаем только целые числа от 0 до 100
                  if (/^$|^[0-9]+$/.test(e.target.value)) {
                    const value = Number(e.target.value);
                    if (value <= 100) {
                      setDiscountPercent(value);
                    }
                  }
                }}
                className={styles.input}
                placeholder="Введите процент скидки"
                autoComplete="off"
                ref={discountPercentRef}
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
          <div ref={keyboardRef}>
            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onCancel={handleKeyboardClose}
              onOk={() => {
                handleKeyboardClose();
              }}
            />
          </div>
        )}

        {showNumericKeyboard && (
          <div ref={numericKeyboardRef}>
            <NumericKeyboard
              onKeyPress={handleKeyPress}
              onCancel={handleKeyboardClose}
              onOk={() => {
                handleKeyboardClose();
              }}
              includeDecimal={true}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreateClientModal;
