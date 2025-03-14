import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getReports } from '@/services/managerApi';
import { ReportList } from '@/components/manager/reports/ReportList';
import { ReportForm } from '@/components/manager/reports/ReportForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';

export function ReportsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', shopId],
    queryFn: () => getReports(shopId!),
    enabled: !!shopId,
  });

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
        >
          Создать отчет
        </Button>
      </div>

      {reports && <ReportList reports={reports} />}

      {showForm && <ReportForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
