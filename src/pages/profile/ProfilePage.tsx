import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/services/api';
import { UserRole } from '@/store/roleStore';
import { RoleIcon } from '@/components/RoleIcon';
import PendingInvites from '@/components/invites/PendingInvites';

interface Profile {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isSuperAdmin: boolean;
  roles: UserRole[];
}

export const ProfilePage = () => {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (error instanceof Error) {
    return <div>Ошибка: {error.message}</div>;
  }

  if (!profile) {
    return <div>Профиль не найден</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Профиль</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Личные данные</h2>
        <div className="space-y-4">
          <div>
            <label className="font-medium">Телефон:</label>
            <p>{profile.phone}</p>
          </div>
          <div>
            <label className="font-medium">Имя:</label>
            <p>{profile.firstName || 'Не указано'}</p>
          </div>
          <div>
            <label className="font-medium">Фамилия:</label>
            <p>{profile.lastName || 'Не указана'}</p>
          </div>
          <div>
            <label className="font-medium">Email:</label>
            <p>{profile.email || 'Не указан'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Мои проекты</h2>
        {profile.isSuperAdmin && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2">
              <RoleIcon role="superadmin" />
              <span>Администратор системы</span>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {profile.roles.map((role) => (
            <div key={role.id} className="p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-2">
                <RoleIcon role={role.role} />
                <span>
                  {role.shop.name} ({role.shop.type})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Приглашения</h2>
        <PendingInvites />
      </div>
    </div>
  );
};

export default ProfilePage;
