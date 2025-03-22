import React, { useContext, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Alert, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import PurchaseForm from '../../../components/manager/warehouse/PurchaseForm';
import { ShopContext } from '@/contexts/ShopContext';
import { getPurchaseById } from '@/services/managerApi';

const PurchaseFormPage: React.FC = () => {
  // Получаем параметры из URL, включая shopId из пути
  const { id, shopId: shopIdFromPath } = useParams<{
    id: string;
    shopId: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const shopContext = useContext(ShopContext);

  // Для обратной совместимости также получаем shopId из URL query параметра
  const searchParams = new URLSearchParams(location.search);
  const shopIdFromQuery = searchParams.get('shopId');

  console.log('PurchaseFormPage rendered with ID param:', id);
  console.log('PurchaseFormPage shopId sources:', {
    fromPath: shopIdFromPath,
    fromQuery: shopIdFromQuery,
    fromContext: shopContext?.currentShop?.id,
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
    queryKey: ['purchase', id, shopId],
    queryFn: () => getPurchaseById(id!, shopId),
    enabled: !!id && !!shopId,
  });

  // Если загружаем существующий приход
  if (id) {
    // Показываем индикатор загрузки
    if (isLoading) {
      return (
        <Card className="max-w-6xl mx-auto p-6">
          <div className="text-center py-8">
            <Spin tip="Загрузка данных прихода..." />
          </div>
        </Card>
      );
    }

    // Обрабатываем ошибку
    if (error) {
      return (
        <Card className="max-w-6xl mx-auto p-6">
          <Alert
            message="Ошибка загрузки"
            description="Не удалось загрузить данные прихода. Пожалуйста, попробуйте позже."
            type="error"
            showIcon
          />
        </Card>
      );
    }

    // Проверяем статус прихода
    if (purchase && purchase.status === 'completed') {
      return (
        <Card className="max-w-6xl mx-auto p-6">
          <Alert
            message="Редактирование невозможно"
            description="Этот приход уже завершен и не может быть отредактирован."
            type="warning"
            showIcon
            action={
              <a
                onClick={() => {
                  if (shopId) {
                    navigate(`/manager/${shopId}/warehouse/purchases/${id}`);
                  } else {
                    navigate(`/manager/warehouse/purchases/${id}`);
                  }
                }}
              >
                Вернуться к деталям прихода
              </a>
            }
          />
        </Card>
      );
    }
  }

  return <PurchaseForm id={id} shopId={shopId} />;
};

export default PurchaseFormPage;
