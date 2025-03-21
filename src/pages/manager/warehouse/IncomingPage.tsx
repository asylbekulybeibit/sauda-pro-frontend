import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Table,
  Tag,
  Spin,
  message,
  Input,
  Select,
  DatePicker,
  Card,
  Space,
  Dropdown,
  Modal,
  Row,
  Col,
  Segmented,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import {
  getPurchases,
  deletePurchase,
  getPurchaseById,
  completePurchaseDraft,
  getShopPurchases,
  getPurchaseStatuses,
  getSuppliers,
  updatePurchaseStatus,
} from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import { formatDate, formatDateTime } from '@/utils/date';
import {
  PlusOutlined,
  DownloadOutlined,
  FilterOutlined,
  EllipsisOutlined,
  PrinterOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import PurchaseForm from '../../../components/manager/warehouse/PurchaseForm';
import PurchaseDetails from '@/components/manager/warehouse/PurchaseDetails';
import dayjs from 'dayjs';
import type { Purchase } from '@/types/purchase';
import * as XLSX from 'xlsx';
import { Supplier } from '../../../types/supplier';

const { RangePicker } = DatePicker;

function IncomingPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Purchase | null>(null);
  const formRef = useRef<{ handleClose: () => Promise<void> } | null>(null);

  // Функция для проверки, что строка является корректным UUID
  const isValidUUID = (str: string) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const {
    data: purchases = [],
    isLoading,
    refetch,
  } = useQuery<Purchase[]>({
    queryKey: ['purchases', shopId],
    queryFn: async () => {
      console.log('Fetching purchases for shopId:', shopId);
      try {
        if (!shopId || !isValidUUID(shopId)) {
          console.error('Invalid shopId:', shopId);
          return [];
        }

        const response = await getPurchases(shopId);
        console.log('API Response:', response);
        console.log('API Response type:', typeof response);
        console.log('API Response is array:', Array.isArray(response));
        if (Array.isArray(response)) {
          console.log('API Response length:', response.length);
          if (response.length > 0) {
            console.log('First item:', response[0]);
          }
        }
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching purchases:', error);
        return [];
      }
    },
    enabled: !!shopId && isValidUUID(shopId),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    console.log('Purchases state:', purchases);
    console.log('Purchases state type:', typeof purchases);
    console.log('Purchases state is array:', Array.isArray(purchases));
    if (Array.isArray(purchases)) {
      console.log('Purchases state length:', purchases.length);
    }
  }, [purchases]);

  const suppliers = useMemo(() => {
    if (!purchases || !Array.isArray(purchases)) return [];

    const uniqueSuppliers = new Set(
      purchases.map((p: Purchase) => p.supplier.name)
    );
    return Array.from(uniqueSuppliers).map((name) => ({
      label: name,
      value: name,
    }));
  }, [purchases]);

  const handleExportToExcel = () => {
    const exportData = filteredPurchases.map((purchase: Purchase) => ({
      'Номер накладной': purchase.invoiceNumber,
      Дата: formatDateTime(purchase.date),
      Поставщик: purchase.supplier.name,
      'Адрес поставщика': purchase.supplier.address || '-',
      'Телефон поставщика': purchase.supplier.phone || '-',
      Статус: getStatusName(purchase.status),
      Сумма: purchase.totalAmount,
      'Количество товаров':
        typeof purchase.totalItems === 'number'
          ? purchase.totalItems
          : Array.isArray(purchase.items)
          ? purchase.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0,
      Комментарий: purchase.comment || '-',
    }));

    const detailedData = filteredPurchases.flatMap((purchase: Purchase) =>
      Array.isArray(purchase.items)
        ? purchase.items.map((item) => ({
            'Номер накладной': purchase.invoiceNumber,
            Дата: formatDateTime(purchase.date),
            Поставщик: purchase.supplier.name,
            'Название товара': item.product?.name || 'Неизвестный товар',
            Артикул: item.product?.sku || '-',
            Количество: item.quantity || 0,
            Цена: item.price || 0,
            Сумма: item.total || 0,
            'Серийный номер': item.serialNumber || '-',
            'Срок годности': item.expiryDate
              ? formatDate(item.expiryDate)
              : '-',
            'Комментарий к товару': item.comment || '-',
            'Общий комментарий': purchase.comment || '-',
          }))
        : []
    );

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Приходы');
    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Детали приходов');

    const now = new Date();
    const formattedDate = now.toLocaleDateString('ru-RU').replace(/\./g, '-');
    XLSX.writeFile(wb, `Приходы_${formattedDate}.xlsx`);
  };

  const getStatusName = (status: string) => {
    const statusNames = {
      draft: 'Черновик',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      draft: 'gold',
      completed: 'green',
      cancelled: 'red',
    };
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  const handleDeletePurchase = (id: string) => {
    // Проверяем shopId перед удалением прихода
    if (!shopId) {
      message.error('ID магазина не указан');
      return;
    }

    if (!isValidUUID(shopId)) {
      message.error('ID магазина должен быть в формате UUID');
      return;
    }

    Modal.confirm({
      title: 'Подтверждение удаления',
      content: 'Вы действительно хотите удалить этот приход?',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: () => {
        deletePurchase(shopId, id)
          .then(() => {
            message.success('Приход успешно удален');
            refetch();
          })
          .catch((error) => {
            console.error('Error deleting purchase:', error);
            message.error('Произошла ошибка при удалении прихода');
          });
      },
    });
  };

  const handleViewPurchase = async (purchase: Purchase) => {
    try {
      // Проверяем shopId перед загрузкой деталей прихода
      if (!shopId) {
        message.error('ID магазина не указан');
        return;
      }

      if (!isValidUUID(shopId)) {
        message.error('ID магазина должен быть в формате UUID');
        return;
      }

      const detailedPurchase = await getPurchaseById(
        purchase.id.toString(),
        shopId
      );
      setSelectedPurchase(detailedPurchase);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading purchase details:', error);
      message.error('Не удалось загрузить детали прихода');
    }
  };

  const handleEditDraft = async (purchase: Purchase) => {
    try {
      // Проверяем shopId перед загрузкой черновика
      if (!shopId) {
        message.error('ID магазина не указан');
        return;
      }

      if (!isValidUUID(shopId)) {
        message.error('ID магазина должен быть в формате UUID');
        return;
      }

      console.log('Редактирование черновика ID:', purchase.id);
      const detailedPurchase = await getPurchaseById(
        purchase.id.toString(),
        shopId
      );

      console.log('Получены данные черновика:', detailedPurchase);
      console.log('Товары в черновике:', detailedPurchase.items);

      // Проверяем, есть ли товары в черновике
      if (!detailedPurchase.items || detailedPurchase.items.length === 0) {
        message.warning('В черновике нет товаров или они не были загружены');
      }

      const formData = {
        id: purchase.id,
        supplierId: detailedPurchase.supplier.id,
        invoiceNumber: detailedPurchase.invoiceNumber,
        date: dayjs(detailedPurchase.date),
        comment: detailedPurchase.comment,
        items: detailedPurchase.items
          ? detailedPurchase.items.map((item) => ({
              id: crypto.randomUUID(),
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              partialQuantity: item.partialQuantity,
              serialNumber: item.serialNumber,
              expiryDate: item.expiryDate,
              needsLabels: false,
              comment: item.comment,
              // Добавляем дополнительные поля, которые могут понадобиться
              barcode: item.product?.barcode,
              name: item.product?.name,
              sku: item.product?.sku,
              unit: item.product?.unit || 'шт',
            }))
          : [],
      };

      console.log('Подготовленные данные формы:', formData);
      setEditingDraft(detailedPurchase);
      setSelectedPurchase(formData as any);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading draft for editing:', error);
      message.error('Не удалось загрузить данные черновика');
    }
  };

  const handleCompleteDraft = (purchase: Purchase) => {
    // Проверяем shopId перед завершением черновика
    if (!shopId) {
      message.error('ID магазина не указан');
      return;
    }

    if (!isValidUUID(shopId)) {
      message.error('ID магазина должен быть в формате UUID');
      return;
    }

    Modal.confirm({
      title: 'Завершение черновика',
      content:
        'Вы действительно хотите завершить этот черновик и создать приход?',
      okText: 'Завершить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await completePurchaseDraft(shopId, purchase.id.toString());
          message.success('Черновик успешно завершен, приход создан');
          refetch();
        } catch (error) {
          console.error('Error completing draft:', error);
          message.error('Произошла ошибка при завершении черновика');
        }
      },
    });
  };

  const columns: ColumnsType<Purchase> = [
    {
      title: 'Номер',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      sorter: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber),
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Поставщик',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
      sorter: (a, b) => a.supplier.name.localeCompare(b.supplier.name),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusName(status)}</Tag>
      ),
      filters: [
        { text: 'Черновик', value: 'draft' },
        { text: 'Завершен', value: 'completed' },
        { text: 'Отменен', value: 'cancelled' },
      ],
      onFilter: (value: any, record: Purchase) => record.status === value,
    },
    {
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatPrice(amount),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Товаров',
      dataIndex: 'totalItems',
      key: 'totalItems',
      render: (totalItems: number, record: Purchase) => {
        if (typeof totalItems === 'number') return totalItems;

        if (!record.items || !Array.isArray(record.items)) return 0;
        return record.items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
      },
      sorter: (a, b) => {
        if (
          typeof a.totalItems === 'number' &&
          typeof b.totalItems === 'number'
        ) {
          return a.totalItems - b.totalItems;
        }

        const itemsA = a.items || [];
        const itemsB = b.items || [];

        const totalA = Array.isArray(itemsA)
          ? itemsA.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0;
        const totalB = Array.isArray(itemsB)
          ? itemsB.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0;

        return totalA - totalB;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Просмотр',
            icon: <EyeOutlined />,
            onClick: () => handleViewPurchase(record),
          },
        ];

        if (record.status === 'draft') {
          items.push(
            {
              key: 'edit',
              label: 'Редактировать',
              icon: <EditOutlined />,
              onClick: () => handleEditDraft(record),
            },
            {
              key: 'complete',
              label: 'Завершить',
              icon: <CheckCircleOutlined />,
              onClick: () => handleCompleteDraft(record),
            }
          );
        }

        items.push(
          {
            key: 'copy',
            label: 'Копировать',
            icon: <CopyOutlined />,
            onClick: () => handleViewPurchase(record),
          },
          {
            key: 'delete',
            label: 'Удалить',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeletePurchase(record.id.toString()),
          }
        );

        return (
          <Space size="small">
            <Dropdown menu={{ items }} placement="bottomRight">
              <Button type="text" icon={<EllipsisOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];

    return purchases.filter((purchase: Purchase) => {
      const searchFields = [
        purchase.invoiceNumber,
        purchase.supplier?.name,
        purchase.comment,
      ].filter(Boolean);
      const matchesSearch =
        !searchText ||
        searchFields.some((field) =>
          field?.toLowerCase().includes(searchText.toLowerCase())
        );

      const matchesStatus =
        !selectedStatus || purchase.status === selectedStatus;

      const matchesSupplier =
        !selectedSupplier || purchase.supplier.name === selectedSupplier;

      const matchesDateRange =
        !dateRange?.[0] ||
        !dateRange?.[1] ||
        (dayjs(purchase.date).isAfter(dateRange[0]) &&
          dayjs(purchase.date).isBefore(dateRange[1]));

      const matchesMinAmount = !minAmount || purchase.totalAmount >= minAmount;
      const matchesMaxAmount = !maxAmount || purchase.totalAmount <= maxAmount;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSupplier &&
        matchesDateRange &&
        matchesMinAmount &&
        matchesMaxAmount
      );
    });
  }, [
    purchases,
    searchText,
    selectedStatus,
    selectedSupplier,
    dateRange,
    minAmount,
    maxAmount,
  ]);

  const handleModalClose = () => {
    console.log('Modal close clicked');
    Modal.confirm({
      title: 'Внимание',
      content:
        'Вы уверены, что хотите закрыть окно? Все введенные данные будут потеряны.',
      onOk: () => {
        try {
          formRef.current?.handleClose();
          setShowForm(false);
        } catch (e) {
          message.error('Произошла ошибка при закрытии окна');
        }
      },
      okText: 'Да',
      cancelText: 'Нет',
    });
  };

  const handleSuccessfulSubmit = () => {
    console.log('Purchase successfully submitted');
    setShowForm(false);
    refetch();
  };

  // Функция для проверки перед открытием модального окна
  const openAddPurchaseModal = () => {
    if (!shopId) {
      message.error('ID магазина не указан');
      return;
    }

    if (!isValidUUID(shopId)) {
      message.error('ID магазина должен быть в формате UUID');
      return;
    }

    setSelectedPurchase(null);
    setEditingDraft(null);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  // Проверка на корректность shopId
  if (!shopId || !isValidUUID(shopId)) {
    return (
      <div className="p-6">
        <div className="text-center p-10 bg-red-50 rounded-lg">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">
            Ошибка загрузки данных
          </h1>
          <p className="text-lg">
            ID магазина отсутствует или имеет некорректный формат.
          </p>
          <p className="text-gray-600 mt-2">
            Пожалуйста, проверьте URL и попробуйте снова.
          </p>
          <p className="text-gray-600 mt-2">
            Текущий ID: {shopId || 'не указан'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Учет приходов</h1>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddPurchaseModal}
          >
            Добавить приход
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExportToExcel}
          >
            Экспорт
          </Button>
        </Space>
      </div>

      <Card>
        <Space direction="vertical" className="w-full">
          <Input.Search
            placeholder="Поиск по номеру накладной или поставщику"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-md"
            allowClear
          />

          {showAdvancedFilters && (
            <Space wrap>
              <RangePicker
                value={dateRange}
                onChange={(dates) =>
                  setDateRange(
                    dates as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                  )
                }
                placeholder={['Дата с', 'Дата по']}
              />
              <Select
                placeholder="Статус"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
                style={{ width: 120 }}
                options={[
                  { label: 'Черновик', value: 'draft' },
                  { label: 'Завершен', value: 'completed' },
                  { label: 'Отменен', value: 'cancelled' },
                ]}
              />
              <Select
                placeholder="Поставщик"
                value={selectedSupplier}
                onChange={setSelectedSupplier}
                allowClear
                style={{ width: 200 }}
                options={suppliers}
                showSearch
                optionFilterProp="label"
              />
              <Input
                placeholder="Мин. сумма"
                type="number"
                style={{ width: 120 }}
                value={minAmount || ''}
                onChange={(e) =>
                  setMinAmount(e.target.value ? Number(e.target.value) : null)
                }
              />
              <Input
                placeholder="Макс. сумма"
                type="number"
                style={{ width: 120 }}
                value={maxAmount || ''}
                onChange={(e) =>
                  setMaxAmount(e.target.value ? Number(e.target.value) : null)
                }
              />
            </Space>
          )}
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredPurchases}
        rowKey={(record) => record.id.toString()}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Создание прихода"
        width={1000}
        open={showForm}
        footer={null}
        destroyOnClose
        maskClosable={false}
        keyboard={true}
        onCancel={handleModalClose}
      >
        <PurchaseForm
          ref={formRef}
          shopId={shopId}
          onClose={handleModalClose}
          onSuccess={handleSuccessfulSubmit}
        />
      </Modal>

      <Modal
        open={showDetails}
        onCancel={() => {
          console.log('Закрытие модального окна деталей прихода');
          setShowDetails(false);
        }}
        footer={[
          <Button key="close" onClick={() => setShowDetails(false)}>
            Закрыть
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              const detailsComponent = document.getElementById(
                'purchase-details-print'
              );
              if (detailsComponent) {
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = detailsComponent.innerHTML;
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload();
              }
            }}
            className="bg-blue-500"
          >
            Печать
          </Button>,
        ]}
        title="Детали прихода"
        width={1200}
        maskClosable={true}
      >
        <PurchaseDetails
          purchase={selectedPurchase}
          visible={showDetails}
          onClose={() => {
            console.log('Закрываем модальное окно деталей');
            setShowDetails(false);
          }}
        />
      </Modal>
    </div>
  );
}

export default IncomingPage;
