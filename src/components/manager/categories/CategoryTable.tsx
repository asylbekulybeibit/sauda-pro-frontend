import React, { useState, useMemo } from 'react';
import {
  Button,
  Space,
  Popconfirm,
  Tag,
  Typography,
  Pagination,
  Modal,
  message,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategory } from '@/services/managerApi';
import { Category } from '@/types/category';
import { useShopContext } from '@/contexts/ShopContext';

const { Text } = Typography;
const { confirm } = Modal;

interface CategoryTableProps {
  categories: Category[];
  isLoading?: boolean;
  onSuccess: () => void;
  onEdit: (category: Category) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  isLoading,
  onSuccess,
  onEdit,
}) => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string | null>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const shopContext = useShopContext();
  const shopId = shopContext?.currentShop?.id;

  // Мутация для удаления категории
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id, shopId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', shopId] });
    },
  });

  // Обработчик удаления категории с модальным окном в центре
  const showDeleteConfirm = (id: string, name: string) => {
    confirm({
      title: 'Удалить категорию?',
      icon: <ExclamationCircleOutlined />,
      content: `Вы уверены, что хотите удалить категорию "${name}"?`,
      okText: 'Да',
      okType: 'primary',
      okButtonProps: {
        className: 'bg-blue-500 hover:bg-blue-600 text-white',
        type: 'primary',
      },
      cancelText: 'Нет',
      centered: true,
      onOk() {
        deleteMutation.mutateAsync(id);
      },
    });
  };

  // Функция сортировки
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Получаем отсортированные данные
  const sortedData = useMemo(() => {
    // Применяем сортировку
    if (sortField) {
      return [...categories].sort((a: any, b: any) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (sortField === 'parentCategory') {
          aValue = a.parentId
            ? categories.find((c) => c.id === a.parentId)?.name || ''
            : '';
          bValue = b.parentId
            ? categories.find((c) => c.id === b.parentId)?.name || ''
            : '';
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortOrder === 'asc'
          ? aValue > bValue
            ? 1
            : -1
          : aValue < bValue
          ? 1
          : -1;
      });
    }

    return categories;
  }, [categories, sortField, sortOrder]);

  // Данные для текущей страницы
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Отображение названия родительской категории
  const getParentName = (parentId: string | undefined) => {
    if (!parentId) return <Text type="secondary">Нет</Text>;

    const parent = categories.find((c) => c.id === parentId);
    if (!parent) return <Text type="secondary">Не найдена</Text>;

    return <Tag color="blue">{parent.name}</Tag>;
  };

  // Обработчик изменения страницы
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Обработчик изменения размера страницы
  const handlePageSizeChange = (current: number, size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении размера
  };

  // Иконка сортировки
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <SortAscendingOutlined />
    ) : (
      <SortDescendingOutlined />
    );
  };

  const handleDelete = async (id: string) => {
    if (!shopId) return;
    try {
      await deleteCategory(shopId, id);
      message.success('Категория успешно удалена');
      onSuccess();
    } catch (error) {
      message.error('Ошибка при удалении категории');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Родительская категория',
      dataIndex: 'parentId',
      key: 'parentId',
      render: (parentId: string | undefined) => getParentName(parentId),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Category) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record.id, record.name)}
            className="text-red-500 hover:text-red-700"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="custom-table">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Название {renderSortIcon('name')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('description')}
              >
                Описание {renderSortIcon('description')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('parentCategory')}
              >
                Родительская категория {renderSortIcon('parentCategory')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.name}
                  </td>
                  <td className="px-6 py-4">
                    {category.description || (
                      <Text type="secondary">Нет описания</Text>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getParentName(category.parentId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(category)}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          showDeleteConfirm(category.id, category.name)
                        }
                      />
                    </Space>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Категории не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end items-center">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={sortedData.length}
          onChange={handlePageChange}
          onShowSizeChange={handlePageSizeChange}
          showSizeChanger
          pageSizeOptions={['10', '20', '50']}
        />
      </div>
    </div>
  );
};

export default CategoryTable;
