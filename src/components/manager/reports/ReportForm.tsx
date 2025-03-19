import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Report, ReportType, ReportFormat, ReportPeriod } from '@/types/report';
import { createReport, updateReport } from '@/services/managerApi';
import { Modal, Form, Select, DatePicker, message, Alert } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportFormProps {
  report?: Report;
  onClose: () => void;
  open: boolean;
}

interface ReportFormData {
  name: string;
  type: ReportType;
  format: ReportFormat;
  period: ReportPeriod;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
}

interface ReportMutationData {
  shopId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  filters: {
    categories?: string[];
    products?: string[];
    staff?: string[];
    promotions?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
}

// Функция для преобразования строки даты в формат для бэкенда
const formatDateForBackend = (date: dayjs.Dayjs): string => {
  return date.toISOString();
};

export function ReportForm({ report, onClose, open }: ReportFormProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const [form] = Form.useForm<ReportFormData>();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<string>('month');
  const [selectedType, setSelectedType] = useState<ReportType>(
    report?.type || 'SALES'
  );

  // Устанавливаем начальные значения формы при открытии модального окна
  useEffect(() => {
    if (open) {
      if (report) {
        const initialValues = {
          ...report,
          period: report.period,
          dateRange:
            report.startDate && report.endDate
              ? [dayjs(report.startDate), dayjs(report.endDate)]
              : undefined,
        };
        form.setFieldsValue(initialValues);
        setPeriod(report.period);
        setSelectedType(report.type);
      } else {
        // Устанавливаем значения по умолчанию
        const today = dayjs();
        const startOfMonth = today.startOf('month');
        const endOfMonth = today.endOf('month');

        form.setFieldsValue({
          type: 'SALES',
          period: 'month',
          format: 'pdf',
          dateRange: [startOfMonth, endOfMonth],
        });
        setPeriod('month');
      }
    }
  }, [open, report, form]);

  const createMutation = useMutation({
    mutationFn: (data: ReportMutationData) => createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      message.success('Отчет успешно создан');
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при создании отчета';

      // Проверяем ошибку на null свойства (обычно проблема с товарами/категориями)
      if (
        error?.response?.data?.error?.includes(
          'Cannot read properties of null'
        ) &&
        selectedType === 'INVENTORY'
      ) {
        message.error(
          'Ошибка в данных инвентаря. Возможно, есть товары без категорий или с неверными ссылками.'
        );
      } else {
        message.error(errorMessage);
      }

      console.error('Error creating report:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ReportMutationData & { id: string }) =>
      updateReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      message.success('Отчет успешно обновлен');
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при обновлении отчета';

      // Проверяем ошибку на null свойства (обычно проблема с товарами/категориями)
      if (
        error?.response?.data?.error?.includes(
          'Cannot read properties of null'
        ) &&
        selectedType === 'INVENTORY'
      ) {
        message.error(
          'Ошибка в данных инвентаря. Возможно, есть товары без категорий или с неверными ссылками.'
        );
      } else {
        message.error(errorMessage);
      }

      console.error('Error updating report:', error);
    },
  });

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    let startDate, endDate;
    const today = dayjs();

    // Настраиваем даты в зависимости от выбранного периода
    if (value === 'day') {
      startDate = today.startOf('day');
      endDate = today.endOf('day');
    } else if (value === 'week') {
      startDate = today.startOf('week');
      endDate = today.endOf('week');
    } else if (value === 'month') {
      startDate = today.startOf('month');
      endDate = today.endOf('month');
    } else if (value === 'quarter') {
      const currentQuarter = Math.floor(today.month() / 3);
      startDate = today.month(currentQuarter * 3).startOf('month');
      endDate = today.month(currentQuarter * 3 + 2).endOf('month');
    } else if (value === 'year') {
      startDate = today.startOf('year');
      endDate = today.endOf('year');
    } else if (value === 'custom') {
      const currentRange = form.getFieldValue('dateRange');
      if (
        currentRange &&
        Array.isArray(currentRange) &&
        currentRange.length === 2
      ) {
        return; // Сохраняем текущий выбор
      }
      startDate = today.subtract(30, 'days');
      endDate = today;
    } else {
      return;
    }

    if (startDate && endDate) {
      form.setFieldsValue({ dateRange: [startDate, endDate] });
    }
  };

  // Add handler for type changes
  const handleTypeChange = (value: ReportType) => {
    setSelectedType(value);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (!shopId) {
        message.error('ID магазина не указан');
        return;
      }

      // Проверка корректности формата ID магазина (UUID)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(shopId)) {
        console.warn('ID магазина не является корректным UUID:', shopId);
        // Продолжаем, так как ID магазина может быть получен из параметров URL
      }

