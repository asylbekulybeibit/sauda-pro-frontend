import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getPromotions } from '@/services/managerApi';
import { PromotionList } from '@/components/manager/promotions/PromotionList';
import { PromotionForm } from '@/components/manager/promotions/PromotionForm';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/outline';
import { Spinner } from '@/components/ui/Spinner';

export function PromotionsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: promotions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['promotions', shopId],
    queryFn: () => getPromotions(shopId!),
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
        <h1 className="text-2xl font-semibold text-gray-900">Акции</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Создать акцию
        </Button>
      </div>

      <PromotionList promotions={promotions || []} />

      {isCreateModalOpen && (
        <PromotionForm onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
