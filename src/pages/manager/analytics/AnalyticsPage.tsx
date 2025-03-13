import React from 'react';
import { Tabs } from 'antd';
import { useParams } from 'react-router-dom';
import { SalesAnalytics } from '@/components/manager/analytics/SalesAnalytics';
import { InventoryAnalytics } from '@/components/manager/analytics/InventoryAnalytics';
import { StaffPerformance } from '@/components/manager/analytics/StaffPerformance';
import { FinancialMetrics } from '@/components/manager/analytics/FinancialMetrics';

const { TabPane } = Tabs;

const AnalyticsPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();

  if (!shopId) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Аналитика</h1>
      <Tabs defaultActiveKey="sales">
        <TabPane tab="Продажи" key="sales">
          <SalesAnalytics shopId={shopId} />
        </TabPane>
        <TabPane tab="Инвентарь" key="inventory">
          <InventoryAnalytics shopId={shopId} />
        </TabPane>
        <TabPane tab="Персонал" key="staff">
          <StaffPerformance shopId={shopId} />
        </TabPane>
        <TabPane tab="Финансы" key="financial">
          <FinancialMetrics shopId={shopId} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
