import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPromotions } from '@/services/managerApi';
import { PromotionList } from '@/components/manager/promotions/PromotionList';
import { PromotionForm } from '@/components/manager/promotions/PromotionForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';

function PromotionsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', shopId],
    queryFn: () => getPromotions(shopId!),
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
        <h1 className="text-2xl font-semibold">Акции</h1>
        <Button
          type="primary"
          icon={<TagIcon className="h-5 w-5" />}
          onClick={() => setShowForm(true)}
          className="bg-blue-500"
          
        >
          Создать акцию
        </Button>
      </div>

      {promotions && <PromotionList promotions={promotions} />}

      {showForm && <PromotionForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default PromotionsPage;
