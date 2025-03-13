import { Product } from './product';

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  discount: number;
  startDate: string;
  endDate: string;
  products: Product[];
  shopId: number;
  createdAt: string;
  updatedAt: string;
}
