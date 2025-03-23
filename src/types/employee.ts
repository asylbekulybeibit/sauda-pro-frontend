export interface Employee {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  hireDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  hireDate?: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  hireDate?: string;
  isActive?: boolean;
}
