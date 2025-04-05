import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { cashierApi } from '../../services/cashierApi';
import styles from './SearchModal.module.css';

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

interface ClientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  onSelectClient: (client: Client) => void;
  onBack?: () => void;
  onAddNew?: () => void;
}

const ClientSearchModal: React.FC<ClientSearchModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  onSelectClient,
  onBack,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) return;

    try {
      setIsLoading(true);
      setError(null);
      const results = await cashierApi.searchClients(warehouseId, searchQuery);
      setClients(results);
    } catch (err) {
      console.error('Ошибка при поиске клиентов:', err);
      setError('Не удалось найти клиентов. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setClients([]);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Поиск клиента">
      <div className={styles.modalContent}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Введите имя, фамилию или телефон клиента..."
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
            {clients.length > 0 ? (
              clients.map((client) => (
                <div
                  key={client.id}
                  className={styles.resultItem}
                  onClick={() => handleSelectClient(client)}
                >
                  <div className={styles.clientName}>
                    {client.name || `${client.firstName} ${client.lastName}`}
                  </div>
                  <div className={styles.clientInfo}>
                    <span>Тел: {client.phone}</span>
                    {client.discountPercent || client.discount ? (
                      <span className={styles.discount}>
                        Скидка: {client.discount || client.discountPercent}%
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : searchQuery.length > 0 ? (
              <div className={styles.noResults}>Клиенты не найдены</div>
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
              Добавить нового клиента
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ClientSearchModal;
