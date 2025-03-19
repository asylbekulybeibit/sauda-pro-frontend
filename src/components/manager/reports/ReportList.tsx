import { useState, useMemo, useEffect } from 'react';
import { Report } from '@/types/report';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteReport,
  downloadReport,
  getReportDetails,
} from '@/services/managerApi';
import {
  TrashIcon,
  ArrowDownTrayIcon as DownloadIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  Modal,
  Button,
  Spin,
  Typography,
  Tag,
  Input,
  message,
 
} from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Title,  } = Typography;

interface ReportListProps {
  reports: Report[];
}

export function ReportList({ reports }: ReportListProps) {
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reportDetails, setReportDetails] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const queryClient = useQueryClient();

  

  const downloadMutation = useMutation({
    mutationFn: (params: { id: string; shopId: string }) =>
      downloadReport(params.id, params.shopId),
  });

  const handleDelete = async (report: Report) => {
    try {
      await deleteReport(report.id.toString(), report.shopId);
      message.success('Отчет успешно удален');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setReportToDelete(null);
    } catch (error) {
      console.error('Error deleting report:', error);
      message.error('Ошибка при удалении отчета');
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await downloadMutation.mutateAsync({
        id: report.id.toString(),
        shopId: report.shopId,
      });
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
      message.error('Ошибка при скачивании отчета');
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
    // Нормализуем ключ для более надежного сравнения
    const normalizedKey = key.toLowerCase();

    // Специальные маппинги для финансового отчета
    if (reportType === 'FINANCIAL') {
      // Маппинг ключей финансового отчета
      if (normalizedKey === 'revenue') return 'Выручка';
      if (normalizedKey === 'costs') return 'Затраты';
      if (normalizedKey === 'profit') return 'Прибыль';
      if (normalizedKey === 'profitmargin') return 'Маржа прибыли';
    }

    // Специальные ключи для отчета по акциям
    if (reportType === 'PROMOTIONS') {
      // Специальные маппинги для разных вариантов ключей
      if (
        normalizedKey === 'totalpromotions' ||
        normalizedKey === 'всего акций'
      ) {
        return 'Всего акций';
      }
      if (
        normalizedKey === 'activepromotions' ||
        normalizedKey === 'активные акции'
      ) {
        return 'Активные акции';
      }
      if (
        normalizedKey === 'totaldiscountedsales' ||
        normalizedKey.includes('discount')
      ) {
        return 'Общая сумма продаж со скидкой';
      }
      // Частичное соответствие
      if (normalizedKey.includes('promotion')) {
        return 'Акции';
      }
      if (normalizedKey.includes('sales')) {
        return 'Продажи';
      }
      if (normalizedKey.includes('revenue')) {
        return 'Выручка';
      }
      if (normalizedKey.includes('discount')) {
        return 'Скидка';
      }
    }

    // Остальной код без изменений

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
      // Дополнительные маппинги для отчета по продажам
      totalsales: 'Общие продажи',
      totalorders: 'Всего заказов',
      averageordervalue: 'Средний чек',
      uniqueproducts: 'Уникальных товаров',
      totalquantity: 'Общее количество',
      totalrevenue: 'Общая выручка',
      averageprice: 'Средняя цена',
      salesbyproduct: 'Продажи по товарам',
      salesbydate: 'Продажи по датам',
      averagecheck: 'Средний чек',
      totalcustomers: 'Всего покупателей',
      salesgrowth: 'Рост продаж',
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
        totalItems: 'Всего товаров',
        uniqueProducts: 'Уникальных товаров',
        averageCheck: 'Средний чек',
        totalQuantity: 'Общее количество',
        totalRevenue: 'Общая выручка',
        averagePrice: 'Средняя цена',
        salesByProduct: 'Продажи по товарам',
        salesByDate: 'Продажи по датам',
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
        revenue: 'Выручка',
        costs: 'Затраты',
        profit: 'Прибыль',
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
    // Заголовки специфичные для каждого типа отчета
    const headerMappings: Record<string, Record<string, string>> = {
      SALES: {
        date: 'Дата',
        product: 'Товар',
        quantity: 'Количество',
        price: 'Цена',
        total: 'Сумма',
        cashier: 'Кассир',
        customer: 'Клиент',
        method: 'Способ оплаты',
        orderNumber: 'Номер заказа',
        status: 'Статус',
        discount: 'Скидка',
        paymentStatus: 'Статус оплаты',
        deliveryStatus: 'Статус доставки',
        comment: 'Комментарий',
      },
      INVENTORY: {
        name: 'Наименование',
        category: 'Категория',
        quantity: 'Количество',
        price: 'Цена',
        value: 'Стоимость',
        status: 'Статус',
        minQuantity: 'Мин. остаток',
        sku: 'Артикул',
        barcode: 'Штрихкод',
      },
      STAFF: {
        name: 'Сотрудник',
        position: 'Должность',
        totalSales: 'Продажи',
        totalTransactions: 'Транзакции',
        averageTransactionValue: 'Средний чек',
        performance: 'Эффективность',
      },
      FINANCIAL: {
        date: 'Дата',
        type: 'Тип операции',
        product: 'Товар',
        category: 'Категория',
        quantity: 'Количество',
        price: 'Цена',
        total: 'Сумма',
        amount: 'Сумма',
        description: 'Описание',
        comment: 'Комментарий',
        balance: 'Баланс',
        method: 'Способ платежа',
      },
      CATEGORIES: {
        name: 'Категория',
        productCount: 'Кол-во товаров',
        totalSales: 'Продажи',
        totalQuantity: 'Количество',
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
        productCount: 'Кол-во товаров',
        totalSales: 'Общие продажи',
        totalQuantity: 'Кол-во проданных товаров',
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
      TOTALITEMS: 'Всего товаров',
      TOTALVALUE: 'Общая стоимость',
      МЕНОВАНИЕ: 'Наименование', // Для русских заголовков, которые могут быть искажены
      СТОИМОСТЬ: 'Стоимость',
      КОЛИЧЕСТВО: 'Количество',
      СТАТУС: 'Статус',
      КАТЕГОРИЯ: 'Категория',
      // Новые маппинги для отчета по акциям
      STARTDATE: 'Начало',
      ENDDATE: 'Завершение',
      DISCOUNT: 'Скидка',
      PRODUCTCOUNT: 'Кол-во товаров',
      TOTALSALES: 'Общие продажи',
      TOTALQUANTITY: 'Кол-во проданных товаров',
      // Для заголовков отчета по акциям с camelCase написанием
      totalsales: 'Общие продажи',
      totalSales: 'Общие продажи',
      productcount: 'Кол-во товаров',
      productCount: 'Кол-во товаров',
      totalquantity: 'Кол-во проданных товаров',
      totalQuantity: 'Кол-во проданных товаров',
    };

    // Специальное преобразование для отчета по акциям
    if (reportType === 'PROMOTIONS') {
      if (key === 'name' || key === 'Name') return 'Акция';
      if (key === 'startdate' || key === 'startDate') return 'Начало';
      if (key === 'enddate' || key === 'endDate') return 'Завершение';
      if (key === 'discount' || key === 'Discount') return 'Скидка (%)';
      if (key === 'productcount' || key === 'productCount')
        return 'Кол-во товаров';
      if (key === 'totalsales' || key === 'totalSales') return 'Общие продажи';
      if (key === 'totalquantity' || key === 'totalQuantity')
        return 'Кол-во проданных товаров';
    }

    // Проверяем, есть ли ключ в маппинге для верхнего регистра
    if (key === key.toUpperCase() && upperCaseMapping[key]) {
      return upperCaseMapping[key];
    }

    const tableHeaders = getReportTableHeaders(reportType);
    return (
      tableHeaders[lowerKey] ||
      tableHeaders[key] ||
      upperCaseMapping[key] ||
      key
    );
  };

  // Проверка, является ли акция активной в данный момент
  const isPromotionActive = (
    startDateStr: string,
    endDateStr: string
  ): boolean => {
    if (!startDateStr || !endDateStr) return false;

    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      const now = new Date();

      // Проверка на валидность дат
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;

      // Активна, если текущая дата между датой начала и окончания акции
      return now >= startDate && now <= endDate;
    } catch (error) {
      console.error('Error checking promotion activity:', error);
      return false;
    }
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

    // Обработка типов операций для финансовых отчетов
    if (reportType === 'FINANCIAL' && normalizedKey === 'type') {
      const operationTypes: Record<string, string> = {
        PURCHASE: 'Приход',
        SALE: 'Продажа',
        WRITE_OFF: 'Списание',
        ADJUSTMENT: 'Корректировка',
        TRANSFER: 'Перемещение',
      };

      return operationTypes[value] || value;
    }

    // Специальная обработка для отчета по акциям
    if (reportType === 'PROMOTIONS') {
      // Форматирование дат начала и завершения для отчета по акциям
      if (
        normalizedKey === 'startdate' ||
        normalizedKey === 'enddate' ||
        key === 'startDate' ||
        key === 'endDate'
      ) {
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);

        const now = new Date();

        // Определение статуса даты
        let statusClass = '';
        let statusIcon = null;

        if (normalizedKey === 'startdate' || key === 'startDate') {
          if (date > now) {
            // Если дата начала в будущем - акция еще не началась
            statusClass = 'text-orange-600 font-medium';
            statusIcon = (
              <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
            );
          } else {
            statusClass = 'text-gray-600';
          }
        } else if (normalizedKey === 'enddate' || key === 'endDate') {
          if (date < now) {
            // Если дата завершения в прошлом - акция завершена
            statusClass = 'text-gray-500';
          } else {
            statusClass = 'text-green-600 font-medium';
          }
        }

        // Форматируем дату в удобный для чтения вид
        const options: Intl.DateTimeFormatOptions = {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };

        const formattedDate = date.toLocaleDateString('ru-RU', options);

        return (
          <span className={`flex items-center ${statusClass}`}>
            {statusIcon}
            {formattedDate}
          </span>
        );
      }

      // Индикатор активности акции (сравниваем даты начала и окончания с текущей датой)
      if (normalizedKey === 'name' && value) {
        // Ищем в той же строке даты начала и окончания для определения активности акции
        const row = reportDetails.details.find(
          (item: Record<string, any>) =>
            item.name === value || item.NAME === value
        );

        if (row) {
          const startDate = row.startDate || row.startdate || row.STARTDATE;
          const endDate = row.endDate || row.enddate || row.ENDDATE;

          // Используем функцию для определения активности
          const isActive = isPromotionActive(startDate, endDate);

          return (
            <span className="flex items-center">
              {isActive && (
                <span
                  className="w-2 h-2 bg-green-500 rounded-full mr-2"
                  title="Активная акция"
                ></span>
              )}
              {String(value)}
            </span>
          );
        }
      }

      // Форматирование скидки как процент
      if (normalizedKey === 'discount') {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            -{value}%
          </span>
        );
      }

      // Форматирование количества товаров с визуальным индикатором
      if (
        normalizedKey === 'productcount' ||
        (normalizedKey.includes('product') && normalizedKey.includes('count'))
      ) {
        const count = Number(value);
        let barClass = 'bg-blue-200';
        let width = 'w-4'; // Минимальная ширина

        if (count > 20) {
          barClass = 'bg-blue-500';
          width = 'w-24';
        } else if (count > 10) {
          barClass = 'bg-blue-400';
          width = 'w-16';
        } else if (count > 5) {
          barClass = 'bg-blue-300';
          width = 'w-8';
        }

        return (
          <span className="flex items-center">
            <span
              className={`inline-block ${width} h-1.5 ${barClass} rounded-full mr-2`}
            ></span>
            {count}
          </span>
        );
      }

      // Улучшенное отображение продаж
      if (normalizedKey === 'totalsales' || normalizedKey === 'totalquantity') {
        const numValue = Number(value);
        if (isNaN(numValue)) return String(value);

        let textColor = 'text-gray-700';

        if (normalizedKey === 'totalsales') {
          if (numValue > 100000) textColor = 'text-green-700 font-medium';
          else if (numValue > 50000) textColor = 'text-green-600';
          else if (numValue > 0) textColor = 'text-green-500';

          return (
            <span className={textColor}>
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'KZT',
                maximumFractionDigits: 0,
              }).format(numValue)}
            </span>
          );
        }

        if (normalizedKey === 'totalquantity') {
          if (numValue > 50) textColor = 'text-blue-700 font-medium';
          else if (numValue > 20) textColor = 'text-blue-600';
          else if (numValue > 0) textColor = 'text-blue-500';

          return <span className={textColor}>{numValue}</span>;
        }
      }
    }

    // Специальная обработка для отчета по продажам
    if (reportType === 'SALES') {
      // Форматирование даты
      if (normalizedKey === 'date' || normalizedKey === 'createdAt') {
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);

        const options: Intl.DateTimeFormatOptions = {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };
        return date.toLocaleString('ru-RU', options);
      }

      // Форматирование цены и суммы
      if (
        normalizedKey === 'price' ||
        normalizedKey === 'total' ||
        normalizedKey === 'amount'
      ) {
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'KZT',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Number(value));
      }

      // Форматирование количества
      if (normalizedKey === 'quantity') {
        return new Intl.NumberFormat('ru-RU').format(Number(value));
      }

      // Форматирование статуса
      if (normalizedKey === 'status') {
        const statusMap: Record<string, { text: string; color: string }> = {
          completed: { text: 'Завершен', color: 'green' },
          pending: { text: 'В обработке', color: 'orange' },
          cancelled: { text: 'Отменен', color: 'red' },
        };
        const status = statusMap[value.toLowerCase()] || {
          text: value,
          color: 'default',
        };
        return <Tag color={status.color}>{status.text}</Tag>;
      }

      // Форматирование способа оплаты
      if (normalizedKey === 'method' || normalizedKey === 'paymentmethod') {
        const methodMap: Record<string, string> = {
          cash: 'Наличные',
          card: 'Карта',
          transfer: 'Перевод',
        };
        return methodMap[value.toLowerCase()] || value;
      }
    }

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
        'totalsales', // Добавлено для отчета по акциям
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
              Отчет: {getReportTypeText(viewingReport.type)} (
              {formatDate(viewingReport.createdAt)})
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
            onClick={() => handleDownload(viewingReport)}
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
                                className={`p-4 rounded-lg border ${cardColorClass}`}
                              >
                                <div className="text-xs text-gray-500 mb-1">
                                  {getLocalizedSummaryKey(
                                    key,
                                    viewingReport.type
                                  )}
                                </div>
                                <div
                                  className={`font-medium ${textColorClass}`}
                                >
                                  {formatSummaryValue(key, value)}
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
                        placeholder="Поиск по отчету"
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                      />
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div
                        className="overflow-x-auto"
                        style={{ maxHeight: '400px' }}
                      >
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              {reportDetails.details.length > 0 &&
                                (viewingReport.type === 'FINANCIAL'
                                  ? getSortedFinancialColumns(
                                      reportDetails.details[0]
                                    )
                                  : Object.keys(reportDetails.details[0])
                                ).map((column) => (
                                  <th
                                    key={column}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                                  >
                                    {getLocalizedColumnName(
                                      column,
                                      viewingReport.type
                                    )}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReportData.map(
                              (row: Record<string, any>, idx: number) => (
                                <tr
                                  key={idx}
                                  className={
                                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  }
                                >
                                  {(viewingReport.type === 'FINANCIAL'
                                    ? getSortedFinancialColumns(row)
                                    : Object.keys(row)
                                  ).map((column) => (
                                    <td
                                      key={`${idx}-${column}`}
                                      className="px-4 py-3 text-sm"
                                    >
                                      {formatColumnValue(
                                        column,
                                        row[column],
                                        viewingReport.type
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Нет данных для отображения
              </div>
            )}
          </div>
        )}
      </Modal>
    );
  };

  const showDeleteConfirm = (report: Report) => {
    setReportToDelete(report);
  };

  const handleDeleteCancel = () => {
    setReportToDelete(null);
  };

  // Функция для сортировки столбцов в финансовом отчете
  const getSortedFinancialColumns = (row: Record<string, any>): string[] => {
    // Определяем желаемый порядок столбцов
    const columnOrder = [
      'date', // Дата
      'type', // Тип операции
      'product', // Товар
      'price', // Цена
      'quantity', // Количество
      'total', // Сумма
      'amount', // Альтернативное название для суммы, если присутствует
      'comment', // Комментарий
      'description', // Описание
      'category', // Категория
      'balance', // Баланс
      'method', // Способ платежа
    ];

    // Получаем все ключи из объекта
    const availableColumns = Object.keys(row);

    // Сначала добавляем столбцы в желаемом порядке, если они присутствуют
    const sortedColumns = columnOrder.filter(
      (col) =>
        availableColumns.includes(col) ||
        availableColumns.includes(col.toUpperCase()) ||
        availableColumns.includes(col.charAt(0).toUpperCase() + col.slice(1))
    );

    // Затем добавляем оставшиеся столбцы, которые не были включены в заданный порядок
    availableColumns.forEach((col) => {
      const lowerCol = col.toLowerCase();
      // Проверяем, не был ли столбец уже добавлен (в другом регистре)
      if (!columnOrder.some((ordered) => ordered.toLowerCase() === lowerCol)) {
        sortedColumns.push(col);
      }
    });

    return sortedColumns;
  };

  return (
    <div>
      {renderReportDetails()}

      {/* Модальное окно подтверждения удаления */}
      <Modal
        title="Подтверждение удаления"
        open={!!reportToDelete}
        onOk={() => reportToDelete && handleDelete(reportToDelete)}
        onCancel={handleDeleteCancel}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <p>
          Вы действительно хотите удалить отчет типа "
          {reportToDelete ? getReportTypeText(reportToDelete.type) : ''}"?
        </p>
        <p>Это действие нельзя будет отменить.</p>
      </Modal>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Формат
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Создан
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Период
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Отчеты не найдены. Создайте новый отчет.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getReportTypeText(report.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getFormatText(report.format)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.period === 'custom'
                      ? 'Произвольный'
                      : report.period === 'day'
                      ? 'День'
                      : report.period === 'week'
                      ? 'Неделя'
                      : report.period === 'month'
                      ? 'Месяц'
                      : report.period === 'quarter'
                      ? 'Квартал'
                      : report.period === 'year'
                      ? 'Год'
                      : report.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        title="Просмотр отчета"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="Скачать отчет"
                      >
                        <DownloadIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => showDeleteConfirm(report)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                        title="Удалить отчет"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
