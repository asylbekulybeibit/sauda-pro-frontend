import React from 'react';
import { Tabs } from 'antd';
import CurrencySettingsPage from './CurrencySettingsPage';
import PrinterSettingsPage from './PrinterSettingsPage';

function SettingsPage() {
  const items = [
    {
      key: 'currency',
      label: 'Валюта',
      children: <CurrencySettingsPage />,
    },
    {
      key: 'printer',
      label: 'Принтер',
      children: <PrinterSettingsPage />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Настройки</h1>
      </div>

      <Tabs defaultActiveKey="currency" items={items} />
    </div>
  );
}

export default SettingsPage;
