export interface Vehicle {
  id: string;
  shopId: string;
  clientId?: string;
  make: string;
  model?: string;
  year?: number;
  bodyType: string;
  engineVolume?: number;
  licensePlate: string;
  vin?: string;
  registrationCertificate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDto {
  clientId?: string;
  make: string;
  model?: string;
  year?: number;
  bodyType: string;
  engineVolume?: number;
  licensePlate: string;
  vin?: string;
  registrationCertificate?: string;
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
  registrationCertificate?: string;
  isActive?: boolean;
}
