import React from 'react';
import { Row, Col, Divider, Statistic, Card, Typography, Tag } from 'antd';
import { Shift, ShiftStatus } from '@/types/cash-register';

const { Text, Title } = Typography;

interface ShiftSummaryProps {
  shift: {
    id: string;
    registerName: string;
    cashierName: string;
    openedAt: string;
    closedAt?: string;
    status: ShiftStatus;
    sales: number;
    returns: number;
    totalSales: number;
    cashPayments: number;
    cardPayments: number;
  };
  compact?: boolean;
}

/**
 * Компонент отображения итогов смены с детализацией продаж и оплат
 */
const ShiftSummary: React.FC<ShiftSummaryProps> = ({
  shift,
  compact = false,
}) => {
  // Получение статуса смены
  const getStatusTag = (status: ShiftStatus) => {
    switch (status) {
      case 'open':
        return <Tag color="green">Открыта</Tag>;
      case 'closed':
        return <Tag color="default">Закрыта</Tag>;
      case 'paused':
        return <Tag color="orange">Приостановлена</Tag>;
      default:
        return <Tag>Неизвестно</Tag>;
    }
  };

  // Рассчитываем длительность смены
  const calculateShiftDuration = () => {
    const startTime = new Date(shift.openedAt).getTime();
    const endTime = shift.closedAt
      ? new Date(shift.closedAt).getTime()
      : new Date().getTime();

    const durationInMs = endTime - startTime;
    const hours = Math.floor(durationInMs / 3600000);
    const minutes = Math.floor((durationInMs % 3600000) / 60000);

    return `${hours} ч. ${minutes} мин.`;
  };

  // Компактный режим для использования в карточках
  if (compact) {
    return (
      <Card bordered={false} className="bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <Text strong>{shift.registerName}</Text>
          {getStatusTag(shift.status)}
        </div>

        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text type="secondary">Открыта:</Text>
          </Col>
          <Col span={12} className="text-right">
            <Text>{new Date(shift.openedAt).toLocaleString()}</Text>
          </Col>

          {shift.closedAt && (
            <>
              <Col span={12}>
                <Text type="secondary">Закрыта:</Text>
              </Col>
              <Col span={12} className="text-right">
                <Text>{new Date(shift.closedAt).toLocaleString()}</Text>
              </Col>
            </>
          )}

          <Col span={12}>
            <Text type="secondary">Итого:</Text>
          </Col>
          <Col span={12} className="text-right">
            <Text strong>{shift.totalSales.toFixed(2)} ₽</Text>
          </Col>
        </Row>
      </Card>
    );
  }

  // Полный режим для страницы закрытия смены
  return (
    <div>
      <div className="mb-4">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">Касса:</Text>
            <div>
              <Text strong>{shift.registerName}</Text>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">Кассир:</Text>
            <div>
              <Text strong>{shift.cashierName}</Text>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">Статус:</Text>
            <div>{getStatusTag(shift.status)}</div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">Длительность:</Text>
            <div>
              <Text strong>{calculateShiftDuration()}</Text>
            </div>
          </Col>
        </Row>
      </div>

      <Divider>Итоги смены</Divider>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Сумма продаж"
            value={shift.sales}
            precision={2}
            suffix="₽"
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Сумма возвратов"
            value={shift.returns}
            precision={2}
            suffix="₽"
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Итого за смену"
            value={shift.totalSales}
            precision={2}
            suffix="₽"
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
      </Row>

      <Divider>Способы оплаты</Divider>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Statistic
            title="Оплата наличными"
            value={shift.cashPayments}
            precision={2}
            suffix="₽"
          />
        </Col>
        <Col xs={24} sm={12}>
          <Statistic
            title="Безналичная оплата"
            value={shift.cardPayments}
            precision={2}
            suffix="₽"
          />
        </Col>
      </Row>
    </div>
  );
};

export default ShiftSummary;
