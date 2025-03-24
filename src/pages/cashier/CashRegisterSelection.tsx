import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Empty,
  Spin,
  message,
  Modal,
  Alert,
  Divider,
} from 'antd';
import { HistoryOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import RegisterCard from '@/components/cashier/shifts/RegisterCard';
import UnclosedShiftAlert from '@/components/cashier/shifts/UnclosedShiftAlert';
import { useRoleStore } from '@/store/roleStore';
import { CashRegister, CashRegisterStatus } from '@/types/cash-register';
import {
  getCashRegisters,
  checkUnclosedShift,
  openShift,
} from '@/services/cashierApi';
import { showErrorMessage, handleApiError } from '@/utils/errorHandling';
import { sendShiftOpenNotification } from '@/utils/notificationUtils';

/**
 * Страница выбора кассы - первая страница при входе в кассир-панель
 */
const CashRegisterSelection: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole } = useRoleStore();
  const [isLoading, setIsLoading] = useState(true);
  const [openingShift, setOpeningShift] = useState(false);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(
    null
  );
  const [hasUnclosedShift, setHasUnclosedShift] = useState(false);
  const [unclosedShiftId, setUnclosedShiftId] = useState<string | null>(null);
  const [unclosedShiftRegisterId, setUnclosedShiftRegisterId] = useState<
    string | null
  >(null);
  const [shopName, setShopName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const navigate = useNavigate();

  // Загрузка информации о магазине из roleStore
  useEffect(() => {
    if (currentRole?.type === 'shop') {
      setShopName(currentRole.shop.name);
    } else if (shopId) {
      // Если информация о магазине недоступна в roleStore, загружаем по ID
      setShopName(`Магазин ${shopId}`);
    }
  }, [currentRole, shopId]);

  // Загрузка списка доступных касс
  useEffect(() => {
    const loadRegistersAndShifts = async () => {
      if (!shopId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Получаем список касс через API
        const registersData = await getCashRegisters(shopId);
        setRegisters(registersData);

        console.log('Загружены кассы:', registersData.length);

        // Проверяем наличие незакрытой смены
        try {
          const unclosedShiftData = await checkUnclosedShift(shopId);
          setHasUnclosedShift(unclosedShiftData.hasUnclosed);
          if (unclosedShiftData.shiftId) {
            setUnclosedShiftId(unclosedShiftData.shiftId);
            setUnclosedShiftRegisterId(unclosedShiftData.registerId || null);
            console.log(
              'Обнаружена незакрытая смена:',
              unclosedShiftData.shiftId,
              'на кассе:',
              unclosedShiftData.registerId
            );
          }
        } catch (shiftError) {
          console.error('Ошибка при проверке незакрытых смен:', shiftError);
          message.warning('Не удалось проверить наличие незакрытых смен');
        }
      } catch (error) {
        console.error('Ошибка при загрузке списка касс:', error);

        const { message: errorMessage, statusCode } = handleApiError(
          error,
          'Не удалось загрузить список касс'
        );

        setError(`${errorMessage}${statusCode ? ` (Код: ${statusCode})` : ''}`);

        // Показываем сообщение об ошибке пользователю
        message.error(errorMessage);

        // Если не удалось загрузить данные, устанавливаем пустой массив
        setRegisters([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRegistersAndShifts();
  }, [shopId]);

  // Обработчик выбора кассы - просто выбираем кассу без всплывающих уведомлений
  const handleRegisterSelect = (register: CashRegister) => {
    setSelectedRegisterId(register.id);
    console.log('Выбрана касса:', register.name, register.id);
  };

  // Обработчик нажатия на кнопку перехода к выбору услуги на активной кассе
  const handleGoToService = () => {
    // Проверяем, есть ли незакрытая смена на этой кассе
    if (hasUnclosedShift && unclosedShiftRegisterId === selectedRegisterId) {
      navigate(`/cashier/${shopId}/select-type`);
    } else {
      message.warning('У вас нет открытой смены на этой кассе');
    }
  };

  // Новая функция для прямого открытия смены без модального окна
  const openShiftDirectly = async () => {
    // Проверяем необходимые параметры перед открытием смены
    if (!selectedRegisterId) {
      message.error('Необходимо выбрать кассу перед открытием смены');
      console.error('[CashRegisterSelection] No register selected');
      return;
    }

    if (!shopId || shopId.trim() === '') {
      message.error(
        'ID магазина не определен. Обновите страницу или обратитесь к администратору'
      );
      console.error('[CashRegisterSelection] shopId is empty or invalid:', {
        shopId,
        type: typeof shopId,
      });
      return;
    }

    console.log('[CashRegisterSelection] Starting to open shift with:', {
      shopId,
      selectedRegisterId,
      shopIdType: typeof shopId,
      registerIdType: typeof selectedRegisterId,
    });

    try {
      setOpeningShift(true);

      // Получаем имя кассира из текущей роли
      let cashierName = 'Кассир'; // Значение по умолчанию
      if (currentRole?.type === 'shop') {
        // Если доступны данные профиля, используем их
        cashierName = currentRole.shop.name; // Или другое поле, содержащее имя кассира
      }

      const selectedReg = registers.find(
        (register) => register.id === selectedRegisterId
      );

      // Детальное логирование непосредственно перед вызовом API
      console.log('[CashRegisterSelection] About to call openShift API with:', {
        shopId,
        selectedRegisterId,
        registerName: selectedReg?.name,
        currentRegistersList: registers.map((r) => ({
          id: r.id,
          name: r.name,
        })),
      });

      // Вызов API для открытия смены (упрощенная версия)
      await openShift(shopId, selectedRegisterId);

      console.log('[CashRegisterSelection] Successfully opened shift');

      message.success(
        `Смена на кассе "${selectedReg?.name || ''}" успешно открыта`
      );

      // Асинхронно отправляем уведомление менеджеру без указания суммы
      try {
        sendShiftOpenNotification(
          shopId,
          selectedReg?.name || '',
          cashierName
        ).then((success) => {
          if (success) {
            console.log('✅ Уведомление менеджеру успешно отправлено');
          } else {
            console.warn('⚠️ Не удалось отправить уведомление менеджеру');
          }
        });
      } catch (notificationError) {
        console.error('Ошибка при отправке уведомления:', notificationError);
      }

      // После успешного открытия смены обновляем состояние
      setHasUnclosedShift(true);
      setUnclosedShiftRegisterId(selectedRegisterId);

      // Перенаправляем на страницу выбора типа услуги
      navigate(`/cashier/${shopId}/select-type`);
    } catch (error) {
      console.error('Ошибка при открытии смены:', error);
      const selectedReg = registers.find(
        (register) => register.id === selectedRegisterId
      );
      showErrorMessage(
        error,
        `Не удалось открыть смену на кассе "${selectedReg?.name}"`
      );
    } finally {
      setOpeningShift(false);
    }
  };

  // Обработчик открытия смены
  const handleOpenShift = () => {
    // Если касса не выбрана, показываем сообщение
    if (!selectedRegisterId) {
      message.warning('Пожалуйста, выберите кассу для открытия смены');
      return;
    }

    // Проверяем, есть ли незакрытая смена
    if (hasUnclosedShift) {
      const selectedRegisterHasOpenShift =
        unclosedShiftRegisterId === selectedRegisterId;

      if (selectedRegisterHasOpenShift) {
        // Если выбранная касса уже имеет открытую смену, перейти к выбору типа услуги
        navigate(`/cashier/${shopId}/select-type`);
      } else {
        // Если есть открытая смена на другой кассе
        Modal.error({
          title: 'Невозможно открыть смену',
          content:
            'У вас есть незакрытая смена на другой кассе. Закройте её перед открытием новой.',
          okText: 'Понятно',
        });
      }
      return;
    }

    // Если касса на обслуживании, показываем сообщение
    if (selectedRegister?.status === CashRegisterStatus.MAINTENANCE) {
      message.warning(
        'Невозможно открыть смену на этой кассе. Выберите другую кассу.'
      );
      return;
    }

    // Временное решение: пропускаем модальное окно и сразу открываем смену
    openShiftDirectly();
  };

  // Получение данных выбранной кассы
  const selectedRegister = registers.find(
    (register) => register.id === selectedRegisterId
  );

  // Проверяем, является ли выбранная касса кассой с открытой сменой
  const selectedRegisterHasOpenShift =
    hasUnclosedShift && unclosedShiftRegisterId === selectedRegisterId;

  // Функция для повторного запроса данных
  const handleRetry = async () => {
    if (!shopId) return;

    message.info('Повторная загрузка данных...');

    try {
      setIsLoading(true);
      setError(null);

      const registersData = await getCashRegisters(shopId);
      setRegisters(registersData);

      // Повторно проверяем наличие незакрытой смены
      const unclosedShiftData = await checkUnclosedShift(shopId);
      setHasUnclosedShift(unclosedShiftData.hasUnclosed);
      setUnclosedShiftId(unclosedShiftData.shiftId || null);
      setUnclosedShiftRegisterId(unclosedShiftData.registerId || null);

      message.success('Данные успешно загружены');
    } catch (error) {
      const { message: errorMessage } = handleApiError(
        error,
        'Не удалось загрузить список касс'
      );
      setError(errorMessage);
      message.error(errorMessage);
      setRegisters([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Выбор кассы</h1>
          {shopName && <p className="text-gray-500">{shopName}</p>}
        </div>

        <Button
          icon={<HistoryOutlined />}
          onClick={() => navigate(`/cashier/${shopId}/shift-history`)}
        >
          История смен
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="my-8 text-center">
          <Empty
            description={
              <div>
                <p className="text-red-500 font-medium">{error}</p>
                <p className="text-gray-500 mt-1">
                  Проверьте настройки соединения или обратитесь к администратору
                  системы.
                </p>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button type="primary" className="mt-4" onClick={handleRetry}>
            Попробовать снова
          </Button>
        </div>
      ) : (
        <>
          {/* Уведомление о незакрытой смене */}
          {hasUnclosedShift && unclosedShiftId && (
            <UnclosedShiftAlert
              shopId={shopId || ''}
              shiftId={unclosedShiftId}
            />
          )}

          {/* Список касс */}
          {registers.length > 0 ? (
            <>
              <h2 className="text-lg font-medium mb-4">Доступные кассы:</h2>
              <Row gutter={[16, 16]}>
                {registers.map((register) => (
                  <Col xs={24} sm={12} md={8} key={register.id}>
                    <RegisterCard
                      register={register}
                      onClick={handleRegisterSelect}
                      isSelected={register.id === selectedRegisterId}
                    />
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <Empty description="Доступных касс не найдено" className="my-8" />
          )}

          {/* Информация о выбранной кассе */}
          {selectedRegister && (
            <div className="mt-6 mb-4">
              <Alert
                type="info"
                showIcon
                message={
                  <span>
                    Выбрана касса: <strong>{selectedRegister.name}</strong>
                    {selectedRegisterHasOpenShift && (
                      <span className="ml-2 text-green-600">(Активна)</span>
                    )}
                    {selectedRegister.status ===
                      CashRegisterStatus.MAINTENANCE && (
                      <span className="ml-2 text-orange-500">
                        (На обслуживании)
                      </span>
                    )}
                  </span>
                }
                description={
                  selectedRegisterHasOpenShift
                    ? 'Для этой кассы уже открыта смена. Вы можете начать работу.'
                    : selectedRegister.status === CashRegisterStatus.MAINTENANCE
                    ? 'Эта касса находится на обслуживании и недоступна для работы.'
                    : 'Вы можете открыть смену на этой кассе.'
                }
              />
            </div>
          )}

          {/* Кнопка открытия смены */}
          {registers.length > 0 && (
            <Card className="mt-6">
              <div className="max-w-md mx-auto text-center">
                <h3 className="text-lg font-medium mb-4">
                  {selectedRegister
                    ? `Открыть смену на кассе "${selectedRegister.name}"`
                    : 'Выберите кассу и откройте смену'}
                </h3>

                <Button
                  type="primary"
                  size="large"
                  onClick={handleOpenShift}
                  disabled={!selectedRegisterId || hasUnclosedShift}
                  loading={openingShift}
                  style={{ minWidth: '200px', height: '48px' }}
                >
                  Открыть смену
                </Button>

                {selectedRegisterHasOpenShift && (
                  <div className="mt-4">
                    <Divider>или</Divider>
                    <Button
                      type="default"
                      size="large"
                      onClick={handleGoToService}
                      style={{ minWidth: '200px' }}
                    >
                      Перейти к выбору услуги
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CashRegisterSelection;
