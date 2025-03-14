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

    if (isNaN(row.price) || row.price <= 0) {
      errors.push({
        row: rowIndex,
        field: 'price',
        message: 'Цена должна быть положительным числом',
      });
    }

    if (isNaN(row.quantity) || row.quantity < 0) {
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
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(firstSheet);

          const errors: ValidationError[] = [];
          data.forEach((row: any, index: number) => {
            errors.push(...validateRow(row, index + 1));
          });

          resolve({
            data,
            errors,
            hasErrors: errors.length > 0,
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
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
    const file = info.file.originFileObj;
    if (file) {
      try {
        const previewData = await handleFileRead(file);
        setPreview(previewData);
        setFileList([info.file]);
      } catch (error) {
        message.error('Ошибка при чтении файла');
      }
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
                    Строка {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            }
            type="error"
            showIcon
          />
        )}

        {uploading && <Progress percent={progress} />}

        {preview && !preview.hasErrors && (
          <Alert
            message="Файл проверен"
            description={`Найдено ${preview.data.length} записей`}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}

        {preview && (
          <Table
            columns={columns}
            dataSource={preview.data}
            rowKey={(record: any) => record.sku}
            scroll={{ y: 400 }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Space>
    </Card>
  );
};
