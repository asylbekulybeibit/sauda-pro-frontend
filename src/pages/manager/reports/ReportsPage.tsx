import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getReports } from '@/services/managerApi';
import { ReportList } from '@/components/manager/reports/ReportList';
import { ReportForm } from '@/components/manager/reports/ReportForm';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/outline';
import { Spinner } from '@/components/ui/Spinner';

export function ReportsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: reports,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reports', shopId],
    queryFn: () => getReports(shopId!),
    enabled: !!shopId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Произошла ошибка при загрузке данных
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Отчеты</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Создать отчет
        </Button>
      </div>

      <ReportList reports={reports || []} />

      {isCreateModalOpen && (
        <ReportForm onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
