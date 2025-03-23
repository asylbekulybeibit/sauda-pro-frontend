import { useParams } from 'react-router-dom';
import { ServiceTypeList } from '@/components/manager/services/ServiceTypeList';

function ServiceTypesPage() {
  const { shopId } = useParams<{ shopId: string }>();

  if (!shopId) {
    return (
      <div className="text-center text-red-600">
        Не указан идентификатор магазина
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Типы услуг</h1>
      </div>

      <ServiceTypeList shopId={shopId} />
    </div>
  );
}

export default ServiceTypesPage;
