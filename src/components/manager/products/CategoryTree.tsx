import { useState } from 'react';
import { Category } from '@/types/category';
import { CategoryForm } from './CategoryForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategory } from '@/services/managerApi';
import {
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface CategoryTreeProps {
  categories: Category[];
  shopId: string;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
}

export function CategoryTree({ categories, shopId }: CategoryTreeProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
    const categoryMap = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Создаем узлы для всех категорий
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Строим дерево
    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!;
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderCategory = (category: CategoryNode, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children.length > 0;

    return (
      <div key={category.id} className="category-item">
        <div
          className="flex items-center py-2 px-4 hover:bg-gray-50"
          style={{ paddingLeft: `${level * 2 + 1}rem` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(category.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              <ChevronRightIcon
                className={`h-4 w-4 transform transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}
          <span className="flex-1 text-sm">{category.name}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingCategory(category)}
              className="p-1 text-indigo-600 hover:text-indigo-900"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="p-1 text-red-600 hover:text-red-900"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="category-children">
            {category.children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4">
        {categoryTree.length > 0 ? (
          categoryTree.map((category) => renderCategory(category))
        ) : (
          <div className="text-gray-500 text-center py-4">
            Нет доступных категорий
          </div>
        )}
      </div>

      {/* Модальное окно редактирования */}
      {editingCategory && (
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onClose={() => setEditingCategory(null)}
          shopId={shopId}
        />
      )}
    </div>
  );
}
