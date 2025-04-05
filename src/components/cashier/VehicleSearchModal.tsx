import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/modal';
import { cashierApi } from '../../services/cashierApi';
import styles from './SearchModal.module.css';
import { BsKeyboard } from 'react-icons/bs';
import VirtualKeyboard from './VirtualKeyboard';

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
  onAddNew?: () => void;
}

const VehicleSearchModal: React.FC<VehicleSearchModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  onSelectVehicle,
  onBack,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Поиск автомобиля"
      className={styles.largeModal}
    >
      <div className={styles.modalContent}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Введите номер, марку, модель или VIN..."
            value={searchQuery}
            onChange={handleSearchInputChange}
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
          {onAddNew && (
            <button className={styles.addNewButton} onClick={onAddNew}>
              Добавить новый автомобиль
            </button>
          )}
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
  );
};

export default VehicleSearchModal;
