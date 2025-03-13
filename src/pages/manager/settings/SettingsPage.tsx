import React from 'react';
import { Tabs } from 'antd';
import CurrencySettingsPage from './CurrencySettingsPage';
import PrinterSettingsPage from './PrinterSettingsPage';

const { TabPane } = Tabs;

function SettingsPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Настройки</h1>
      </div>

      <Tabs defaultActiveKey="currency">
        <TabPane tab="Валюта" key="currency">
          <CurrencySettingsPage />
        </TabPane>
        <TabPane tab="Принтер" key="printer">
          <PrinterSettingsPage />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default SettingsPage;
