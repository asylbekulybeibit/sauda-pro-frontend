import { useState } from 'react';
import { Category } from '@/types/product';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory } from '@/services/managerApi';
import { XIcon } from '@heroicons/react/outline';

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
  onClose: () => void;
}

export function CategoryForm({
  category,
  categories,
  onClose,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    parentId: category?.parentId || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parentId: formData.parentId ? parseInt(formData.parentId) : null,
    };

    if (category) {
      await updateMutation.mutateAsync({
        id: category.id.toString(),
        ...payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Фильтруем категории, чтобы исключить текущую категорию и ее потомков
  const availableParentCategories = categories.filter((c) => {
    if (!category) return true;
    return c.id !== category.id;
  });

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {category ? 'Редактировать категорию' : 'Создать категорию'}
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
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="parentId"
              className="block text-sm font-medium text-gray-700"
            >
              Родительская категория
            </label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Нет родительской категории</option>
              {availableParentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
              {category ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
