export enum LabelType {
  PRICE_TAG = 'price_tag', // Ценник
  BARCODE = 'barcode', // Этикетка со штрих-кодом
  INFO = 'info', // Информационная этикетка
  SHELF = 'shelf', // Полочный ценник
}

export enum LabelSize {
  SMALL = 'small', // 58x40 мм
  MEDIUM = 'medium', // 58x60 мм
  LARGE = 'large', // 58x80 мм
  CUSTOM = 'custom', // Пользовательский размер
}

export interface LabelElement {
  type: 'text' | 'barcode' | 'qr' | 'image';
  x: number;
  y: number;
  value: string;
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    width?: number;
    height?: number;
    [key: string]: any;
  };
}

export interface LabelTemplate {
  id: string;
  name: string;
  type: LabelType;
  size: LabelSize;
  template: {
    width: number;
    height: number;
    elements: LabelElement[];
  };
  isActive: boolean;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateLabelsRequest {
  shopId: string;
  templateId: string;
  products: {
    productId: string;
    quantity: number;
  }[];
}
