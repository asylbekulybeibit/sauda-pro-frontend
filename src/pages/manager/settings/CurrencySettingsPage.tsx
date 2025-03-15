import React from 'react';
import { Card, Spin } from 'antd';
import { CurrencySettings } from '@/components/manager/settings/CurrencySettings';
import { useShop } from '@/hooks/useShop';

const CurrencySettingsPage: React.FC = () => {
  const { currentShop, updateShop, loading } = useShop();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spin size="large" />
      </div>
    );
  }

  if (!currentShop) {
    return <div>Ошибка загрузки данных магазина</div>;
  }

  return (
    <Card title="Настройки валюты">
      <CurrencySettings shop={currentShop} onSave={updateShop} />
    </Card>
  );
};

export default CurrencySettingsPage;
