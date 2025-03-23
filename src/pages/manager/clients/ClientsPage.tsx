import { useParams } from 'react-router-dom';
import { ClientsList } from '@/components/manager/clients/ClientsList';

function ClientsPage() {
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
        <h1 className="text-2xl font-semibold text-gray-900">Клиенты</h1>
      </div>

      <ClientsList shopId={shopId} />
    </div>
  );
}

export default ClientsPage;
