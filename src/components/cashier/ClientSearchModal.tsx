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

  // Улучшенный обработчик фокуса для поля ввода
  const handleSearchInputFocus = () => {
    // Запускаем серию прокруток с разными интервалами для надежности
    scrollToSearchInput();
    setTimeout(scrollToSearchInput, 50);
    setTimeout(scrollToSearchInput, 150);
    setTimeout(scrollToSearchInput, 300);
    setTimeout(scrollToSearchInput, 600);
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
              onFocus={handleSearchInputFocus}
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
