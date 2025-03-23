export interface Vehicle {
  id: string;
  shopId: string;
  clientId: string;
  make: string;
  model?: string;
  year?: number;
  bodyType: string;
  engineVolume?: number;
  licensePlate: string;
  vin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDto {
  clientId: string;
  make: string;
  model?: string;
  year?: number;
  bodyType: string;
  engineVolume?: number;
  licensePlate: string;
  vin?: string;
}

export interface UpdateVehicleDto {
  clientId?: string;
  make?: string;
  model?: string;
  year?: number;
  bodyType?: string;
  engineVolume?: number;
  licensePlate?: string;
  vin?: string;
}
