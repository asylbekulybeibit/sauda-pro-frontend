import { useParams } from 'react-router-dom';

function ClientVehiclesPage() {
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
        <h1 className="text-2xl font-semibold text-gray-900">
          Автомобили клиентов
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <p>Здесь будет отображаться список автомобилей клиентов</p>
      </div>
    </div>
  );
}

export default ClientVehiclesPage;
