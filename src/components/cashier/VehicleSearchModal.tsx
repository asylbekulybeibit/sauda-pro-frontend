import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { cashierApi } from '../../services/cashierApi';
import styles from './SearchModal.module.css';

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) return;

    try {
      setIsLoading(true);
      setError(null);
      const results = await cashierApi.searchVehicles(warehouseId, searchQuery);
      setVehicles(results);
    } catch (err) {
      console.error('Ошибка при поиске автомобилей:', err);
      setError('Не удалось найти автомобили. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    onSelectVehicle(vehicle);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setVehicles([]);
      setError(null);
    }
  }, [isOpen]);

  // Выполнить поиск при нажатии Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Поиск автомобиля">
      <div className={styles.modalContent}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Введите номер, марку, модель или VIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className={styles.searchButton} onClick={handleSearch}>
            Поиск
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {isLoading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <div className={styles.resultsList}>
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
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
            ) : searchQuery.length > 0 ? (
              <div className={styles.noResults}>Автомобили не найдены</div>
            ) : null}
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
      </div>
    </Modal>
  );
};

export default VehicleSearchModal;
