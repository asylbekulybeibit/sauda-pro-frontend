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
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getBarcodes } from '@/services/managerApi';
import { BarcodeTable } from '@/components/manager/barcodes/BarcodeTable';
import { BarcodeForm } from '@/components/manager/barcodes/BarcodeForm';
import { ShopContext } from '@/contexts/ShopContext';

const BarcodesPage: React.FC = () => {
  const shopContext = useContext(ShopContext);
  const shopId = shopContext?.currentShop?.id;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState<any | undefined>(
    undefined
  );
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('products'); // 'products' или 'services'

  // Загрузка штрихкодов
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['barcodes', shopId, activeTab],
    queryFn: () => getBarcodes(shopId!, activeTab === 'services'),
    enabled: !!shopId,
  });

  // Фильтрация штрихкодов по поисковому запросу
  const filteredBarcodes =
    data?.filter((barcode) =>
      searchText
        ? barcode.productName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          barcode.code.toLowerCase().includes(searchText.toLowerCase()) ||
          (barcode.description
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ??
            false)
        : true
    ) || [];

  // Обработчик открытия модального окна для создания штрихкода
  const handleCreateBarcode = () => {
    setSelectedBarcode(undefined);
    setIsModalVisible(true);
  };

  // Обработчик открытия модального окна для редактирования штрихкода
  const handleEditBarcode = (barcode: any) => {
    setSelectedBarcode(barcode);
    setIsModalVisible(true);
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedBarcode(undefined);
  };

  // Обработчик поиска
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  if (!shopId || !shopContext?.currentShop) {
    return <div>Магазин не выбран</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    message.error('Ошибка при загрузке штрихкодов');
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div>Ошибка при загрузке штрихкодов</div>
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
        <h1 className="text-2xl font-semibold">Штрихкоды</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateBarcode}
          className="!bg-blue-500 !text-white hover:!bg-blue-600"
        >
          Создать штрихкод
        </Button>
      </div>

      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="mb-4"
          items={[
            {
              key: 'products',
              label: 'Товары',
            },
            {
              key: 'services',
              label: 'Услуги',
            },
          ]}
        />

        <Row gutter={16} className="mb-4">
          <Col span={12}>
            <Input
              placeholder="Поиск по названию или штрихкоду"
              value={searchText}
              onChange={handleSearch}
              allowClear
              prefix={<SearchOutlined className="text-gray-400" />}
            />
          </Col>
          <Col span={12} className="flex justify-end">
            <span className="text-gray-500 mr-2">
              Всего штрихкодов: {data?.length || 0}
            </span>
            {searchText && (
              <span className="text-gray-500">
                Найдено: {filteredBarcodes.length}
              </span>
            )}
          </Col>
        </Row>

        {filteredBarcodes.length === 0 ? (
          <Empty
            description={
              searchText
                ? 'Штрихкоды по вашему запросу не найдены'
                : 'Штрихкоды отсутствуют'
            }
          />
        ) : (
          <BarcodeTable
            barcodes={filteredBarcodes}
            shopId={shopId}
            onEdit={handleEditBarcode}
          />
        )}
      </Card>

      <BarcodeForm
        visible={isModalVisible}
        onClose={handleCloseModal}
        barcode={selectedBarcode}
        shopId={shopId}
        defaultIsService={activeTab === 'services'}
      />
    </div>
  );
};

export default BarcodesPage;
