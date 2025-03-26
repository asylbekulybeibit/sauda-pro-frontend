import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Tooltip,
  Typography,
  Modal,
  Form,
  message,
  Spin,
} from 'antd';
import {
  PrinterOutlined,
  QrcodeOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  getProducts,
  getLabelTemplates,
  updateProductBarcode,
  generateBarcode,
  generateLabels,
} from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import { Product } from '@/types/product';

interface LabelTemplate {
  id: string;
  name: string;
  type: string;
}

interface GenerateLabelsRequest {
  shopId: string;
  templateId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

// Интерфейс для Product, расширяющий базовый тип
interface ProductWithCategory extends Product {
  category?: {
    name: string;
  };
}

const { Title } = Typography;

const BarcodesPage = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<ProductWithCategory | null>(null);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    ProductWithCategory[]
  >([]);
  const [printQuantity, setPrintQuantity] = useState<Record<string, number>>(
    {}
  );
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Загрузка товаров
  const { data: products, isLoading: isLoadingProducts } = useQuery<
    ProductWithCategory[]
  >({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  // Загрузка шаблонов этикеток
  const { data: labelTemplates, isLoading: isLoadingTemplates } = useQuery<
    LabelTemplate[]
  >({
    queryKey: ['label-templates', shopId],
    queryFn: () => getLabelTemplates(shopId!),
    enabled: !!shopId,
  });

  // Фильтрация товаров по поисковому запросу
  const filteredProducts =
    searchText.length > 0 && products
      ? products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchText.toLowerCase()) ||
            (product.barcode &&
              product.barcode.toLowerCase().includes(searchText.toLowerCase()))
        )
      : products;

  // Обработчик открытия модального окна для редактирования штрих-кода
  const handleEdit = (record: ProductWithCategory) => {
    setSelectedRecord(record);
    form.setFieldsValue({
      barcode: record.barcode || '',
    });
    setIsModalVisible(true);
  };

  // Обработчик открытия модального окна для печати этикеток
  const handlePrint = (selectedRows: ProductWithCategory[] = []) => {
    setSelectedProducts(selectedRows);

    // Инициализация количества этикеток для каждого товара
    const initialQuantities: Record<string, number> = {};
    selectedRows.forEach((product) => {
      initialQuantities[product.id] = 1;
    });
    setPrintQuantity(initialQuantities);

    setIsPrintModalVisible(true);
  };

  // Обработчик генерации штрих-кода
  const handleGenerateBarcode = () => {
    const newBarcode = generateBarcode();
    message.success('Штрих-код сгенерирован');
    form.setFieldsValue({
      barcode: newBarcode,
    });
  };

  // Обработчик сохранения штрих-кода
  const handleSaveBarcode = () => {
    form
      .validateFields()
      .then((values) => {
        if (!selectedRecord) return;

        // Вызов API для обновления штрих-кода
        updateProductBarcode(selectedRecord.id, values.barcode)
          .then(() => {
            message.success(
              `Штрих-код ${values.barcode} сохранен для товара ${selectedRecord.name}`
            );
            setIsModalVisible(false);
            form.resetFields();

            // Обновляем кэш запроса
            queryClient.invalidateQueries({ queryKey: ['products', shopId] });
          })
          .catch((error) => {
            console.error('Ошибка при обновлении штрих-кода:', error);
            message.error(`Ошибка при сохранении штрих-кода: ${error.message}`);
          });
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  // Обработчик печати этикеток
  const handlePrintLabels = (selectedTemplate: LabelTemplate) => {
    const productsToPrint = Object.entries(printQuantity)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = selectedProducts.find((p) => p.id === productId);
        return { productId, quantity, name: product?.name };
      });

    if (productsToPrint.length === 0) {
      message.warning('Выберите хотя бы один товар для печати');
      return;
    }

    // Подготавливаем данные для запроса
    const printData: GenerateLabelsRequest = {
      shopId: shopId!,
      templateId: selectedTemplate.id,
      products: productsToPrint.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    // Отправляем запрос на генерацию этикеток
    generateLabels(printData)
      .then((blob) => {
        // Создаем ссылку на скачивание PDF
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `barcodes-${new Date().toISOString().split('T')[0]}.pdf`
        );
        document.body.appendChild(link);
        link.click();

        // Очищаем ссылку
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        message.success(
          `Отправлено на печать ${productsToPrint.reduce(
            (sum, p) => sum + p.quantity,
            0
          )} этикеток`
        );
        setIsPrintModalVisible(false);
      })
      .catch((error) => {
        console.error('Ошибка при печати этикеток:', error);
        message.error(`Ошибка при печати этикеток: ${error.message}`);
      });
  };

  // Колонки для таблицы
  const columns = [
    {
      title: 'Штрих-код',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (barcode: string | undefined) =>
        barcode || <span className="text-gray-400">Не указан</span>,
    },
    {
      title: 'Название товара',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ProductWithCategory) => (
        <div>
          <div className="font-medium">{text}</div>
        </div>
      ),
    },
    {
      title: 'Цена',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (_: any, record: ProductWithCategory) =>
        record.category?.name || 'Без категории',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: ProductWithCategory) => (
        <Space>
          <Tooltip title="Редактировать штрих-код">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              type="text"
            />
          </Tooltip>
          <Tooltip title="Печать этикетки">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handlePrint([record])}
              type="text"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (isLoadingProducts || isLoadingTemplates) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Штрих-коды</Title>
        <Space>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() =>
              filteredProducts ? handlePrint(filteredProducts) : undefined
            }
            disabled={!filteredProducts || filteredProducts.length === 0}
          >
            Печать выбранных
          </Button>
        </Space>
      </div>

      <Card className="mb-6">
        <div className="mb-4">
          <Input
            placeholder="Поиск по названию или штрих-коду"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
            className="max-w-md"
          />
        </div>

        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          rowClassName="cursor-pointer hover:bg-gray-50"
          rowSelection={{
            type: 'checkbox',
            onChange: (_, selectedRows) => {
              setSelectedProducts(selectedRows as ProductWithCategory[]);
            },
          }}
        />
      </Card>

      {/* Модальное окно для редактирования штрих-кода */}
      <Modal
        title="Редактировать штрих-код"
        open={isModalVisible}
        onOk={handleSaveBarcode}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="barcode"
            label="Штрих-код"
            rules={[
              { required: true, message: 'Пожалуйста, введите штрих-код' },
              {
                pattern: /^\d+$/,
                message: 'Штрих-код должен содержать только цифры',
              },
            ]}
          >
            <Input placeholder="Введите штрих-код товара" />
          </Form.Item>
          <div className="text-right">
            <Button
              type="link"
              icon={<QrcodeOutlined />}
              onClick={handleGenerateBarcode}
            >
              Сгенерировать
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Модальное окно для печати этикеток */}
      <Modal
        title="Печать этикеток"
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        footer={null}
        width={700}
      >
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-2">Выберите шаблон:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {labelTemplates?.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-3 hover:border-blue-500 cursor-pointer"
                onClick={() => handlePrintLabels(template)}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-gray-500">{template.type}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-700 mb-2">Выбранные товары:</h3>
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Товар
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Штрих-код
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Количество
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.barcode || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Input
                        type="number"
                        min={0}
                        value={printQuantity[product.id] || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setPrintQuantity({
                            ...printQuantity,
                            [product.id]: value,
                          });
                        }}
                        style={{ width: 80 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BarcodesPage;
