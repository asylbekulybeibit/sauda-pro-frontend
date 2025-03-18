import { useState } from 'react';
import { Promotion, PromotionType, PromotionTarget } from '@/types/promotion';
import { PromotionForm } from './PromotionForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePromotion } from '@/services/managerApi';
import { Table, Tag, Button, Space, Tooltip, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { formatDate } from '@/utils/format';
import type { ColumnsType } from 'antd/es/table';

interface PromotionListProps {
  promotions: Promotion[];
}

export function PromotionList({ promotions }: PromotionListProps) {
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );
  const [viewingPromotion, setViewingPromotion] = useState<Promotion | null>(
    null
  );
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      message.success('Акция успешно удалена');
    },
    onError: () => {
      message.error('Ошибка при удалении акции');
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Подтверждение удаления',
      content: 'Вы уверены, что хотите удалить эту акцию?',
      okText: 'Да, удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        await deleteMutation.mutateAsync(id.toString());
      },
    });
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (now < startDate) {
      return { text: 'Ожидает', color: 'warning' };
    } else if (now > endDate) {
      return { text: 'Завершена', color: 'error' };
    } else {
      return { text: 'Активна', color: 'success' };
    }
  };

  const getPromotionTypeText = (type: PromotionType) => {
    switch (type) {
      case PromotionType.PERCENTAGE:
        return 'Процент';
      case PromotionType.FIXED:
        return 'Фиксированная сумма';
      case PromotionType.SPECIAL_PRICE:
        return 'Специальная цена';
      default:
        return type;
    }
  };

  const getPromotionTargetText = (target: PromotionTarget) => {
    switch (target) {
      case PromotionTarget.PRODUCT:
        return 'Товар';
      case PromotionTarget.CATEGORY:
        return 'Категория';
      case PromotionTarget.CART:
        return 'Корзина';
      default:
        return target;
    }
  };

  const renderPromotionValue = (promotion: Promotion) => {
    if (promotion.type === PromotionType.PERCENTAGE) {
      return `${promotion.value}%`;
    } else {
      return `${promotion.value} ₸`;
    }
  };

  const renderProductsPreview = (products: any[]) => {
    if (!products || products.length === 0) return '—';

    const displayCount = 2;
    const displayProducts = products.slice(0, displayCount);
    const remaining = products.length - displayCount;

    return (
      <>
        {displayProducts.map((product) => product.name).join(', ')}
        {remaining > 0 && ` и еще ${remaining}`}
      </>
    );
  };

  const viewPromotionDetails = (promotion: Promotion) => {
    setViewingPromotion(promotion);
  };

  const columns: ColumnsType<Promotion> = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Тип',
      key: 'type',
      render: (_, record) => getPromotionTypeText(record.type),
      filters: Object.values(PromotionType).map((type) => ({
        text: getPromotionTypeText(type),
        value: type,
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Значение',
      key: 'value',
      render: (_, record) => renderPromotionValue(record),
      sorter: (a, b) => a.value - b.value,
    },
    {
      title: 'Применяется к',
      key: 'target',
      render: (_, record) => getPromotionTargetText(record.target),
      filters: Object.values(PromotionTarget).map((target) => ({
        text: getPromotionTargetText(target),
        value: target,
      })),
      onFilter: (value, record) => record.target === value,
    },
    {
      title: 'Период',
      key: 'period',
      render: (_, record) => (
        <span>
          {formatDate(record.startDate)} — {formatDate(record.endDate)}
        </span>
      ),
      sorter: (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    },
    {
      title: 'Товары',
      key: 'products',
      render: (_, record) => renderProductsPreview(record.products),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => {
        const status = getPromotionStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
      filters: [
        { text: 'Активна', value: 'Активна' },
        { text: 'Ожидает', value: 'Ожидает' },
        { text: 'Завершена', value: 'Завершена' },
      ],
      onFilter: (value, record) => getPromotionStatus(record).text === value,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Просмотреть">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => viewPromotionDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => setEditingPromotion(record)}
            />
          </Tooltip>
          <Tooltip title="Удалить">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={promotions.map((p) => ({ ...p, key: p.id }))}
        pagination={{ pageSize: 10 }}
        className="bg-white rounded-lg shadow"
        rowClassName="hover:bg-gray-50"
      />

      {editingPromotion && (
        <PromotionForm
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(null)}
        />
      )}

      {viewingPromotion && (
        <Modal
          title="Информация об акции"
          open={!!viewingPromotion}
          onCancel={() => setViewingPromotion(null)}
          footer={[
            <Button key="close" onClick={() => setViewingPromotion(null)}>
              Закрыть
            </Button>,
          ]}
          width={700}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm text-gray-500">Название</h4>
              <p className="text-lg font-medium">{viewingPromotion.name}</p>
            </div>

            {viewingPromotion.description && (
              <div>
                <h4 className="text-sm text-gray-500">Описание</h4>
                <p>{viewingPromotion.description}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm text-gray-500">Тип скидки</h4>
                <p className="text-lg font-medium">
                  {getPromotionTypeText(viewingPromotion.type)}
                </p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Значение</h4>
                <p className="text-lg font-medium">
                  {renderPromotionValue(viewingPromotion)}
                </p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Применяется к</h4>
                <p className="text-lg font-medium">
                  {getPromotionTargetText(viewingPromotion.target)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm text-gray-500">Статус</h4>
                <Tag
                  color={getPromotionStatus(viewingPromotion).color}
                  className="mt-1"
                >
                  {getPromotionStatus(viewingPromotion).text}
                </Tag>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Дата начала</h4>
                <p>{formatDate(viewingPromotion.startDate)}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Дата окончания</h4>
                <p>{formatDate(viewingPromotion.endDate)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm text-gray-500">
                Товары ({viewingPromotion.products?.length || 0})
              </h4>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2">
                {viewingPromotion.products?.length > 0 ? (
                  <ul className="space-y-1">
                    {viewingPromotion.products.map((product) => (
                      <li key={product.id} className="text-sm">
                        {product.name}{' '}
                        {product.sku && (
                          <span className="text-gray-500">({product.sku})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">Нет товаров</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
