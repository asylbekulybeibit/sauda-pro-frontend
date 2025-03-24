import React from 'react';
import { Card, Badge, Tag } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
} from '@ant-design/icons';
import { CashRegister, CashRegisterStatus } from '@/types/cash-register';
import { formatDate } from '@/utils/formatters';

interface RegisterCardProps {
  register: CashRegister;
  onClick: (register: CashRegister) => void;
  isSelected: boolean;
}

/**
 * Компонент карточки кассы для страницы выбора
 */
const RegisterCard: React.FC<RegisterCardProps> = ({
  register,
  onClick,
  isSelected,
}) => {
  // Определение статуса для отображения
  const getStatusInfo = (status: CashRegisterStatus) => {
    switch (status) {
      case CashRegisterStatus.ACTIVE:
        return {
          text: 'Активна',
          color: 'success',
          icon: <CheckCircleFilled />,
        };
      case CashRegisterStatus.INACTIVE:
        return {
          text: 'Неактивна',
          color: 'default',
          icon: <CloseCircleFilled />,
        };
      case CashRegisterStatus.MAINTENANCE:
        return {
          text: 'На обслуживании',
          color: 'warning',
          icon: <ClockCircleFilled />,
        };
      default:
        return {
          text: 'Неизвестно',
          color: 'default',
          icon: null,
        };
    }
  };

  const statusInfo = getStatusInfo(register.status);

  return (
    <Card
      hoverable
      className={`h-full ${isSelected ? 'border-2 border-blue-500' : ''}`}
      onClick={() => onClick(register)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium">{register.name}</h3>
        <Badge
          status={statusInfo.color as any}
          text={
            <Tag
              icon={statusInfo.icon}
              color={
                statusInfo.color !== 'default' ? statusInfo.color : undefined
              }
            >
              {statusInfo.text}
            </Tag>
          }
        />
      </div>

      <div className="text-gray-500 mb-3">
        <p>{register.description || 'Без описания'}</p>
        {register.lastActiveAt && (
          <p className="text-xs mt-1">
            Последняя активность: {formatDate(register.lastActiveAt)}
          </p>
        )}
      </div>

      {register.currentShift && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-sm">
            <span className="font-medium">Текущая смена:</span>{' '}
            {register.currentShift.openedBy?.name || 'Нет данных'}
          </p>
          <p className="text-xs text-gray-500">
            Открыта: {formatDate(register.currentShift.openedAt)}
          </p>
        </div>
      )}
    </Card>
  );
};

export default RegisterCard;
