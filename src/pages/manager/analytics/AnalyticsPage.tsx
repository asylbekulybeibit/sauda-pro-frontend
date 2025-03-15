import React from 'react';
import { Tabs } from 'antd';
import { useParams } from 'react-router-dom';
import { SalesAnalytics } from '@/components/manager/analytics/SalesAnalytics';
import { InventoryAnalytics } from '@/components/manager/analytics/InventoryAnalytics';
import { StaffPerformance } from '@/components/manager/analytics/StaffPerformance';
import { FinancialMetrics } from '@/components/manager/analytics/FinancialMetrics';

const AnalyticsPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();

  if (!shopId) {
    return null;
  }

  const items = [
    {
      key: 'sales',
      label: 'Продажи',
      children: <SalesAnalytics shopId={shopId} />,
    },
    {
      key: 'inventory',
      label: 'Инвентарь',
      children: <InventoryAnalytics shopId={shopId} />,
    },
    {
      key: 'staff',
      label: 'Персонал',
      children: <StaffPerformance shopId={shopId} />,
    },
    {
      key: 'financial',
      label: 'Финансы',
      children: <FinancialMetrics shopId={shopId} />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Аналитика</h1>
      <Tabs defaultActiveKey="sales" items={items} />
    </div>
  );
};

export default AnalyticsPage;
