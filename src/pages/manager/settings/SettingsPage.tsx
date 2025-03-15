import React, { useEffect } from 'react';
import { Tabs, Spin } from 'antd';
import { ShopSettings } from '@/components/manager/settings/ShopSettings';
import { CurrencySettings } from '@/components/manager/settings/CurrencySettings';
import { PrinterSettings } from '@/components/manager/settings/PrinterSettings';
import { NotificationSettings } from '@/components/manager/settings/NotificationSettings';
import { TaxSettings } from '@/components/manager/settings/TaxSettings';
import { useShop } from '@/hooks/useShop';
import { useParams } from 'react-router-dom';

function SettingsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentShop, loading, updateShop } = useShop();

  useEffect(() => {
    console.log('SettingsPage mounted');
    console.log('ShopId from URL:', shopId);
    console.log('Current shop:', currentShop);
    console.log('Loading state:', loading);
  }, [shopId, currentShop, loading]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!currentShop) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>Магазин не найден</h2>
        <p>Пожалуйста, проверьте подключение и обновите страницу</p>
      </div>
    );
  }

  console.log('Rendering settings tabs');

  return (
    <Tabs
      defaultActiveKey="shop"
      items={[
        {
          key: 'shop',
          label: 'Основные',
          children: <ShopSettings shop={currentShop} onSave={updateShop} />,
        },
        {
          key: 'currency',
          label: 'Валюта',
          children: <CurrencySettings shop={currentShop} onSave={updateShop} />,
        },
        {
          key: 'tax',
          label: 'Налоги',
          children: <TaxSettings shop={currentShop} onSave={updateShop} />,
        },
        {
          key: 'printer',
          label: 'Принтер',
          children: <PrinterSettings shop={currentShop} onSave={updateShop} />,
        },
        {
          key: 'notifications',
          label: 'Уведомления',
          children: (
            <NotificationSettings shop={currentShop} onSave={updateShop} />
          ),
        },
      ]}
    />
  );
}

export default SettingsPage;