      // Проверяем, есть ли выбранный диапазон дат
      if (
        !values.dateRange ||
        !Array.isArray(values.dateRange) ||
        values.dateRange.length !== 2
      ) {
        message.error('Выберите диапазон дат');
        return;
      }

      // Убедимся, что даты являются корректными объектами dayjs
      const startDate = values.dateRange[0];
      const endDate = values.dateRange[1];

      if (
        !startDate ||
        !endDate ||
        !dayjs.isDayjs(startDate) ||
        !dayjs.isDayjs(endDate)
      ) {
        message.error('Неверный формат дат. Пожалуйста, выберите даты снова.');
        return;
      }

      // Генерируем имя отчета автоматически на основе типа и даты
      const reportTypeMap: Record<string, string> = {
        SALES: 'Продажи',
        INVENTORY: 'Инвентарь',
        STAFF: 'Персонал',
        FINANCIAL: 'Финансы',
        CATEGORIES: 'Категории',
        PROMOTIONS: 'Акции',
      };

      const today = new Date();
      const formattedDate = today.toLocaleDateString('ru-RU');
      const reportName = `${
        reportTypeMap[values.type] || values.type
      } (${formattedDate})`;

      // Prepare the data to be sent to the backend
      const formattedData = {
        shopId,
        name: reportName,
        type: values.type,
        format: values.format,
        period: values.period,
        // Используем форматирование дат в строки в формате ISO
        startDate: formatDateForBackend(startDate),
        endDate: formatDateForBackend(endDate),
        filters: {
          categories: [],
          products: [],
          staff: [],
          promotions: [],
        },
      };

      console.log('Отправляемые данные на сервер:', formattedData);

      if (report) {
        await updateMutation.mutateAsync({
          id: report.id.toString(),
          ...formattedData,
        });
      } else {
        await createMutation.mutateAsync(formattedData);
      }
    } catch (error) {
      console.error('Error creating/updating report:', error);
      // Выведем подробное сообщение об ошибке, если она пришла от сервера
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        const errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message;
        message.error(`Ошибка: ${errorMessage}`);
      } else {
        message.error('Ошибка при создании/обновлении отчета');
      }
    }
  };

  return (
    <Modal
      title={report ? 'Редактировать отчет' : 'Создать отчет'}
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
      okText={report ? 'Сохранить' : 'Создать'}
      cancelText="Отмена"
      width={520}
      maskClosable={false}
      destroyOnClose
      okButtonProps={{
        type: 'primary',
        style: { backgroundColor: '#1890ff', borderColor: '#1890ff' },
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {selectedType === 'INVENTORY' && (
          <Alert
            message="Внимание - отчеты по инвентарю временно недоступны"
            description="В текущей версии отчеты по инвентарю временно недоступны из-за ошибки в обработке данных. Пожалуйста, выберите другой тип отчета."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="type"
          label="Тип отчета"
          rules={[
            { required: true, message: 'Пожалуйста, выберите тип отчета' },
          ]}
        >
          <Select onChange={handleTypeChange}>
            <Option value="SALES">Продажи</Option>
            <Option value="INVENTORY">Инвентарь</Option>
            <Option value="STAFF">Персонал</Option>
            <Option value="FINANCIAL">Финансы</Option>
            <Option value="CATEGORIES">Категории</Option>
            <Option value="PROMOTIONS">Акции</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="format"
          label="Формат"
          rules={[
            { required: true, message: 'Пожалуйста, выберите формат отчета' },
          ]}
        >
          <Select>
            <Option value="pdf">PDF</Option>
            <Option value="excel">Excel</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="period"
          label="Период"
          rules={[{ required: true, message: 'Пожалуйста, выберите период' }]}
        >
          <Select onChange={handlePeriodChange}>
            <Option value="day">День</Option>
            <Option value="week">Неделя</Option>
            <Option value="month">Месяц</Option>
            <Option value="quarter">Квартал</Option>
            <Option value="year">Год</Option>
            <Option value="custom">Произвольный период</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Выберите даты"
          rules={[{ required: true, message: 'Пожалуйста, выберите даты' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            allowClear={false}
            disabled={period !== 'custom'}
            onChange={(dates) => {
              if (dates && dates.length === 2) {
                console.log(
                  'Выбраны даты:',
                  dates.map((d) => d?.format('YYYY-MM-DD'))
                );
              }
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
