export interface ProjectStats {
  total: number;
  active: number;
  byType: {
    shop: number;
    warehouse: number;
    point_of_sale: number;
  };
}

export interface UserStats {
  total: number;
  active: number;
  byRole: {
    owner: number;
    manager: number;
    cashier: number;
  };
  superadmins: number;
}

export interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  byRole: {
    owner: number;
    manager: number;
    cashier: number;
  };
}

export interface DashboardStats {
  projects: ProjectStats;
  users: UserStats;
  invites: InviteStats;
  recentActions: {
    id: string;
    action: string;
    timestamp: string;
    user: {
      id: string;
      name?: string;
      phone: string;
    };
  }[];
}
