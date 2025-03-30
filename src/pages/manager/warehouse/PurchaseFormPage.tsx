import React, { useContext, useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Alert, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import PurchaseForm from '../../../components/manager/warehouse/PurchaseForm';
import { ShopContext } from '@/contexts/ShopContext';
import { getPurchaseById } from '@/services/managerApi';
import { useRoleStore } from '@/store/roleStore';

const PurchaseFormPage: React.FC = () => {
  // Получаем параметры из URL, включая shopId из пути
  const { id, shopId: shopIdFromPath } = useParams<{
    id: string;
    shopId: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const shopContext = useContext(ShopContext);
  const { currentRole } = useRoleStore();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  // Если контекст магазина загружается, показываем спиннер
  if (!shopContext || shopContext.loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
          <p className="ml-2 text-gray-500">Загрузка данных магазина...</p>
        </div>
      </div>
    );
  }

  // Получаем ID склада из текущей роли менеджера
  useEffect(() => {
    if (currentRole && currentRole.type === 'shop' && currentRole.warehouse) {
      console.log(
        '[PurchaseFormPage] Setting warehouseId from currentRole:',
        currentRole.warehouse.id
      );
      setWarehouseId(currentRole.warehouse.id);
    } else {
      console.log(
        '[PurchaseFormPage] No warehouse found in currentRole:',
        currentRole
      );
    }
  }, [currentRole]);

  // Для обратной совместимости также получаем shopId из URL query параметра
  const searchParams = new URLSearchParams(location.search);
  const shopIdFromQuery = searchParams.get('shopId');

  console.log('[PurchaseFormPage] Current state:', {
    id,
    shopIdFromPath,
    shopIdFromQuery,
    shopContextId: shopContext?.currentShop?.id,
    warehouseId,
    currentRole,
  });

  // Приоритет: 1) shopId из пути URL, 2) shopId из query параметра, 3) shopId из контекста
  const shopId =
    shopIdFromPath || shopIdFromQuery || shopContext?.currentShop?.id || '';

  // При открытии страницы создания нового прихода очищаем все черновики
  useEffect(() => {
    // Если это создание нового прихода
    if (!id && shopId) {
      console.log('Открыта страница создания нового прихода.');

      // Проверяем, был ли успешно создан предыдущий приход
      const hasJustSubmitted =
        sessionStorage.getItem('purchase_submitted') === 'true';
      if (hasJustSubmitted) {
        console.log(
          'Обнаружен флаг успешного создания прихода. Очищаем все черновики и сбрасываем флаг.'
        );
        sessionStorage.removeItem('purchase_submitted');

        try {
          const draftKeyPrefix = `purchase_draft_${shopId}_`;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(draftKeyPrefix)) {
              localStorage.removeItem(key);
              console.log(`Удален черновик: ${key}`);
              i--; // Корректируем индекс после удаления
            }
          }
        } catch (error) {
          console.error(
            'Ошибка при очистке черновиков после создания прихода:',
            error
          );
        }
      }

      // Проверяем, был ли прямой переход на страницу создания прихода
      // или это просто перезагрузка страницы
      const isDirectNavigation =
        sessionStorage.getItem('creating_new_purchase') !== 'true';

      if (isDirectNavigation) {
        console.log(
          'Обнаружен прямой переход на страницу создания прихода. Очищаем черновики.'
        );

        // Устанавливаем флаг, чтобы при перезагрузке страницы не очищать черновики
        sessionStorage.setItem('creating_new_purchase', 'true');

        try {
          const draftKeyPrefix = `purchase_draft_${shopId}_`;
          // Находим и удаляем все черновики для текущего магазина
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(draftKeyPrefix)) {
              keysToRemove.push(key);
            }
          }

          // Удаляем все найденные ключи
          keysToRemove.forEach((key) => {
            console.log('Очищаем сохраненный черновик прихода:', key);
            localStorage.removeItem(key);
          });

          console.log(
            `Очищено ${keysToRemove.length} черновиков для магазина ${shopId}`
          );
        } catch (error) {
          console.error('Ошибка при очистке предыдущих черновиков:', error);
        }
      } else {
        console.log(
          'Это перезагрузка страницы создания прихода. Черновики сохранены.'
        );
      }
    } else if (id) {
      // Если это редактирование существующего прихода, сбрасываем флаг создания нового прихода
      sessionStorage.removeItem('creating_new_purchase');
    }

    // Очистка флага при размонтировании компонента
    return () => {
      if (id) {
        // Если переходим на редактирование существующего прихода
        sessionStorage.removeItem('creating_new_purchase');
      } else if (!id && shopId) {
        // Если покидаем страницу создания прихода, проверяем, было ли сохранение
        const hasJustSubmitted =
          sessionStorage.getItem('purchase_submitted') === 'true';

        // Если не было успешного сохранения прихода, очищаем черновики
        if (!hasJustSubmitted) {
          console.log(
            'Покидаем страницу создания прихода без сохранения. Очищаем черновики.'
          );
          try {
            const draftKeyPrefix = `purchase_draft_${shopId}_`;
            // Находим и удаляем все черновики для текущего магазина
            let removedCount = 0;
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(draftKeyPrefix)) {
                localStorage.removeItem(key);
                removedCount++;
                // После удаления элемента индексы сдвигаются, поэтому уменьшаем i
                i--;
              }
            }
            console.log(
              `При размонтировании компонента удалено ${removedCount} ключей из localStorage`
            );
          } catch (error) {
            console.error(
              'Ошибка при очистке черновиков при размонтировании:',
              error
            );
          }
        }

        // В любом случае очищаем флаг создания нового прихода
        sessionStorage.removeItem('creating_new_purchase');
      }
    };
  }, [id, shopId]);

  // Проверка статуса прихода, если это режим редактирования
  const {
    data: purchase,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['purchase', id, warehouseId],
    queryFn: () => {
      if (!warehouseId) {
        throw new Error('warehouseId не определен');
      }
      return getPurchaseById(id!, warehouseId);
    },
    enabled: !!id && !!warehouseId,
  });

  // Если не загружен warehouseId, показываем индикатор загрузки
  if (!warehouseId) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
          <p className="ml-2 text-gray-500">Загрузка данных о складе...</p>
        </div>
      </div>
    );
  }

  // Если нет shopId, также показываем ошибку
  if (!shopId) {
    return (
      <div className="p-6">
        <Card>
          <Alert
            message="Ошибка"
            description="Не удалось определить магазин для работы с приходом товара"
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  // Если есть ошибка загрузки существующего прихода
  if (error && id) {
    return (
      <div className="p-6">
        <Card>
          <Alert
            message="Ошибка при загрузке прихода"
            description={`Не удалось загрузить данные прихода. ${
              error instanceof Error ? error.message : 'Неизвестная ошибка'
            }`}
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  // После успешной загрузки прихода в режиме редактирования проверяем его статус
  if (purchase && purchase.status === 'completed' && id) {
    return (
      <div className="p-6">
        <Card>
          <Alert
            message="Доступ запрещен"
            description="Этот приход уже завершен и не может быть отредактирован"
            type="warning"
            showIcon
            action={
              <div className="mt-4">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
                  onClick={() =>
                    navigate(`/manager/${shopId}/warehouse/purchases/${id}`)
                  }
                >
                  Просмотреть приход
                </button>
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
                  onClick={() =>
                    navigate(`/manager/${shopId}/warehouse/incoming`)
                  }
                >
                  К списку приходов
                </button>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PurchaseForm shopId={shopId} id={id} warehouseId={warehouseId} />
    </div>
  );
};

export default PurchaseFormPage;
