export interface Category {
  id: string;
  name: string;
  description?: string;
  shopId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
