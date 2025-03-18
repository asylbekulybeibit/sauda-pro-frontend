import { useState, useMemo, useEffect } from 'react';
import { Report } from '@/types/report';
import { ReportForm } from './ReportForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteReport,
  downloadReport,
  getReportDetails,
} from '@/services/managerApi';
import {
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon as DownloadIcon,
  EyeIcon,
  ArrowPathIcon as RefreshIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/format';
import {
  Modal,
  Button,
  Descriptions,
  Spin,
  Typography,
  Tag,
  message,
  Table,
  Input,
} from 'antd';
import {
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ReportListProps {
  reports: Report[];
}

export function ReportList({ reports }: ReportListProps) {
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reportDetails, setReportDetails] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => downloadReport(id),
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отчет?')) {
      await deleteMutation.mutateAsync(id.toString());
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await downloadMutation.mutateAsync(id.toString());
      if (response && response.data instanceof Blob) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.filename || 'report');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Ошибка при скачивании отчета:', error);
    }
  };

  const handleViewReport = async (report: Report) => {
    setViewingReport(report);
    setLoadingDetails(true);

    try {
      await loadReportDetails(report);
    } catch (error) {
      console.error('Ошибка при загрузке деталей отчета:', error);
      setLoadingDetails(false);
    }
  };

  const loadReportDetails = async (report: Report) => {
    try {
      // Проверка, имеются ли данные отчета уже в объекте report
      if (report.data) {
        // Если данные уже есть в отчете, используем их
        setReportDetails(report.data);
      } else {
        // Получаем данные с сервера
        const reportData = await getReportDetails(report.id.toString());
        setReportDetails(reportData);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных отчета:', error);
      // Создаем пустую структуру данных в случае ошибки
      const emptyReportData = {
        summary: {},
        details: [],
      };
      setReportDetails(emptyReportData);
      throw error;
    } finally {
      setLoadingDetails(false);
    }
  };

  const refreshReportDetails = async () => {
    if (!viewingReport) return;

    setLoadingDetails(true);
    try {
      // Всегда получаем свежие данные с сервера при обновлении
      const reportData = await getReportDetails(viewingReport.id.toString());
      setReportDetails(reportData);
      message.success('Данные отчета обновлены');
    } catch (error) {
      console.error('Ошибка при обновлении данных отчета:', error);
      message.error('Не удалось обновить данные отчета');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setViewingReport(null);
    setReportDetails(null);
  };

  // Улучшенный метод для получения названия типа отчета
  const getReportTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
      SALES: 'Продажи',
      INVENTORY: 'Инвентарь',
      STAFF: 'Персонал',
      FINANCIAL: 'Финансы',
      CATEGORIES: 'Категории',
      PROMOTIONS: 'Акции',
    };
    return typeMap[type] || type;
  };

  // Улучшенный метод для получения названия формата
  const getFormatText = (format: string): string => {
    const formatMap: Record<string, string> = {
      pdf: 'PDF документ',
      excel: 'Excel таблица',
      csv: 'CSV файл',
    };
    return formatMap[format.toLowerCase()] || format;
  };

  // Форматирование даты в русском формате
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';

    const date = new Date(dateString);

    // Проверка на валидность даты
    if (isNaN(date.getTime())) return '-';

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return date.toLocaleString('ru-RU', options);
  };

  // Функция для локализации ключей сводки отчета
  const getLocalizedSummaryKey = (key: string, reportType: string): string => {
    // Приводим ключ к нижнему регистру для регистронезависимого сравнения
    const normalizedKey = key.toLowerCase();

    // Специальные маппинги для полей отчета, которые могут прийти с backend
    const specialMappings: Record<string, string> = {
      totalproducts: 'Всего товаров',
      lowstockproducts: 'Мало на складе',
      outofstockproducts: 'Отсутствует на складе',
      totalitems: 'Всего товаров',
      totalvalue: 'Общая стоимость',
      lowstockitems: 'Мало на складе',
      outofstockitems: 'Отсутствует на складе',
      total: 'Всего',
      'общая стоимость': 'Общая стоимость',
      общая: 'Общая',
      общий: 'Общий',
      всего: 'Всего',
    };

    // Частичное соответствие для ключей
    if (normalizedKey.includes('total') && normalizedKey.includes('product')) {
      return 'Всего товаров';
    }

    if (
      normalizedKey.includes('low') &&
      (normalizedKey.includes('stock') ||
        normalizedKey.includes('items') ||
        normalizedKey.includes('product'))
    ) {
      return 'Мало на складе';
    }

    if (
      normalizedKey.includes('out') &&
      (normalizedKey.includes('stock') ||
        normalizedKey.includes('items') ||
        normalizedKey.includes('product'))
    ) {
      return 'Отсутствует на складе';
    }

    // Если ключ совпадает с одним из специальных маппингов
    if (specialMappings[normalizedKey]) {
      return specialMappings[normalizedKey];
    }

    const summaryKeyMappings: Record<string, Record<string, string>> = {
      SALES: {
        totalSales: 'Общие продажи',
        totalOrders: 'Всего заказов',
        averageOrderValue: 'Средний чек',
        topSellingProduct: 'Самый продаваемый товар',
        topCategory: 'Лучшая категория',
        totalCustomers: 'Всего покупателей',
        salesGrowth: 'Рост продаж',
      },
      INVENTORY: {
        totalItems: 'Всего товаров',
        totalValue: 'Общая стоимость',
        lowStockItems: 'Мало на складе',
        outOfStockItems: 'Отсутствует на складе',
        averageItemValue: 'Средняя стоимость товара',
        inventoryTurnover: 'Оборачиваемость запасов',
      },
      STAFF: {
        totalStaff: 'Всего сотрудников',
        averageSales: 'Средние продажи',
        topPerformer: 'Лучший сотрудник',
        totalHours: 'Всего часов',
        staffEfficiency: 'Эффективность персонала',
        averagePerformance: 'Средняя производительность',
      },
      FINANCIAL: {
        totalIncome: 'Общий доход',
        totalExpenses: 'Общие расходы',
        netProfit: 'Чистая прибыль',
        profitMargin: 'Маржа прибыли',
        costOfGoodsSold: 'Себестоимость проданных товаров',
        operatingExpenses: 'Операционные расходы',
      },
      CATEGORIES: {
        totalCategories: 'Всего категорий',
        totalProducts: 'Всего товаров',
        averageProductsPerCategory: 'Среднее количество товаров в категории',
        topCategory: 'Лучшая категория',
        worstCategory: 'Худшая категория',
        categoriesGrowth: 'Рост категорий',
      },
      PROMOTIONS: {
        totalPromotions: 'Всего акций',
        activePromotions: 'Активные акции',
        upcomingPromotions: 'Предстоящие акции',
        expiredPromotions: 'Завершенные акции',
        mostEffectivePromotion: 'Самая эффективная акция',
        averageDiscount: 'Средняя скидка',
      },
    };

    const defaultKeys: Record<string, string> = {
      totalItems: 'Всего элементов',
      totalValue: 'Общая стоимость',
      averageValue: 'Среднее значение',
      minValue: 'Минимальное значение',
      maxValue: 'Максимальное значение',
      count: 'Количество',
    };

    // Проверяем наличие ключа в конкретном типе отчетов
    if (summaryKeyMappings[reportType] && summaryKeyMappings[reportType][key]) {
      return summaryKeyMappings[reportType][key];
    }

    // Проверяем в общих ключах
    if (defaultKeys[key]) {
      return defaultKeys[key];
    }

    // Если не нашли соответствия, сделаем первую букву заглавной и вернем как есть
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  // Функция для форматирования значений сводки
  const formatSummaryValue = (key: string, value: any): string => {
    if (
      (key.includes('total') && key.includes('Value')) ||
      key.includes('price') ||
      key === 'totalSales' ||
      key === 'totalValue'
    ) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'KZT',
      }).format(Number(value));
    }

    if (
      key.includes('margin') ||
      key.includes('Margin') ||
      key.includes('percentage')
    ) {
      return `${Number(value).toFixed(2)}%`;
    }

    return String(value);
  };

  // Функция для получения заголовков таблицы в зависимости от типа отчета
  const getReportTableHeaders = (
    reportType: string
  ): Record<string, string> => {
    const headerMappings: Record<string, Record<string, string>> = {
      SALES: {
        product: 'Товар',
        quantity: 'Количество',
        price: 'Цена',
        total: 'Сумма',
        date: 'Дата',
        category: 'Категория',
        name: 'Наименование',
        id: 'ID',
        description: 'Описание',
        count: 'Количество',
        amount: 'Сумма',
      },
      INVENTORY: {
        sku: 'Артикул',
        name: 'Наименование',
        quantity: 'Количество',
        price: 'Цена',
        value: 'Стоимость',
        category: 'Категория',
        status: 'Статус',
        minQuantity: 'Мин. количество',
        maxQuantity: 'Макс. количество',
        id: 'ID',
        description: 'Описание',
        barcode: 'Штрих-код',
      },
      STAFF: {
        name: 'Сотрудник',
        role: 'Должность',
        sales: 'Продажи',
        transactions: 'Транзакции',
        hours: 'Часы работы',
        performance: 'Эффективность',
        id: 'ID',
        email: 'Email',
        phone: 'Телефон',
        position: 'Позиция',
        department: 'Отдел',
      },
      FINANCIAL: {
        date: 'Дата',
        category: 'Категория',
        income: 'Доход',
        expense: 'Расход',
        balance: 'Баланс',
        description: 'Описание',
        id: 'ID',
        type: 'Тип',
        amount: 'Сумма',
        transaction: 'Транзакция',
      },
      CATEGORIES: {
        name: 'Категория',
        products: 'Товаров',
        sales: 'Продажи',
        revenue: 'Выручка',
        profit: 'Прибыль',
        id: 'ID',
        description: 'Описание',
        count: 'Количество',
        percentage: 'Процент',
      },
      PROMOTIONS: {
        name: 'Акция',
        startDate: 'Начало',
        endDate: 'Завершение',
        products: 'Товаров',
        sales: 'Продажи',
        revenue: 'Выручка',
        id: 'ID',
        description: 'Описание',
        discount: 'Скидка',
        type: 'Тип',
      },
    };

    // Общие заголовки для всех типов отчетов
    const commonHeaders: Record<string, string> = {
      id: 'ID',
      name: 'Название',
      description: 'Описание',
      type: 'Тип',
      value: 'Значение',
      price: 'Цена',
      quantity: 'Количество',
      total: 'Итого',
      totalValue: 'Общая стоимость',
      totalItems: 'Всего товаров',
      lowStockItems: 'Мало на складе',
      outOfStockItems: 'Нет в наличии',
      category: 'Категория',
      status: 'Статус',
      date: 'Дата',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
      createdAt: 'Дата создания',
      updatedAt: 'Дата обновления',
      user: 'Пользователь',
      count: 'Количество',
    };

    // Комбинируем специфичные для типа отчета заголовки с общими
    return {
      ...commonHeaders,
      ...(headerMappings[reportType] || {}),
    };
  };

  // Функция для локализации имен полей в детальных данных
  const getLocalizedColumnName = (key: string, reportType: string): string => {
    // Преобразуем ключ к нижнему регистру для соответствия нашим маппингам
    const lowerKey = key.toLowerCase();

    // Дополнительные маппинги для столбцов, которые могут прийти в верхнем регистре
    const upperCaseMapping: Record<string, string> = {
      NAME: 'Наименование',
      QUANTITY: 'Количество',
      PRICE: 'Цена',
      CATEGORY: 'Категория',
      STATUS: 'Статус',
      VALUE: 'Стоимость',
      SKU: 'Артикул',
      ID: 'ID',
      COST: 'Цена',
      MIN: 'Мин. количество',
      MAX: 'Макс. количество',
      TOTAL: 'Итого',
      TOTALSALES: 'Общие продажи',
      TOTALITEMS: 'Всего товаров',
      TOTALVALUE: 'Общая стоимость',
      МЕНОВАНИЕ: 'Наименование', // Для русских заголовков, которые могут быть искажены
      СТОИМОСТЬ: 'Стоимость',
      КОЛИЧЕСТВО: 'Количество',
      СТАТУС: 'Статус',
      КАТЕГОРИЯ: 'Категория',
    };

    // Проверяем, есть ли ключ в маппинге для верхнего регистра
    if (key === key.toUpperCase() && upperCaseMapping[key]) {
      return upperCaseMapping[key];
    }

    const tableHeaders = getReportTableHeaders(reportType);
    return tableHeaders[lowerKey] || tableHeaders[key] || key;
  };

  // Функция для форматирования значений в зависимости от типа колонки
  const formatColumnValue = (
    key: string,
    value: any,
    reportType: string
  ): string | JSX.Element => {
    // Проверяем, не пустое ли значение
    if (value === null || value === undefined) {
      return '-';
    }

    // Обрабатываем ключ в разных регистрах
    const normalizedKey = key.toLowerCase();

    // Форматирование для денежных значений
    if (
      [
        'price',
        'value',
        'total',
        'income',
        'expense',
        'balance',
        'revenue',
        'profit',
        'sales',
        'totalvalue',
        'cost',
      ].includes(normalizedKey) &&
      (typeof value === 'number' || !isNaN(Number(value)))
    ) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'KZT',
        maximumFractionDigits: 0,
      }).format(Number(value));
    }

    // Форматирование для дат
    if (
      ['date', 'startdate', 'enddate', 'createdat', 'updatedat'].includes(
        normalizedKey
      ) &&
      value
    ) {
      return formatDate(value);
    }

    // Форматирование для статусов инвентаря
    if (normalizedKey === 'status' && reportType === 'INVENTORY') {
      // Приводим значение к строке и к верхнему регистру для проверки
      const normalizedValue = String(value).toUpperCase();

      const statusMapping: Record<string, [string, string]> = {
        IN_STOCK: ['В наличии', 'text-green-700 bg-green-100'],
        LOW_STOCK: ['Мало на складе', 'text-yellow-700 bg-yellow-100'],
        OUT_OF_STOCK: ['Отсутствует', 'text-red-700 bg-red-100'],
        'IN STOCK': ['В наличии', 'text-green-700 bg-green-100'],
        'LOW STOCK': ['Мало на складе', 'text-yellow-700 bg-yellow-100'],
        'OUT OF STOCK': ['Отсутствует', 'text-red-700 bg-red-100'],
        'В НАЛИЧИИ': ['В наличии', 'text-green-700 bg-green-100'],
        'МАЛО НА СКЛАДЕ': ['Мало на складе', 'text-yellow-700 bg-yellow-100'],
        ОТСУТСТВУЕТ: ['Отсутствует', 'text-red-700 bg-red-100'],
      };

      // Проверяем наличие ключа с нормализованным значением
      let label = '';
      let className = '';

      // Перебираем все возможные ключи и проверяем соответствие
      for (const [statusKey, [statusLabel, statusClass]] of Object.entries(
        statusMapping
      )) {
        if (normalizedValue.includes(statusKey)) {
          label = statusLabel;
          className = statusClass;
          break;
        }
      }

      // Дополнительно проверяем некоторые частые названия статусов
      if (!label) {
        if (normalizedValue.includes('СКЛАД')) {
          if (normalizedValue.includes('МАЛО')) {
            label = 'Мало на складе';
            className = 'text-yellow-700 bg-yellow-100';
          }
        } else if (normalizedValue.includes('НАЛИЧ')) {
          label = 'В наличии';
          className = 'text-green-700 bg-green-100';
        }
      }

      // Если не нашли соответствие, используем исходное значение
      if (!label) {
        label = String(value);
      }

      if (className) {
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}
          >
            {label}
          </span>
        );
      }
      return label;
    }

    // Форматирование для числовых значений с процентами
    if (
      ['performance', 'margin', 'percentage'].includes(normalizedKey) &&
      (typeof value === 'number' || !isNaN(Number(value)))
    ) {
      return `${Number(value).toFixed(2)}%`;
    }

    // Форматирование для количества товаров и других числовых значений
    if (
      [
        'quantity',
        'totalitems',
        'lowstockitems',
        'outofstockitems',
        'count',
        'min',
        'max',
        'totalproducts',
        'products',
      ].includes(normalizedKey) &&
      (typeof value === 'number' || !isNaN(Number(value)))
    ) {
      return new Intl.NumberFormat('ru-RU').format(Number(value));
    }

    // Если ничего не подошло, возвращаем как строку
    return String(value);
  };

  // Фильтрация данных отчета на основе поискового запроса
  const filteredReportData = useMemo(() => {
    if (!reportDetails?.details || !searchTerm.trim()) {
      return reportDetails?.details || [];
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    return reportDetails.details.filter((row: Record<string, any>) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(normalizedSearchTerm);
      });
    });
  }, [reportDetails?.details, searchTerm]);

  // Сброс поискового запроса при изменении отчета
  useEffect(() => {
    setSearchTerm('');
  }, [viewingReport]);

  const renderReportDetails = () => {
    if (!viewingReport) return null;

    return (
      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="text-blue-500 text-lg mr-2" />
            <span className="text-lg font-medium">
              {viewingReport.name
                ? `Отчет: ${viewingReport.name}`
                : `Отчет: ${getReportTypeText(
                    viewingReport.type
                  )} (${formatDate(viewingReport.createdAt)})`}
            </span>
          </div>
        }
        open={!!viewingReport}
        onCancel={handleCloseDetails}
        width={1000}
        footer={[
          <Button key="close" onClick={handleCloseDetails}>
            Закрыть
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={() => handleDownload(viewingReport.id)}
            icon={<DownloadIcon className="h-4 w-4 mr-1" />}
          >
            Скачать отчет
          </Button>,
        ]}
      >
        {loadingDetails ? (
          <div className="flex flex-col justify-center items-center h-64">
            <Spin size="large" />
            <span className="mt-4 text-gray-500">
              Загрузка данных отчета...
            </span>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Общая информация</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Тип отчета</div>
                  <div className="font-medium">
                    {getReportTypeText(viewingReport.type)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Формат</div>
                  <div className="font-medium">
                    {getFormatText(viewingReport.format)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Дата создания
                  </div>
                  <div className="font-medium">
                    {formatDate(viewingReport.createdAt)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Период</div>
                  <div className="font-medium">
                    {viewingReport.period === 'custom'
                      ? 'Произвольный'
                      : viewingReport.period === 'day'
                      ? 'День'
                      : viewingReport.period === 'week'
                      ? 'Неделя'
                      : viewingReport.period === 'month'
                      ? 'Месяц'
                      : viewingReport.period === 'quarter'
                      ? 'Квартал'
                      : viewingReport.period === 'year'
                      ? 'Год'
                      : viewingReport.period}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Начало периода
                  </div>
                  <div className="font-medium">
                    {formatDate(viewingReport.startDate)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Конец периода
                  </div>
                  <div className="font-medium">
                    {formatDate(viewingReport.endDate)}
                  </div>
                </div>
              </div>
            </div>

            {reportDetails ? (
              <>
                {reportDetails.summary &&
                  Object.keys(reportDetails.summary).length > 0 && (
                    <>
                      <Title level={4} className="mb-4">
                        Сводка
                      </Title>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        {Object.entries(reportDetails.summary)
                          .sort(([keyA], [keyB]) => {
                            // Функция сортировки для упорядочивания ключей
                            const normalizedKeyA = keyA.toLowerCase();
                            const normalizedKeyB = keyB.toLowerCase();

                            // Важные метрики, которые должны быть в начале
                            const priorityKeys = [
                              'totalvalue',
                              'totalitems',
                              'totalproducts',
                              'lowstockitems',
                              'lowstockproducts',
                              'outofstockitems',
                              'outofstockproducts',
                            ];

                            // Вспомогательная функция для определения приоритета ключа
                            const getPriority = (key: string): number => {
                              const lowerKey = key.toLowerCase();

                              // Непосредственное соответствие приоритетным ключам
                              const directPriorityIndex =
                                priorityKeys.findIndex((pk) => pk === lowerKey);
                              if (directPriorityIndex !== -1) {
                                return directPriorityIndex;
                              }

                              // Частичное соответствие для ключей с похожими паттернами
                              if (
                                lowerKey.includes('total') &&
                                lowerKey.includes('value')
                              )
                                return 0;
                              if (
                                lowerKey.includes('total') &&
                                lowerKey.includes('item')
                              )
                                return 1;
                              if (
                                lowerKey.includes('total') &&
                                lowerKey.includes('product')
                              )
                                return 2;
                              if (
                                lowerKey.includes('low') &&
                                lowerKey.includes('stock')
                              )
                                return 3;
                              if (
                                lowerKey.includes('out') &&
                                lowerKey.includes('stock')
                              )
                                return 4;

                              return 100; // Низкий приоритет для всех остальных
                            };

                            return (
                              getPriority(normalizedKeyA) -
                              getPriority(normalizedKeyB)
                            );
                          })
                          .map(([key, value]) => {
                            // Определяем класс цвета для карточки в зависимости от типа метрики
                            const lowerKey = key.toLowerCase();
                            let cardColorClass = 'bg-gray-50';
                            let textColorClass = '';

                            // Выделение низкого запаса желтым цветом
                            if (
                              lowerKey.includes('low') &&
                              lowerKey.includes('stock')
                            ) {
                              cardColorClass = 'bg-yellow-50 border-yellow-200';
                              textColorClass = 'text-yellow-800';
                            }
                            // Выделение отсутствия на складе красным цветом
                            else if (
                              lowerKey.includes('out') &&
                              lowerKey.includes('stock')
                            ) {
                              cardColorClass = 'bg-red-50 border-red-200';
                              textColorClass = 'text-red-800';
                            }
                            // Положительные финансовые показатели зеленым цветом
                            else if (
                              (lowerKey.includes('total') &&
                                lowerKey.includes('value')) ||
                              lowerKey.includes('profit') ||
                              lowerKey.includes('revenue')
                            ) {
                              cardColorClass = 'bg-green-50 border-green-200';
                              textColorClass = 'text-green-800';
                            }

                            return (
                              <div
                                key={key}
                                className={`p-4 rounded-lg border border-gray-200 ${cardColorClass}`}
                              >
                                <div className="text-sm text-gray-500 mb-1">
                                  {getLocalizedSummaryKey(
                                    key,
                                    viewingReport.type
                                  )}
                                </div>
                                <div
                                  className={`text-lg font-medium ${textColorClass}`}
                                >
                                  {formatColumnValue(
                                    key,
                                    value,
                                    viewingReport.type
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  )}

                {reportDetails.details && reportDetails.details.length > 0 && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <Title level={4} className="mb-0">
                        Детализация
                      </Title>
                      <Input
                        placeholder="Поиск в таблице"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 250 }}
                        suffix={<SearchOutlined />}
                        allowClear
                      />
                    </div>

                    <div className="border rounded-lg overflow-hidden mb-6">
                      <table className="min-w-full divide-y divide-gray-200 table-fixed">
                        <thead className="bg-gray-100">
                          <tr>
                            {reportDetails.details.length > 0 &&
                              Object.keys(reportDetails.details[0]).map(
                                (key, index) => (
                                  <th
                                    key={index}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-600"
                                    style={{ wordBreak: 'break-word' }}
                                  >
                                    {getLocalizedColumnName(
                                      key,
                                      viewingReport.type
                                    )}
                                  </th>
                                )
                              )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredReportData.length > 0 ? (
                            filteredReportData.map(
                              (row: Record<string, any>, rowIndex: number) => {
                                // Проверяем, содержит ли строка важные индикаторы статуса
                                let rowColorClass =
                                  rowIndex % 2 === 0
                                    ? 'bg-white'
                                    : 'bg-gray-50';
                                const hasLowStock = Object.values(row).some(
                                  (value) => {
                                    if (typeof value === 'string') {
                                      const lowerValue = value.toLowerCase();
                                      return (
                                        lowerValue.includes('low_stock') ||
                                        lowerValue === 'мало на складе'
                                      );
                                    }
                                    return false;
                                  }
                                );

                                const hasOutOfStock = Object.values(row).some(
                                  (value) => {
                                    if (typeof value === 'string') {
                                      const lowerValue = value.toLowerCase();
                                      return (
                                        lowerValue.includes('out_of_stock') ||
                                        lowerValue === 'отсутствует'
                                      );
                                    }
                                    return false;
                                  }
                                );

                                if (hasOutOfStock) {
                                  rowColorClass = 'bg-red-50';
                                } else if (hasLowStock) {
                                  rowColorClass = 'bg-yellow-50';
                                }

                                return (
                                  <tr key={rowIndex} className={rowColorClass}>
                                    {Object.entries(row).map(
                                      ([key, value], cellIndex) => (
                                        <td
                                          key={`${rowIndex}-${cellIndex}`}
                                          className="px-4 py-3 text-sm"
                                          style={{ wordBreak: 'break-word' }}
                                        >
                                          {formatColumnValue(
                                            key,
                                            value,
                                            viewingReport.type
                                          )}
                                        </td>
                                      )
                                    )}
                                  </tr>
                                );
                              }
                            )
                          ) : (
                            <tr>
                              <td
                                colSpan={
                                  reportDetails.details.length > 0
                                    ? Object.keys(reportDetails.details[0])
                                        .length
                                    : 1
                                }
                                className="px-4 py-6 text-center text-gray-500"
                              >
                                {searchTerm
                                  ? 'Нет данных, соответствующих условиям поиска'
                                  : 'Нет данных для отображения'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Title level={4} className="mt-4">
                  Нет данных для отображения
                </Title>
                <Text type="secondary">Не удалось загрузить данные отчета</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    );
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Название
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Тип
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Формат
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Дата создания
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports && reports.length > 0 ? (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {report.name || 'Отчет без названия'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getReportTypeText(report.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getFormatText(report.format)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(report.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Просмотреть"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingReport(report)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Редактировать"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(report.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Скачать"
                      >
                        <DownloadIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Удалить"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  Нет доступных отчетов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingReport && (
        <ReportForm
          report={editingReport}
          onClose={() => setEditingReport(null)}
          open={true}
        />
      )}

      {renderReportDetails()}
    </div>
  );
}
