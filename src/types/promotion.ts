import { Product } from './product';

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  SPECIAL_PRICE = 'special_price',
}

export enum PromotionTarget {
  PRODUCT = 'product',
  CATEGORY = 'category',
  CART = 'cart',
}

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  discount: number;
  startDate: string;
  endDate: string;
  products: Product[];
  shopId: number;

  // Новые поля согласно требованиям API
  type: PromotionType;
  target: PromotionTarget;
  value: number;

  createdAt: string;
  updatedAt: string;
}
