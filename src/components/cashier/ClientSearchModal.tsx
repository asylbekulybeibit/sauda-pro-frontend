import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/modal';
import { cashierApi } from '../../services/cashierApi';
import styles from './SearchModal.module.css';
import { BsKeyboard } from 'react-icons/bs';
import VirtualKeyboard from './VirtualKeyboard';
import CreateClientModal from './CreateClientModal';

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
}

const ClientSearchModal: React.FC<ClientSearchModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  onSelectClient,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Функция для прокрутки поля поиска, чтобы оно было видимым при открытии клавиатуры
  const scrollToSearchInput = () => {
    if (!modalContentRef.current || !searchInputRef.current) return;

    // Высота клавиатуры (примерно) + дополнительный отступ
    const keyboardHeight = 350;
    const padding = 20;

    // Вычисляем позицию элемента относительно верха страницы
    const inputRect = searchInputRef.current.getBoundingClientRect();

    // Если поле поиска находится ниже, чем верхняя граница клавиатуры
    if (inputRect.bottom > window.innerHeight - keyboardHeight) {
      // Определяем, насколько нужно прокрутить
      const scrollAmount =
        inputRect.bottom - (window.innerHeight - keyboardHeight - padding);

      // Прокручиваем содержимое модального окна
      modalContentRef.current.scrollBy({
        top: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Применяем прокрутку при открытии/закрытии клавиатуры
  useEffect(() => {
    if (showKeyboard) {
      // Даем немного времени для рендеринга клавиатуры
      setTimeout(scrollToSearchInput, 100);
    } else if (modalContentRef.current) {
      // При закрытии клавиатуры прокручиваем вверх
      modalContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
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

  const loadAllClients = async () => {
    console.log('===== [ClientSearchModal] Загрузка всех клиентов =====');
    console.log(`[ClientSearchModal] warehouseId: ${warehouseId}`);

    try {
      setIsLoading(true);
      setError(null);

      console.log('[ClientSearchModal] Вызов API getAllClients...');
      const results = await cashierApi.getAllClients(warehouseId);

      console.log(`[ClientSearchModal] Получено клиентов: ${results.length}`);
      setAllClients(results);
      setFilteredClients(results);

      if (results.length === 0) {
        console.log('[ClientSearchModal] Предупреждение: список клиентов пуст');
        setError('Клиенты не найдены');
      }
    } catch (error) {
      console.error('[ClientSearchModal] Ошибка при загрузке клиентов:', error);
      let errorMessage = 'Не удалось загрузить список клиентов.';

      if (error instanceof Error) {
        console.error(`[ClientSearchModal] Сообщение ошибки: ${error.message}`);
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
            `[ClientSearchModal] Статус ошибки: ${axiosError.response.status}`
          );
          console.error(
            '[ClientSearchModal] Данные ошибки:',
            axiosError.response.data
          );
          errorMessage += ` Статус: ${axiosError.response.status}`;
        }
      }

      setError(errorMessage);
      setAllClients([]);
      setFilteredClients([]);
    } finally {
      console.log('[ClientSearchModal] Завершение загрузки клиентов');
      setIsLoading(false);
    }
  };

  const filterClients = () => {
    console.log(
      `[ClientSearchModal] Фильтрация клиентов по запросу: "${searchQuery}"`
    );
    console.log(
      `[ClientSearchModal] Всего клиентов для фильтрации: ${allClients.length}`
    );

    if (!searchQuery.trim()) {
      console.log(
        '[ClientSearchModal] Пустой запрос - показываем всех клиентов'
      );
      setFilteredClients(allClients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allClients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const name = client.name?.toLowerCase() || '';
      const phone = client.phone?.toLowerCase() || '';

      return (
        fullName.includes(query) ||
        name.includes(query) ||
        phone.includes(query)
      );
    });

    console.log(
      `[ClientSearchModal] Отфильтровано клиентов: ${filtered.length}`
    );
    setFilteredClients(filtered);
  };

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    onClose();
  };

  useEffect(() => {
    console.log(
      `[ClientSearchModal] useEffect сработал, isOpen: ${isOpen}, warehouseId: ${warehouseId}`
    );

    if (isOpen) {
      console.log(
        '[ClientSearchModal] Модальное окно открыто, очищаем state и загружаем клиентов'
      );
      setSearchQuery('');
      setShowKeyboard(false);
      loadAllClients();
    } else {
      console.log(
        '[ClientSearchModal] Модальное окно закрыто, не загружаем клиентов'
      );
    }

    return () => {
      console.log('[ClientSearchModal] Выполняется cleanup функция эффекта');
    };
  }, [isOpen, warehouseId]);

  useEffect(() => {
    console.log(
      `[ClientSearchModal] Поисковый запрос изменился: "${searchQuery}"`
    );
    console.log(
      `[ClientSearchModal] Текущее количество клиентов: ${allClients.length}`
    );
    filterClients();
  }, [searchQuery, allClients]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Обработчик нажатия на кнопку "Добавить нового клиента"
  const handleAddNewClick = () => {
    setIsCreateModalOpen(true);
  };

  // Обработчик успешного создания клиента
  const handleClientCreated = (newClient: Client) => {
    console.log('[ClientSearchModal] Клиент успешно создан:', newClient);

    // Добавляем нового клиента в список и обновляем отфильтрованный список
    const updatedClients = [newClient, ...allClients];
    setAllClients(updatedClients);

    // Если есть активный поисковый запрос, применяем фильтрацию
    if (searchQuery.trim()) {
      filterClients(); // Используем существующую функцию для фильтрации
    } else {
      setFilteredClients(updatedClients);
    }

    // Показываем уведомление об успешном создании (опционально)
    setError(null);

    // Можно также автоматически выбрать созданного клиента
    // onSelectClient(newClient);
    // onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Поиск клиента"
        className={styles.largeModal}
      >
        <div className={styles.modalContent} ref={modalContentRef}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Введите имя, фамилию или телефон клиента..."
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
            <div className={styles.loading}>Загрузка клиентов...</div>
          ) : (
            <div className={styles.resultsList}>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
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
              ) : (
                <div className={styles.noResults}>
                  {searchQuery
                    ? 'Клиенты не найдены'
                    : 'Нет доступных клиентов'}
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
            {/* Используем нашу функцию handleAddNewClick вместо onAddNew */}
            <button className={styles.addNewButton} onClick={handleAddNewClick}>
              Добавить нового клиента
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

      {/* Модальное окно для создания нового клиента */}
      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        warehouseId={warehouseId}
        onClientCreated={handleClientCreated}
      />
    </>
  );
};

export default ClientSearchModal;
