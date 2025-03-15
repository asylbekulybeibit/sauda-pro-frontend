import { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getReports } from '@/services/managerApi';
import { ReportList } from '@/components/manager/reports/ReportList';
import { ReportForm } from '@/components/manager/reports/ReportForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';
import { ShopContext } from '@/contexts/ShopContext';

export default function ReportsPage() {
  const { shopId: urlShopId } = useParams<{ shopId: string }>();
  const { currentShop, loading } = useContext(ShopContext)!;
  const shopId = urlShopId || currentShop?.id;
  const [showForm, setShowForm] = useState(false);

  console.log('URL Shop ID:', urlShopId);
  console.log('Current shop:', currentShop);
  console.log('Shop ID:', shopId);
  console.log('Shop context loading:', loading);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', shopId],
    queryFn: () => {
      if (!shopId) {
        console.error('No shopId provided');
        throw new Error('No shopId provided');
      }
      return getReports(shopId);
    },
    enabled: !!shopId,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="p-4 text-red-500">Ошибка: ID магазина не указан</div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Отчеты</h1>
        <Button
          type="primary"
          icon={<TagIcon className="h-5 w-5" />}
          onClick={() => setShowForm(true)}
          className="bg-blue-500"
        >
          Создать отчет
        </Button>
      </div>

      {reports && <ReportList reports={reports} />}

      {showForm && <ReportForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
