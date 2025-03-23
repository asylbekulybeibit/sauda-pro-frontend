export interface ServiceHistory {
  id: string;
  shopId: string;
  serviceTypeId: string;
  clientId: string;
  vehicleId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  createdBy: string;
  startedBy?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;

  // Relations - may be included when populated
  serviceType?: any;
  client?: any;
  vehicle?: any;
  creator?: any;
  starter?: any;
  completer?: any;
  serviceStaff?: any[];
}

export interface CreateServiceHistoryDto {
  serviceTypeId: string;
  clientId: string;
  vehicleId: string;
  staffIds: string[];
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface UpdateServiceHistoryDto {
  serviceTypeId?: string;
  clientId?: string;
  vehicleId?: string;
  staffIds?: string[];
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
  notes?: string;
}

// Дополнительная информация для отображения истории услуг
export interface ServiceHistoryWithDetails extends ServiceHistory {
  clientName?: string;
  vehicleInfo?: string;
  serviceTypeName?: string;
}
