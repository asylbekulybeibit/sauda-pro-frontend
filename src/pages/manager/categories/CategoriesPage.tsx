import React, { useState } from 'react';
import { Card, Button, Spin, message, Row, Col, Input, Empty } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/managerApi';
import { CategoryTable } from '@/components/manager/categories/CategoryTable';
import { CategoryForm } from '@/components/manager/categories/CategoryForm';
import { Category } from '@/types/category';

const CategoriesPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(undefined);
  const [searchText, setSearchText] = useState('');

  // Загрузка категорий
  const { data, isLoading, isError, refetch } = useQuery<Category[]>({
    queryKey: ['categories', shopId],
    queryFn: () => getCategories(shopId!),
    enabled: !!shopId,
  });

  // Фильтрация категорий по поисковому запросу
  const filteredCategories =
    data?.filter((category) =>
      searchText
        ? category.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (category.description
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ??
            false)
        : true
    ) || [];

  // Обработчик открытия модального окна для создания категории
  const handleCreateCategory = () => {
    setSelectedCategory(undefined);
    setIsModalVisible(true);
  };

  // Обработчик открытия модального окна для редактирования категории
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsModalVisible(true);
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  // Обработчик поиска
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Обработчик сброса поиска
  const handleReset = () => {
    setSearchText('');
  };

  if (!shopId) {
    return <div>Идентификатор магазина не найден</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    message.error('Ошибка при загрузке категорий');
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div>Ошибка при загрузке категорий</div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
        >
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Категории</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateCategory}
          className="!bg-blue-500 !text-white hover:!bg-blue-600"
        >
          Создать категорию
        </Button>
      </div>

      <Card className="shadow-sm">
        <Row gutter={16} className="mb-4">
          <Col span={12}>
            <Input
              placeholder="Поиск категорий"
              value={searchText}
              onChange={handleSearch}
              allowClear
              prefix={<SearchOutlined className="text-gray-400" />}
            />
          </Col>
          <Col span={12} className="flex justify-end">
            <span className="text-gray-500 mr-2">
              Всего категорий: {data?.length || 0}
            </span>
            {searchText && (
              <span className="text-gray-500">
                Найдено: {filteredCategories.length}
              </span>
            )}
          </Col>
        </Row>

        {filteredCategories.length === 0 ? (
          <Empty
            description={
              searchText
                ? 'Категории по вашему запросу не найдены'
                : 'Категории отсутствуют'
            }
          />
        ) : (
          <CategoryTable
            categories={filteredCategories}
            shopId={shopId}
            onEdit={handleEditCategory}
          />
        )}
      </Card>

      <CategoryForm
        visible={isModalVisible}
        onClose={handleCloseModal}
        category={selectedCategory}
        categories={data || []}
        shopId={shopId}
      />
    </div>
  );
};

export default CategoriesPage;
