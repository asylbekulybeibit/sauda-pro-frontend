import React from 'react';
import { Card } from 'antd';
import { PrinterSettings } from '@/components/manager/settings/PrinterSettings';
import { useShop } from '@/hooks/useShop';

const PrinterSettingsPage: React.FC = () => {
  const { currentShop, updateShop } = useShop();

  if (!currentShop) {
    return <div>Пожалуйста, выберите магазин</div>;
  }

  return (
    <Card title="Настройки принтера">
      <PrinterSettings shop={currentShop} onSave={updateShop} />
    </Card>
  );
};

export default PrinterSettingsPage;
