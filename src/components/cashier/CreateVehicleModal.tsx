import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/modal';
import styles from './CreateVehicleModal.module.css';
import { cashierApi } from '../../services/cashierApi';
import VirtualKeyboard from './VirtualKeyboard';
import NumericKeyboard from './NumericKeyboard';
import { createVehicle } from '../../services/servicesApi';
import { FaTimes } from 'react-icons/fa';
import FloatingInput from './FloatingInput';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone: string;
  discountPercent?: number;
  discount?: number;
  email?: string;
}

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  onVehicleCreated: (vehicle: any) => void;
}

const CreateVehicleModal: React.FC<CreateVehicleModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  onVehicleCreated,
}) => {
  // Основные поля автомобиля
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [licensePlate, setLicensePlate] = useState('');
  const [registrationCertificate, setRegistrationCertificate] = useState('');
  const [vin, setVin] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [engineVolume, setEngineVolume] = useState<number | undefined>(
    undefined
  );

  // Поля для клиента
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showClientsList, setShowClientsList] = useState(false);

  // Состояния для обработки UI
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
  const makeRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const licensePlateRef = useRef<HTMLInputElement>(null);
  const registrationCertificateRef = useRef<HTMLInputElement>(null);
  const vinRef = useRef<HTMLInputElement>(null);
  const bodyTypeRef = useRef<HTMLSelectElement>(null);
  const engineVolumeRef = useRef<HTMLInputElement>(null);
  const clientSearchRef = useRef<HTMLInputElement>(null);
  const clientsDropdownRef = useRef<HTMLDivElement>(null);

  // Добавим еще ссылки для клавиатур
  const keyboardRef = useRef<HTMLDivElement>(null);
  const numericKeyboardRef = useRef<HTMLDivElement>(null);
  const floatingInputRef = useRef<HTMLDivElement>(null);

  // Обработчик закрытия клавиатуры
  const handleKeyboardClose = () => {
    // Снимаем фокус с активного поля
    if (activeField === 'clientSearch' && clientSearchRef.current) {
      clientSearchRef.current.blur();
    }

    setShowKeyboard(false);
    setShowNumericKeyboard(false);
    setActiveField(null);
    setShowFloatingInput(false);
    setActiveRealField('');
  };

  // Функция для очистки выбранного клиента
  const clearSelectedClient = () => {
    setClientId(undefined);
    setClientSearchQuery('');

    // Сначала проверяем, открыт ли уже список клиентов
    if (!showClientsList && clients.length > 0) {
      setShowClientsList(true);
    }

    // Фокусировка на поле поиска клиента после очистки
    if (clientSearchRef.current) {
      clientSearchRef.current.focus();
    }
  };

  // Обновленный обработчик закрытия клавиатуры
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientSearchRef.current &&
        !clientSearchRef.current.contains(event.target as Node) &&
        clientsDropdownRef.current &&
        !clientsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowClientsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            case 'make':
              activeInputElement = makeRef.current;
              break;
            case 'model':
              activeInputElement = modelRef.current;
              break;
            case 'year':
              activeInputElement = yearRef.current;
              break;
            case 'licensePlate':
              activeInputElement = licensePlateRef.current;
              break;
            case 'registrationCertificate':
              activeInputElement = registrationCertificateRef.current;
              break;
            case 'vin':
              activeInputElement = vinRef.current;
              break;
            case 'engineVolume':
              activeInputElement = engineVolumeRef.current;
              break;
            case 'clientSearch':
              activeInputElement = clientSearchRef.current;
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

  // Эффект для обработки отображения клавиатуры
  useEffect(() => {
    if (showKeyboard || showNumericKeyboard) {
      // При необходимости здесь можно добавить код для дополнительной обработки отображения клавиатуры
      // Например, смещение формы или другие визуальные эффекты
    }
  }, [showKeyboard, showNumericKeyboard, activeField]);

  // Получаем shopId из warehouseId при открытии модального окна
  React.useEffect(() => {
    if (isOpen && warehouseId) {
      const getWarehouseInfo = async () => {
        try {
          setError(null);
          console.log(
            '[CreateVehicleModal] Запрос информации о складе:',
            warehouseId
          );

          const warehouseInfo = await cashierApi.getWarehouseInfo(warehouseId);

          if (warehouseInfo && warehouseInfo.shopId) {
            console.log(
              '[CreateVehicleModal] Получен shopId:',
              warehouseInfo.shopId
            );
            setShopId(warehouseInfo.shopId);

            // Загрузка списка клиентов при открытии формы
            loadClients();
          } else {
            console.error('[CreateVehicleModal] В ответе отсутствует shopId');
            setError('Не удалось получить идентификатор магазина');
          }
        } catch (err) {
          console.error(
            '[CreateVehicleModal] Ошибка при получении информации о складе:',
            err
          );
          setError('Ошибка при получении информации о складе');
        }
      };

      getWarehouseInfo();
    }
  }, [isOpen, warehouseId]);

  // Загрузка списка клиентов
  const loadClients = async () => {
    try {
      setIsLoading(true);
      const clientsList = await cashierApi.getAllClients(warehouseId);
      setClients(clientsList);
      setFilteredClients(clientsList);
      setIsLoading(false);
    } catch (error) {
      console.error(
        '[CreateVehicleModal] Ошибка при загрузке клиентов:',
        error
      );
      setError('Не удалось загрузить список клиентов');
      setIsLoading(false);
    }
  };

  // Фильтрация клиентов при вводе в поле поиска
  useEffect(() => {
    if (clientSearchQuery.trim() === '') {
      setFilteredClients(clients);
      return;
    }

    const query = clientSearchQuery.toLowerCase();
    const filtered = clients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const phone = client.phone?.toLowerCase() || '';

      return fullName.includes(query) || phone.includes(query);
    });

    setFilteredClients(filtered);
  }, [clientSearchQuery, clients]);

  // Обновленный обработчик фокуса на текстовых полях
  const handleTextFieldFocus = (field: string) => {
    setActiveField(field);

    // Для поля поиска клиента используем обычный ввод без плавающего поля
    if (field === 'clientSearch') {
      setShowKeyboard(true);
      setShowNumericKeyboard(false);
      setShowFloatingInput(false);
      return;
    }

    // Определяем элемент, на который пришел фокус
    let activeElement: HTMLElement | null = null;
    switch (field) {
      case 'make':
        activeElement = makeRef.current;
        break;
      case 'model':
        activeElement = modelRef.current;
        break;
      case 'licensePlate':
        activeElement = licensePlateRef.current;
        break;
      case 'registrationCertificate':
        activeElement = registrationCertificateRef.current;
        break;
      case 'vin':
        activeElement = vinRef.current;
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
          case 'make':
            value = make;
            fieldName = 'Марка';
            placeholder = 'Например: Toyota';
            break;
          case 'model':
            value = model;
            fieldName = 'Модель';
            placeholder = 'Например: Camry';
            break;
          case 'licensePlate':
            value = licensePlate;
            fieldName = 'Гос. номер';
            placeholder = 'Например: A123BC';
            break;
          case 'registrationCertificate':
            value = registrationCertificate;
            fieldName = 'Техпаспорт';
            placeholder = 'Номер технического паспорта';
            break;
          case 'vin':
            value = vin;
            fieldName = 'VIN';
            placeholder = 'Идентификационный номер автомобиля';
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

    // Показываем клавиатуру в любом случае
    setShowKeyboard(true);
    setShowNumericKeyboard(false);
  };

  // Обновленный обработчик фокуса на числовых полях
  const handleNumericFieldFocus = (field: string) => {
    setActiveField(field);

    // Определяем элемент, на который пришел фокус
    let activeElement: HTMLElement | null = null;
    switch (field) {
      case 'year':
        activeElement = yearRef.current;
        break;
      case 'engineVolume':
        activeElement = engineVolumeRef.current;
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
          case 'year':
            value = year?.toString() || '';
            fieldName = 'Год выпуска';
            placeholder = 'Например: 2020';
            break;
          case 'engineVolume':
            value = engineVolume?.toString() || '';
            fieldName = 'Объем двигателя (л)';
            placeholder = 'Например: 2.0';
            break;
          default:
            return;
        }

        // Настраиваем всплывающее поле
        setFloatingFieldName(fieldName);
        setFloatingFieldValue(value);
        setFloatingFieldType('number');
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

    // Показываем клавиатуру в любом случае
    setShowKeyboard(false);
    setShowNumericKeyboard(true);
  };

  // Обработчик изменения значения во всплывающем поле
  const handleFloatingInputChange = (value: string) => {
    setFloatingFieldValue(value);

    // Синхронизируем с соответствующим полем формы
    switch (activeRealField) {
      case 'make':
        setMake(value);
        break;
      case 'model':
        setModel(value);
        break;
      case 'year':
        setYear(value ? Number(value) : undefined);
        break;
      case 'licensePlate':
        setLicensePlate(value);
        break;
      case 'registrationCertificate':
        setRegistrationCertificate(value);
        break;
      case 'vin':
        setVin(value);
        break;
      case 'engineVolume':
        setEngineVolume(value ? Number(value) : undefined);
        break;
    }
  };

  // Обновленный обработчик нажатия клавиш
  const handleKeyPress = (key: string) => {
    if (!activeField) return;

    if (activeField === 'clientSearch') {
      // Специальная обработка для поля поиска клиента
      if (clientSearchRef.current) {
        const input = clientSearchRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;

        if (key === 'backspace') {
          // Если выделен текст, удаляем его
          if (start !== end) {
            const newValue = value.substring(0, start) + value.substring(end);
            setClientSearchQuery(newValue);
            // Устанавливаем курсор в позицию после удаления
            setTimeout(() => {
              input.focus();
              input.setSelectionRange(start, start);
            }, 0);
          }
          // Иначе удаляем символ перед курсором
          else if (start > 0) {
            const newValue =
              value.substring(0, start - 1) + value.substring(end);
            setClientSearchQuery(newValue);
            // Устанавливаем курсор в позицию после удаления
            setTimeout(() => {
              input.focus();
              input.setSelectionRange(start - 1, start - 1);
            }, 0);
          }
        } else {
          // Вставляем новый символ в позицию курсора
          const newValue =
            value.substring(0, start) + key + value.substring(end);
          setClientSearchQuery(newValue);
          // Устанавливаем курсор после вставленного символа
          setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + key.length, start + key.length);
          }, 0);
        }
      }

      // Показываем список, если он еще не виден
      if (!showClientsList) {
        setShowClientsList(true);
      }
    } else if (showFloatingInput) {
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
          // Проверяем валидацию для числовых полей в плавающем вводе
          if (
            activeRealField === 'year' ||
            activeRealField === 'engineVolume'
          ) {
            // Обработка для числовых полей
            if (activeRealField === 'year') {
              // Только цифры для года
              if (!/^[0-9]$/.test(key)) {
                return; // Игнорируем нецифровые символы
              }
            } else if (activeRealField === 'engineVolume') {
              // Цифры и точка для объема двигателя
              if (!/^[0-9.]$/.test(key)) {
                return; // Игнорируем недопустимые символы
              }

              // Проверяем, что точка добавляется только один раз
              if (key === '.' && value.includes('.')) {
                return; // Уже есть точка, игнорируем
              }
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
      let inputElement: HTMLInputElement | null = null;
      let currentValue = '';
      let setter = (val: string) => {};

      switch (activeField) {
        case 'make':
          inputElement = makeRef.current;
          currentValue = make;
          setter = setMake;
          break;
        case 'model':
          inputElement = modelRef.current;
          currentValue = model;
          setter = setModel;
          break;
        case 'year':
          inputElement = yearRef.current;
          currentValue = year?.toString() || '';
          setter = (val: string) => {
            // Проверяем, что значение состоит из цифр
            if (/^$|^[0-9]+$/.test(val)) {
              setYear(val ? Number(val) : undefined);
            }
          };
          break;
        case 'licensePlate':
          inputElement = licensePlateRef.current;
          currentValue = licensePlate;
          setter = setLicensePlate;
          break;
        case 'registrationCertificate':
          inputElement = registrationCertificateRef.current;
          currentValue = registrationCertificate;
          setter = setRegistrationCertificate;
          break;
        case 'vin':
          inputElement = vinRef.current;
          currentValue = vin;
          setter = setVin;
          break;
        case 'engineVolume':
          inputElement = engineVolumeRef.current;
          currentValue = engineVolume?.toString() || '';
          setter = (val: string) => {
            // Проверяем, что значение соответствует числовому формату с точкой
            if (/^$|^[0-9]*\.?[0-9]*$/.test(val)) {
              setEngineVolume(val ? Number(val) : undefined);
            }
          };
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
          // Проверка для числовых полей
          if (activeField === 'year') {
            // Только цифры для года
            if (!/^[0-9]$/.test(key)) {
              return; // Игнорируем нецифровые символы
            }
          } else if (activeField === 'engineVolume') {
            // Цифры и точка для объема двигателя
            if (!/^[0-9.]$/.test(key)) {
              return; // Игнорируем недопустимые символы
            }

            // Проверяем, что точка добавляется только один раз
            if (key === '.' && currentValue.includes('.')) {
              return; // Уже есть точка, игнорируем
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

  // Выбор клиента из списка
  const handleSelectClient = (client: Client) => {
    setClientId(client.id);
    setClientSearchQuery(`${client.firstName} ${client.lastName}`);
    setShowClientsList(false);
  };

  // Валидация формы
  const validateForm = (): boolean => {
    if (!make.trim()) {
      setError('Марка автомобиля обязательна для заполнения');
      return false;
    }
    if (!bodyType) {
      setError('Тип кузова обязателен для заполнения');
      return false;
    }
    return true;
  };

  // Отправка формы
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
      const vehicleData = {
        clientId,
        make,
        model: model || undefined,
        year: year || undefined,
        bodyType,
        engineVolume: engineVolume || undefined,
        licensePlate: licensePlate.trim() || 'Б/Н',
        registrationCertificate: registrationCertificate || undefined,
        vin: vin || undefined,
      };

      console.log('[CreateVehicleModal] Создание автомобиля:', vehicleData);
      const newVehicle = await createVehicle(shopId, vehicleData);
      console.log('[CreateVehicleModal] Автомобиль создан:', newVehicle);

      onVehicleCreated(newVehicle);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error(
        '[CreateVehicleModal] Ошибка при создании автомобиля:',
        err
      );
      let errorMessage = 'Не удалось создать автомобиль. ';

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

  // Сброс формы
  const resetForm = () => {
    setMake('');
    setModel('');
    setYear(undefined);
    setLicensePlate('');
    setRegistrationCertificate('');
    setVin('');
    setBodyType('');
    setEngineVolume(undefined);
    setClientId(undefined);
    setClientSearchQuery('');
    setShowClientsList(false);
    setError(null);
    setShowKeyboard(false);
    setShowNumericKeyboard(false);
    setActiveField(null);
  };

  // Закрытие модального окна
  const handleClose = () => {
    resetForm();
    setShowClientsList(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Новый автомобиль"
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
          {/* Блок выбора клиента (занимает всю строку) */}
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ width: '100%' }}>
              <label htmlFor="clientSearch" className={styles.label}>
                Привязать к клиенту (опционально)
              </label>
              <div className={styles.clientSearchContainer}>
                <input
                  id="clientSearch"
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => {
                    // Устанавливаем новое значение поля ввода
                    setClientSearchQuery(e.target.value);

                    // Показываем список клиентов при наличии данных
                    if (!showClientsList) {
                      setShowClientsList(true);
                    }
                  }}
                  onFocus={() => {
                    // Всегда показываем список при фокусе, если есть клиенты
                    if (!showClientsList && filteredClients.length > 0) {
                      setShowClientsList(true);
                    }
                    handleTextFieldFocus('clientSearch');
                  }}
                  className={styles.input}
                  placeholder="Поиск клиента по имени, фамилии или телефону"
                  autoComplete="off"
                  ref={clientSearchRef}
                />
                {clientId && (
                  <button
                    type="button"
                    className={styles.clearClientButton}
                    onClick={clearSelectedClient}
                    title="Очистить выбранного клиента"
                  >
                    ×
                  </button>
                )}
                {/* Всегда создаем элемент списка, но управляем его отображением через CSS */}
                <div
                  className={`${styles.clientsDropdown} ${
                    showClientsList && filteredClients.length > 0
                      ? styles.visible
                      : styles.hidden
                  }`}
                  ref={clientsDropdownRef}
                >
                  {/* Отображаем клиентов только если есть данные */}
                  {filteredClients.length > 0 &&
                    filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className={styles.clientItem}
                        onClick={() => handleSelectClient(client)}
                      >
                        {client.firstName} {client.lastName} - {client.phone}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Первая группа полей (три в строке) */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="make" className={styles.label}>
                Марка *
              </label>
              <input
                id="make"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className={styles.input}
                placeholder="Например: Toyota"
                required
                autoComplete="off"
                ref={makeRef}
                onFocus={() => handleTextFieldFocus('make')}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="model" className={styles.label}>
                Модель
              </label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={styles.input}
                placeholder="Например: Camry"
                autoComplete="off"
                ref={modelRef}
                onFocus={() => handleTextFieldFocus('model')}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="year" className={styles.label}>
                Год выпуска
              </label>
              <input
                id="year"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1900"
                max={new Date().getFullYear()}
                value={year || ''}
                onChange={(e) => {
                  // Проверяем, что ввод содержит только цифры
                  if (/^$|^[0-9]+$/.test(e.target.value)) {
                    setYear(
                      e.target.value ? Number(e.target.value) : undefined
                    );
                  }
                }}
                className={styles.input}
                placeholder="Например: 2020"
                autoComplete="off"
                ref={yearRef}
                onFocus={() => handleNumericFieldFocus('year')}
              />
            </div>
          </div>

          {/* Вторая группа полей (три в строке) */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="bodyType" className={styles.label}>
                Тип кузова *
              </label>
              <select
                id="bodyType"
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className={styles.input}
                required
                ref={bodyTypeRef}
              >
                <option value="" disabled>
                  Выберите тип кузова
                </option>
                <option value="Sedan">Седан</option>
                <option value="Hatchback">Хэтчбек</option>
                <option value="SUV">Внедорожник</option>
                <option value="Wagon">Универсал</option>
                <option value="Coupe">Купе</option>
                <option value="Truck">Пикап</option>
                <option value="Minivan">Минивэн</option>
                <option value="Van">Фургон</option>
                <option value="Other">Другое</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="licensePlate" className={styles.label}>
                Гос. номер
              </label>
              <input
                id="licensePlate"
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className={styles.input}
                placeholder="Например: A123BC"
                autoComplete="off"
                ref={licensePlateRef}
                onFocus={() => handleTextFieldFocus('licensePlate')}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="registrationCertificate" className={styles.label}>
                Техпаспорт
              </label>
              <input
                id="registrationCertificate"
                type="text"
                value={registrationCertificate}
                onChange={(e) => setRegistrationCertificate(e.target.value)}
                className={styles.input}
                placeholder="Номер технического паспорта"
                autoComplete="off"
                ref={registrationCertificateRef}
                onFocus={() => handleTextFieldFocus('registrationCertificate')}
              />
            </div>
          </div>

          {/* Третья группа полей (оставшиеся два поля) */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="vin" className={styles.label}>
                VIN
              </label>
              <input
                id="vin"
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className={styles.input}
                placeholder="Идентификационный номер автомобиля"
                autoComplete="off"
                ref={vinRef}
                onFocus={() => handleTextFieldFocus('vin')}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="engineVolume" className={styles.label}>
                Объем двигателя (л)
              </label>
              <input
                id="engineVolume"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*(\.[0-9]*)?"
                min="0"
                step="0.1"
                value={engineVolume || ''}
                onChange={(e) => {
                  // Проверяем, что ввод соответствует числовому формату с десятичной точкой
                  if (/^$|^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                    setEngineVolume(
                      e.target.value ? Number(e.target.value) : undefined
                    );
                  }
                }}
                className={styles.input}
                placeholder="Например: 2.0"
                autoComplete="off"
                ref={engineVolumeRef}
                onFocus={() => handleNumericFieldFocus('engineVolume')}
              />
            </div>

            {/* Пустая колонка для выравнивания по три в строке */}
            <div className={styles.formGroup}></div>
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

export default CreateVehicleModal;
