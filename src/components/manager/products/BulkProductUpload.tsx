import React, { useState } from 'react';
import {
  Upload,
  Button,
  Card,
  message,
  Progress,
  Table,
  Alert,
  Space,
  Select,
} from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import * as XLSX from 'xlsx';
import { bulkOperationsApi } from '@/services/bulkOperationsApi';
import type { BulkProductOperation } from '@/services/bulkOperationsApi';

interface BulkProductUploadProps {
  shopId: string;
  onSuccess: () => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface PreviewData {
  data: any[];
  errors: ValidationError[];
  hasErrors: boolean;
}

export const BulkProductUpload: React.FC<BulkProductUploadProps> = ({
  shopId,
  onSuccess,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState<'create' | 'update'>('create');

  const validateRow = (row: any, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!row.name) {
      errors.push({
        row: rowIndex,
        field: 'name',
        message: 'Название товара обязательно',
      });
    }

    if (!row.sku) {
      errors.push({
        row: rowIndex,
        field: 'sku',
        message: 'SKU обязателен',
      });
    }

    if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0) {
      errors.push({
        row: rowIndex,
        field: 'price',
        message: 'Цена должна быть положительным числом',
      });
    }

    if (
      !row.quantity ||
      isNaN(Number(row.quantity)) ||
      Number(row.quantity) < 0
    ) {
      errors.push({
        row: rowIndex,
        field: 'quantity',
        message: 'Количество должно быть неотрицательным числом',
      });
    }

    return errors;
  };

  const handleFileRead = (file: File): Promise<PreviewData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result) {
            throw new Error('Не удалось прочитать файл');
          }

          let workbook;
          if (typeof e.target.result === 'string') {
            // Если результат строка (для CSV файлов)
            workbook = XLSX.read(e.target.result, { type: 'binary' });
          } else {
            // Если результат ArrayBuffer (для Excel файлов)
            const data = new Uint8Array(e.target.result as ArrayBuffer);
            workbook = XLSX.read(data, { type: 'array' });
          }

          if (!workbook.SheetNames.length) {
            throw new Error('Файл не содержит листов');
          }

          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            raw: true,
            defval: null, // Значение по умолчанию для пустых ячеек
          });

          if (!jsonData.length) {
            throw new Error('Файл не содержит данных');
          }

          const errors: ValidationError[] = [];
          jsonData.forEach((row: any, index: number) => {
            errors.push(...validateRow(row, index + 1));
          });

          resolve({
            data: jsonData,
            errors,
            hasErrors: errors.length > 0,
          });
        } catch (error) {
          console.error('Error reading file:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file); // Изменили метод чтения
    });
  };

  const handleUpload = async () => {
    if (!preview || preview.hasErrors) {
      message.error('Пожалуйста, исправьте ошибки перед загрузкой');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const bulkOperation: BulkProductOperation = {
        operation: uploadType,
        products: preview.data.map((item) => ({
          name: item.name,
          sku: item.sku,
          price: Number(item.price),
          quantity: Number(item.quantity),
          category: item.category,
          description: item.description,
        })),
      };

      const result = await bulkOperationsApi.uploadProducts(
        shopId,
        bulkOperation
      );

      if (result.success) {
        message.success(
          `Обработано ${result.processed} товаров (${result.failed} ошибок)`
        );
        setFileList([]);
        setPreview(null);
        setProgress(100);
        onSuccess();
      } else {
        message.error('Произошли ошибки при обработке файла');
      }
    } catch (error) {
      message.error('Ошибка при загрузке товаров');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (info: any) => {
    const { file, fileList } = info;
    setFileList(fileList);

    if (file.status !== 'removed') {
      try {
        const previewData = await handleFileRead(file.originFileObj);
        setPreview(previewData);

        if (previewData.hasErrors) {
          message.warning(
            'В файле обнаружены ошибки. Пожалуйста, исправьте их перед загрузкой.'
          );
        } else {
          message.success('Файл успешно проверен и готов к загрузке');
        }
      } catch (error) {
        console.error('File processing error:', error);
        message.error(
          'Ошибка при чтении файла. Убедитесь, что файл соответствует шаблону.'
        );
        setFileList([]);
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await bulkOperationsApi.downloadTemplate('products');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Ошибка при скачивании шаблона');
    }
  };

  const columns = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Цена', dataIndex: 'price', key: 'price' },
    { title: 'Количество', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Категория', dataIndex: 'category', key: 'category' },
    { title: 'Описание', dataIndex: 'description', key: 'description' },
  ];

  return (
    <Card title="Массовая загрузка товаров">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Select
            value={uploadType}
            onChange={setUploadType}
            style={{ width: 200 }}
          >
            <Select.Option value="create">Создание новых товаров</Select.Option>
            <Select.Option value="update">
              Обновление существующих
            </Select.Option>
          </Select>

          <Upload
            accept=".xlsx,.xls,.csv"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Выбрать файл</Button>
          </Upload>

          <Button
            type="primary"
            onClick={handleUpload}
            disabled={!preview || preview.hasErrors || uploading}
            loading={uploading}
          >
            Загрузить
          </Button>

          <Button onClick={handleDownloadTemplate} icon={<FileExcelOutlined />}>
            Скачать шаблон
          </Button>
        </Space>

        {preview?.hasErrors && (
          <Alert
            message="Найдены ошибки"
            description={
              <ul>
                {preview.errors.map((error, index) => (
                  <li key={index}>
                    Строка {error.row}: {error.message} (поле: {error.field})
                  </li>
                ))}
              </ul>
            }
            type="error"
            showIcon
          />
        )}

        {preview && !preview.hasErrors && (
          <Alert
            message="Файл готов к загрузке"
            description={`Найдено ${preview.data.length} товаров`}
            type="success"
            showIcon
          />
        )}

        {uploading && <Progress percent={progress} />}

        {preview && (
          <Table
            dataSource={preview.data}
            columns={columns}
            size="small"
            scroll={{ x: true }}
            pagination={{ pageSize: 5 }}
          />
        )}
      </Space>
    </Card>
  );
};
