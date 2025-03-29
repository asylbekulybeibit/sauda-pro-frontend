import React from 'react';
import { Tabs, Typography, Card } from 'antd';
import InventoryNotifications from './InventoryNotifications';
import VehicleNotifications from './VehicleNotifications';

const { Title } = Typography;

const NotificationsPage: React.FC = () => {
  const items = [
    {
      key: '1',
      label: 'Складские уведомления',
      children: <InventoryNotifications />,
    },
    {
      key: '2',
      label: 'Автомобильные уведомления',
      children: <VehicleNotifications />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>Настройки уведомлений</Title>

      <Card style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="1" items={items} />
      </Card>
    </div>
  );
};

export default NotificationsPage;
