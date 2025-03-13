import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getInventory } from '@/services/managerApi';
import { InventoryList } from '@/components/manager/inventory/InventoryList';
import { InventoryForm } from '@/components/manager/inventory/InventoryForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/outline';
import { useState } from 'react';

function InventoryPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['inventory-transactions', shopId],
    queryFn: () => getInventory(shopId!),
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
        <h1 className="text-2xl font-semibold">Инвентаризация</h1>
        <Button
          type="primary"
          icon={<TagIcon className="h-5 w-5" />}
          onClick={() => setShowForm(true)}
        >
          Добавить транзакцию
        </Button>
      </div>

      {transactions && <InventoryList transactions={transactions} />}

      {showForm && <InventoryForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default InventoryPage;
