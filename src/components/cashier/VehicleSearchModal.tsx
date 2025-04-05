import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/modal';
import { cashierApi } from '../../services/cashierApi';
import styles from './SearchModal.module.css';
import { BsKeyboard } from 'react-icons/bs';
import VirtualKeyboard from './VirtualKeyboard';
import CreateVehicleModal from './CreateVehicleModal';

interface ClientInfo {
  id: string;
  firstName: string;
  lastName: string;
  discountPercent?: number;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  licensePlate: string;
  plateNumber?: string;
  vin?: string;
  clientId?: string;
  hasClient: boolean;
  clientInfo?: ClientInfo;
}

interface VehicleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBack?: () => void;
}

const VehicleSearchModal: React.FC<VehicleSearchModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  onSelectVehicle,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Функция для прокрутки поля поиска, чтобы оно было видимым при открытии клавиатуры
  const scrollToSearchInput = () => {
    if (!modalContentRef.current || !searchInputRef.current) return;

    // Экстремальные значения для гарантированной видимости
    const keyboardHeight = 350;
    const padding = 400; // Очень большой отступ для гарантированной видимости всего поля, включая границы

    // Получаем размеры и позиции элементов
    const inputRect = searchInputRef.current.getBoundingClientRect();
    const modalRect = modalContentRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Вычисляем границу видимой области с учетом клавиатуры
    const bottomVisiblePosition = viewportHeight - keyboardHeight - padding;

    // Всегда прокручиваем, независимо от текущей позиции с большим запасом
    const scrollNeeded = inputRect.bottom - bottomVisiblePosition + 150; // Очень большой запас (150px)

    // Применяем прокрутку мгновенно для быстрого эффекта
    modalContentRef.current.scrollTo({
      top: modalContentRef.current.scrollTop + scrollNeeded,
      behavior: 'auto',
    });

    // Дополнительная прокрутка с задержкой для гарантии
    setTimeout(() => {
      if (modalContentRef.current && searchInputRef.current) {
        // Повторно проверяем позицию
        const updatedInputRect = searchInputRef.current.getBoundingClientRect();

        // Всегда добавляем дополнительную прокрутку с экстра-запасом
        const additionalScroll =
          updatedInputRect.bottom - bottomVisiblePosition + 200; // Увеличиваем запасной отступ до 200px

        modalContentRef.current.scrollTo({
          top: modalContentRef.current.scrollTop + additionalScroll,
          behavior: 'smooth',
        });

        // Еще одна проверка для надежности
        setTimeout(() => {
          if (modalContentRef.current && searchInputRef.current) {
            const finalRect = searchInputRef.current.getBoundingClientRect();
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

  // Применяем прокрутку при открытии/закрытии клавиатуры и удерживаем позицию
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout>;

    if (showKeyboard) {
      // Запускаем несколько прокруток с разными интервалами для надежности
      scrollTimer = setTimeout(scrollToSearchInput, 10);
      setTimeout(scrollToSearchInput, 100);
      setTimeout(scrollToSearchInput, 300);
      setTimeout(scrollToSearchInput, 500);

      // Предотвращаем сброс скролла при вводе
      const preventScrollReset = () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(scrollToSearchInput, 10);
      };

      // Подписываемся на события скролла и изменения размера окна
      modalContentRef.current?.addEventListener('scroll', preventScrollReset, {
        passive: true,
      });
      window.addEventListener('resize', scrollToSearchInput);

      return () => {
        clearTimeout(scrollTimer);
        modalContentRef.current?.removeEventListener(
          'scroll',
          preventScrollReset
        );
        window.removeEventListener('resize', scrollToSearchInput);
      };
    }

    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('resize', scrollToSearchInput);
    };
  }, [showKeyboard]);

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setSearchQuery((prev) => prev.slice(0, -1));
    } else {
      setSearchQuery((prev) => prev + key);
    }
  };

  const toggleKeyboard = () => {
    setShowKeyboard(!showKeyboard);
  };

  // Загрузка всех автомобилей
  const loadAllVehicles = async () => {
    console.log(
      '===== [VehicleSearchModal] Загрузка всех транспортных средств ====='
    );
    console.log(`[VehicleSearchModal] warehouseId: ${warehouseId}`);

    try {
      setIsLoading(true);
      setError(null);

      console.log('[VehicleSearchModal] Вызов API getAllVehicles...');
      const results = await cashierApi.getAllVehicles(warehouseId);

      console.log(
        `[VehicleSearchModal] Получено транспортных средств: ${results.length}`
      );
      setAllVehicles(results);
      setFilteredVehicles(results);

      if (results.length === 0) {
        console.log(
          '[VehicleSearchModal] Предупреждение: список транспортных средств пуст'
        );
        setError('Транспортные средства не найдены');
      }
    } catch (error) {
      console.error(
        '[VehicleSearchModal] Ошибка при загрузке транспортных средств:',
        error
      );
      let errorMessage = 'Не удалось загрузить список транспортных средств.';

      if (error instanceof Error) {
        console.error(
          `[VehicleSearchModal] Сообщение ошибки: ${error.message}`
        );
        errorMessage += ` ${error.message}`;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const axiosError = error as {
          response?: { status: number; data: any };
        };
        if (axiosError.response) {
          console.error(
            `[VehicleSearchModal] Статус ошибки: ${axiosError.response.status}`
          );
          console.error(
            '[VehicleSearchModal] Данные ошибки:',
            axiosError.response.data
          );
          errorMessage += ` Статус: ${axiosError.response.status}`;
        }
      }

      setError(errorMessage);
      setAllVehicles([]);
      setFilteredVehicles([]);
    } finally {
      console.log(
        '[VehicleSearchModal] Завершение загрузки транспортных средств'
      );
      setIsLoading(false);
    }
  };

  // Фильтрация автомобилей локально
  const filterVehicles = () => {
    if (!searchQuery.trim()) {
      setFilteredVehicles(allVehicles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allVehicles.filter((vehicle) => {
      const makeModel = `${vehicle.make} ${vehicle.model}`.toLowerCase();
      const plateNumber = (
        vehicle.licensePlate ||
        vehicle.plateNumber ||
        ''
      ).toLowerCase();
      const vin = (vehicle.vin || '').toLowerCase();
      const year = vehicle.year?.toString() || '';

      return (
        makeModel.includes(query) ||
        plateNumber.includes(query) ||
        vin.includes(query) ||
        year.includes(query)
      );
    });

    setFilteredVehicles(filtered);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    onSelectVehicle(vehicle);
    onClose();
  };

  // Эффект для загрузки автомобилей при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setShowKeyboard(false);
      loadAllVehicles();
    }
  }, [isOpen, warehouseId]);

  // Эффект для фильтрации при изменении поискового запроса
  useEffect(() => {
    filterVehicles();
  }, [searchQuery, allVehicles]);

  // Обработка изменения поискового запроса
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Улучшенный обработчик фокуса для поля ввода
  const handleSearchInputFocus = () => {
    // Запускаем серию прокруток с разными интервалами для надежности
    scrollToSearchInput();
    setTimeout(scrollToSearchInput, 50);
    setTimeout(scrollToSearchInput, 150);
    setTimeout(scrollToSearchInput, 300);
    setTimeout(scrollToSearchInput, 600);
  };

  // Обработчик нажатия на кнопку "Добавить новый автомобиль"
  const handleAddNewClick = () => {
    setIsCreateModalOpen(true);
  };

  // Обработчик успешного создания автомобиля
  const handleVehicleCreated = (newVehicle: Vehicle) => {
    console.log('[VehicleSearchModal] Автомобиль успешно создан:', newVehicle);

    // Добавляем новый автомобиль в список и обновляем отфильтрованный список
    const updatedVehicles = [newVehicle, ...allVehicles];
    setAllVehicles(updatedVehicles);

    // Если есть активный поисковый запрос, применяем фильтрацию
    if (searchQuery.trim()) {
      filterVehicles(); // Используем существующую функцию для фильтрации
    } else {
      setFilteredVehicles(updatedVehicles);
    }

    // Показываем уведомление об успешном создании (опционально)
    setError(null);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Поиск автомобиля"
        className={styles.largeModal}
      >
        <div className={styles.modalContent} ref={modalContentRef}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Введите номер, марку, модель или VIN..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={handleSearchInputFocus}
              ref={searchInputRef}
            />
            <div className={styles.keyboardIcon} onClick={toggleKeyboard}>
              <BsKeyboard />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {isLoading ? (
            <div className={styles.loading}>Загрузка автомобилей...</div>
          ) : (
            <div className={styles.resultsList}>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={styles.resultItem}
                    onClick={() => handleSelectVehicle(vehicle)}
                  >
                    <div className={styles.vehicleName}>
                      {vehicle.make} {vehicle.model}{' '}
                      {vehicle.year && `(${vehicle.year})`}
                    </div>
                    <div className={styles.vehicleInfo}>
                      <span>
                        Номер: {vehicle.licensePlate || vehicle.plateNumber}
                      </span>
                      {vehicle.vin && <span>VIN: {vehicle.vin}</span>}
                    </div>
                    {vehicle.hasClient && vehicle.clientInfo && (
                      <div className={styles.ownerInfo}>
                        <span>
                          Владелец: {vehicle.clientInfo.firstName}{' '}
                          {vehicle.clientInfo.lastName}
                        </span>
                        {vehicle.clientInfo.discountPercent && (
                          <span className={styles.discount}>
                            Скидка: {vehicle.clientInfo.discountPercent}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.noResults}>
                  {searchQuery
                    ? 'Автомобили не найдены'
                    : 'Нет доступных автомобилей'}
                </div>
              )}
            </div>
          )}

          <div className={styles.buttonContainer}>
            {onBack && (
              <button className={styles.backButton} onClick={onBack}>
                Назад
              </button>
            )}
            <button className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button className={styles.addNewButton} onClick={handleAddNewClick}>
              Добавить новый автомобиль
            </button>
          </div>

          {showKeyboard && (
            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onCancel={() => setShowKeyboard(false)}
              onOk={() => setShowKeyboard(false)}
            />
          )}
        </div>
      </Modal>

      {/* Модальное окно для создания нового автомобиля */}
      <CreateVehicleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        warehouseId={warehouseId}
        onVehicleCreated={handleVehicleCreated}
      />
    </>
  );
};

export default VehicleSearchModal;
