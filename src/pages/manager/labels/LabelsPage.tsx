import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getLabelTemplates, getProducts } from '@/services/managerApi';
import { LabelTemplateList } from '@/components/manager/labels/LabelTemplateList';
import { LabelTemplateForm } from '@/components/manager/labels/LabelTemplateForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/outline';

function LabelsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['label-templates', shopId],
    queryFn: () => getLabelTemplates(shopId!),
    enabled: !!shopId,
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  if (isLoadingTemplates || isLoadingProducts) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Шаблоны этикеток</h1>
        <Button
          type="primary"
          icon={<TagIcon className="h-5 w-5" />}
          onClick={() => setShowForm(true)}
        >
          Создать шаблон
        </Button>
      </div>

      {templates && products && (
        <LabelTemplateList templates={templates} products={products} />
      )}

      {showForm && <LabelTemplateForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default LabelsPage;
