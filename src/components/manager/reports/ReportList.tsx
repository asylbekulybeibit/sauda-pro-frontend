import { useState } from 'react';
import { Report } from '@/types/report';
import { ReportForm } from './ReportForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteReport, downloadReport } from '@/services/managerApi';
import { PencilIcon, TrashIcon, DownloadIcon } from '@heroicons/react/outline';
import { formatDate } from '@/utils/format';

interface ReportListProps {
  reports: Report[];
}

export function ReportList({ reports }: ReportListProps) {
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: downloadReport,
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отчет?')) {
      await deleteMutation.mutateAsync(id.toString());
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await downloadMutation.mutateAsync(id.toString());
      const blob = new Blob([response.data], { type: response.type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании отчета:', error);
    }
  };

  const getReportTypeText = (type: string) => {
    switch (type) {
      case 'SALES':
        return 'Продажи';
      case 'INVENTORY':
        return 'Инвентарь';
      case 'STAFF':
        return 'Персонал';
      case 'FINANCIAL':
        return 'Финансы';
      default:
        return type;
    }
  };

  const getFormatText = (format: string) => {
    switch (format) {
      case 'PDF':
        return 'PDF';
      case 'EXCEL':
        return 'Excel';
      case 'CSV':
        return 'CSV';
      default:
        return format;
    }
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
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {report.name}
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
                      onClick={() => setEditingReport(report)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(report.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <DownloadIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingReport && (
        <ReportForm
          report={editingReport}
          onClose={() => setEditingReport(null)}
        />
      )}
    </div>
  );
}
