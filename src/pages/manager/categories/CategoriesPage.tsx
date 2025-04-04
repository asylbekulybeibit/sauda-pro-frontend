import React, { useState, useContext } from 'react';
import {
  Card,
  Button,
  Spin,
  message,
  Row,
  Col,
  Input,
  Empty,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/managerApi';
import { CategoryTable } from '@/components/manager/categories/CategoryTable';
import { CategoryForm } from '@/components/manager/categories/CategoryForm';
import { Category } from '@/types/category';
import { ShopContext } from '@/contexts/ShopContext';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

const CategoriesPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const shopContext = useContext(ShopContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(undefined);
  const [searchText, setSearchText] = useState('');

  // Загрузка категорий
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useQuery<Category[]>({
    queryKey: ['categories', shopId],
    queryFn: () => getCategories(shopId!),
    enabled: Boolean(shopId && !shopContext?.loading),
  });

  // Фильтрация категорий по поисковому запросу
  const filteredCategories =
    categories?.filter((category) =>
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

  if (shopContext?.loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <p>Загрузка данных магазина...</p>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Магазин не выбран</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <Title level={2}>Категории</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateCategory}
              className="!bg-blue-500 !text-white hover:!bg-blue-600"
            >
              Создать категорию
            </Button>
          </div>
        </Col>
        <Col span={24}>
          <CategoryTable
            categories={filteredCategories}
            isLoading={isCategoriesLoading}
            onSuccess={refetchCategories}
            onEdit={handleEditCategory}
          />
        </Col>
      </Row>

      <CategoryForm
        visible={isModalVisible}
        onClose={handleCloseModal}
        category={selectedCategory}
        categories={categories || []}
        shopId={shopId}
      />
    </div>
  );
};

export default CategoriesPage;
