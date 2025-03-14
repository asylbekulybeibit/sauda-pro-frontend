import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/managerApi';
import { CategoryTree } from '@/components/manager/products/CategoryTree';
import { CategoryForm } from '@/components/manager/products/CategoryForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';

function CategoryPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: () => getCategories(shopId!),
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
        <h1 className="text-2xl font-semibold">Категории</h1>
        <Button
          type="primary"
          icon={<TagIcon className="h-5 w-5" />}
          onClick={() => setShowForm(true)}
        >
          Создать категорию
        </Button>
      </div>

      {categories && <CategoryTree categories={categories} shopId={shopId!} />}

      {showForm && (
        <CategoryForm
          categories={categories || []}
          shopId={shopId!}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default CategoryPage;
