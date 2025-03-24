import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { openShift } from '@/services/cashierApi';
import { handleApiError, showErrorMessage } from '@/utils/errorHandling';
import { CashRegisterStatus } from '@/types/cash-register';
import { useRoleStore } from '@/store/roleStore';
import { sendShiftOpenNotification } from '@/utils/notificationUtils';

interface OpenShiftButtonProps {
  shopId: string;
  registerId: string;
  registerName: string;
  disabled?: boolean;
  status?: CashRegisterStatus;
}

/**
 * Компонент кнопки открытия смены (упрощенная версия)
 */
const OpenShiftButton: React.FC<OpenShiftButtonProps> = ({
  shopId,
  registerId,
  registerName,
  disabled = false,
  status,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { currentRole } = useRoleStore();

  // Обработчик нажатия на кнопку
  const handleButtonClick = () => {
    if (status === CashRegisterStatus.ACTIVE) {
      // Если смена уже открыта, предложить перейти к выбору услуги
      Modal.confirm({
        title: 'Смена уже открыта',
        content: `На кассе "${registerName}" уже открыта смена. Хотите перейти к выбору типа услуги?`,
        okText: 'Перейти к выбору услуги',
        cancelText: 'Отмена',
        onOk: () => {
          navigate(`/cashier/${shopId}/select-type`);
        },
      });
      return;
    }

    // Если смена не открыта, сразу открываем её
    handleOpenShift();
  };

  // Обработчик открытия смены
  const handleOpenShift = async () => {
    try {
      setIsLoading(true);

      // Проверяем, что shopId не пустой
      if (!shopId) {
        throw new Error('ID магазина не определен');
      }

      // Добавляем подробное логирование
      console.log('[OpenShiftButton] Opening shift with params:', {
        shopId,
        registerId,
        registerName,
        shopIdType: typeof shopId,
        registerIdType: typeof registerId,
      });

      // Вызов API для открытия смены (упрощенная версия)
      await openShift(shopId, registerId);

      message.success(`Смена на кассе "${registerName}" успешно открыта`);

      // Получаем имя кассира
      let cashierName = 'Кассир'; // Значение по умолчанию
      if (currentRole?.type === 'shop') {
        // Если доступны данные профиля, используем их
        cashierName = currentRole.shop.name; // Или другое поле, содержащее имя кассира
      }

      // Асинхронно отправляем уведомление менеджеру
      try {
        sendShiftOpenNotification(shopId, registerName, cashierName).then(
          (success) => {
            if (success) {
              console.log('✅ Уведомление менеджеру успешно отправлено');
            } else {
              console.warn('⚠️ Не удалось отправить уведомление менеджеру');
            }
          }
        );
      } catch (notificationError) {
        console.error('Ошибка при отправке уведомления:', notificationError);
        // Не показываем пользователю ошибку отправки уведомления, т.к. смена уже открыта
      }

      // Перенаправление на страницу выбора типа услуги
      navigate(`/cashier/${shopId}/select-type`);
    } catch (error) {
      console.error('Ошибка при открытии смены:', error);
      showErrorMessage(
        error,
        `Не удалось открыть смену на кассе "${registerName}"`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      size="large"
      disabled={disabled}
      onClick={handleButtonClick}
      loading={isLoading}
      className="w-full"
      style={{ height: '48px' }}
    >
      Открыть смену
    </Button>
  );
};

export default OpenShiftButton;
