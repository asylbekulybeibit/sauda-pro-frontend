import React, { useState, useEffect } from 'react';
import { Alert, Button, Spin, Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { getShiftDetails, closeShift } from '@/services/cashierApi';
import { Shift } from '@/types/cash-register';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { handleApiError, showErrorMessage } from '@/utils/errorHandling';
import { useRoleStore } from '@/store/roleStore';
import { sendShiftCloseNotification } from '@/utils/notificationUtils';

interface UnclosedShiftAlertProps {
  shopId: string;
  shiftId: string;
}

/**
 * Компонент для отображения предупреждения о незакрытой смене
 */
const UnclosedShiftAlert: React.FC<UnclosedShiftAlertProps> = ({
  shopId,
  shiftId,
}) => {
  const [shift, setShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentRole } = useRoleStore();

  // Загрузка данных о смене
  useEffect(() => {
    const fetchShiftDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const shiftData = await getShiftDetails(shopId, shiftId);
        setShift(shiftData);
      } catch (error) {
        console.error('Ошибка при загрузке данных смены:', error);
        const { message: errorMessage } = handleApiError(
          error,
          'Не удалось загрузить данные о незакрытой смене'
        );
        setError(errorMessage);
        showErrorMessage(
          error,
          'Не удалось загрузить данные о незакрытой смене'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (shopId && shiftId) {
      fetchShiftDetails();
    }
  }, [shopId, shiftId]);

  // Обработчик закрытия смены
  const handleCloseShift = () => {
    Modal.confirm({
      title: 'Закрыть смену?',
      icon: <ExclamationCircleOutlined />,
      content: `Вы уверены, что хотите закрыть смену на кассе "${
        shift?.registerName || 'Неизвестная касса'
      }"?`,
      okText: 'Закрыть смену',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          setIsClosing(true);

          // Проверяем, что shopId не пустой
          if (!shopId) {
            throw new Error('ID магазина не определен');
          }

          // Закрытие смены (упрощенная версия с проверкой shopId)
          await closeShift(shopId, shiftId);

          // Получаем имя кассира из текущей роли или из данных смены
          let cashierName = shift?.cashierName || 'Неизвестный кассир';
          if (currentRole?.type === 'shop') {
            cashierName = currentRole.shop.name; // Или другое поле, содержащее имя кассира
          }

          // Отправляем уведомление о закрытии смены
          try {
            sendShiftCloseNotification(
              shopId,
              shift?.registerName || 'Неизвестная касса',
              cashierName
            ).then((success) => {
              if (success) {
                console.log(
                  '✅ Уведомление о закрытии незакрытой смены успешно отправлено'
                );
              } else {
                console.warn(
                  '⚠️ Не удалось отправить уведомление о закрытии незакрытой смены'
                );
              }
            });
          } catch (notificationError) {
            console.error(
              'Ошибка при отправке уведомления о закрытии смены:',
              notificationError
            );
            // Не показываем пользователю ошибку отправки уведомления
          }

          message.success('Смена успешно закрыта');

          // Перезагрузка страницы для обновления данных
          window.location.reload();
        } catch (error) {
          console.error('Ошибка при закрытии смены:', error);
          showErrorMessage(error, 'Не удалось закрыть смену');
        } finally {
          setIsClosing(false);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4 mb-6 bg-blue-50 rounded-lg">
        <Spin />
        <span className="ml-2">Загрузка данных о незакрытой смене...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Ошибка"
        description={error}
        type="error"
        showIcon
        className="mb-6"
      />
    );
  }

  if (!shift) {
    return null;
  }

  return (
    <Alert
      message="Внимание! Есть незакрытая смена"
      description={
        <div>
          <p>
            На кассе <strong>{shift.registerName}</strong> имеется незакрытая
            смена от {formatDate(shift.openedAt)}.
          </p>
          <p>
            Открыта пользователем:{' '}
            <strong>
              {shift.openedBy?.name || 'Неизвестный пользователь'}
            </strong>
          </p>
          <Button
            type="primary"
            danger
            onClick={handleCloseShift}
            loading={isClosing}
            className="mt-2"
          >
            Закрыть смену
          </Button>
        </div>
      }
      type="warning"
      showIcon
      className="mb-6"
    />
  );
};

export default UnclosedShiftAlert;
