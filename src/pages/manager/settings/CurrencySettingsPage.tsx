import React from 'react';
import { Card } from 'antd';
import { CurrencySettings } from '@/components/manager/settings/CurrencySettings';
import { useShop } from '@/hooks/useShop';

const CurrencySettingsPage: React.FC = () => {
  const { currentShop, updateShop } = useShop();

  if (!currentShop) {
    return <div>Пожалуйста, выберите магазин</div>;
  }

  return (
    <Card title="Настройки валюты">
      <CurrencySettings shop={currentShop} onSave={updateShop} />
    </Card>
  );
};

export default CurrencySettingsPage;
