import { RoleType } from '@/store/roleStore';

interface RoleIconProps {
  role: RoleType | 'superadmin';
}

export function RoleIcon({ role }: RoleIconProps) {
  switch (role) {
    case 'superadmin':
      return <span>👑</span>;
    case 'owner':
      return <span>👔</span>;
    case 'manager':
      return <span>👨‍💼</span>;
    case 'cashier':
      return <span>💰</span>;
    default:
      return null;
  }
}
