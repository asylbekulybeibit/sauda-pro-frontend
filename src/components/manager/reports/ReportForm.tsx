import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Report } from '@/types/report';
import { createReport, updateReport } from '@/services/managerApi';
import { XIcon } from '@heroicons/react/outline';

interface ReportFormProps {
  report?: Report;
  onClose: () => void;
}

export function ReportForm({ report, onClose }: ReportFormProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const [formData, setFormData] = useState({
    name: report?.name || '',
    type: report?.type || 'SALES',
    format: report?.format || 'PDF',
    startDate: report?.startDate?.split('T')[0] || '',
    endDate: report?.endDate?.split('T')[0] || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      shopId: parseInt(shopId!),
    };

    if (report) {
      await updateMutation.mutateAsync({
        id: report.id.toString(),
        ...payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {report ? 'Редактировать отчет' : 'Создать отчет'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Название
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Тип отчета
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="SALES">Продажи</option>
              <option value="INVENTORY">Инвентарь</option>
              <option value="STAFF">Персонал</option>
              <option value="FINANCIAL">Финансы</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="format"
              className="block text-sm font-medium text-gray-700"
            >
              Формат
            </label>
            <select
              id="format"
              name="format"
              value={formData.format}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel</option>
              <option value="CSV">CSV</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Дата начала
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                Дата окончания
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {report ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
