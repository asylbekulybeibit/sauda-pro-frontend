import React, { useEffect } from 'react';
import { Popover, Badge, List, Typography, Empty } from 'antd';
import { ExclamationTriangleIcon as ExclamationIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export const NotificationsPopover: React.FC = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  useEffect(() => {
    // Fetch notifications from API
    const fetchNotifications = async () => {
      // TODO: Replace with actual API call
      const mockNotifications: Notification[] = [];
      setNotifications(mockNotifications);
    };

    fetchNotifications();
  }, []);

  const content = (
    <div style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
      {notifications.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={
                  <>
                    <Typography.Text>{item.message}</Typography.Text>
                    <Typography.Text
                      type="secondary"
                      style={{ display: 'block' }}
                    >
                      {new Date(item.createdAt).toLocaleString()}
                    </Typography.Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Нет уведомлений" />
      )}
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight">
      <Badge count={notifications.filter((n) => !n.isRead).length}>
        <ExclamationIcon className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
      </Badge>
    </Popover>
  );
};
