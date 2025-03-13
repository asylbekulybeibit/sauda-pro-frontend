import React, { useState } from 'react';
import { Card, DatePicker, Select, Input, Space, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { FixedSizeList as List } from 'react-window';
import dayjs from 'dayjs';
import { auditApi } from '../../../api/auditApi';
import { AuditActionType, AuditEntityType } from '../../../types/audit';
import { useWindowSize } from '../../../hooks/useWindowSize';

const { RangePicker } = DatePicker;

interface AuditLogsProps {
  shopId: string;
}

const ROW_HEIGHT = 54;
const HEADER_HEIGHT = 55;

export const AuditLogs: React.FC<AuditLogsProps> = ({ shopId }) => {
  const { height: windowHeight } = useWindowSize();
  const [searchParams, setSearchParams] = useState({
    startDate: '',
    endDate: '',
    action: undefined as AuditActionType | undefined,
    entityType: undefined as AuditEntityType | undefined,
    entityId: '',
    userId: '',
    skip: 0,
    take: 50,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', shopId, searchParams],
    queryFn: () => auditApi.searchLogs(shopId, searchParams),
  });

  const renderRow = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = data?.items[index];
    if (!item) return null;

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          borderBottom: '1px solid #f0f0f0',
          padding: '8px 16px',
        }}
      >
        <div style={{ flex: 1 }}>
          {dayjs(item.createdAt).format('DD.MM.YYYY HH:mm:ss')}
        </div>
        <div style={{ flex: 1 }}>{item.action}</div>
        <div style={{ flex: 1 }}>{item.entityType}</div>
        <div style={{ flex: 1 }}>{item.entityId}</div>
        <div style={{ flex: 2 }}>{item.description}</div>
        <div style={{ flex: 1 }}>{item.user?.email}</div>
      </div>
    );
  };

  const handleSearch = () => {
    setSearchParams({ ...searchParams, skip: 0 });
  };

  const handleReset = () => {
    setSearchParams({
      startDate: '',
      endDate: '',
      action: undefined,
      entityType: undefined,
      entityId: '',
      userId: '',
      skip: 0,
      take: 50,
    });
  };

  const tableHeight = windowHeight ? windowHeight - 300 : 600; // Оставляем место для фильтров и отступов

  return (
    <Card title="Журнал аудита">
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setSearchParams({
                  ...searchParams,
                  startDate: dates[0]?.toISOString() || '',
                  endDate: dates[1]?.toISOString() || '',
                });
              }
            }}
          />
          <Select
            style={{ width: 200 }}
            placeholder="Тип действия"
            allowClear
            onChange={(value) =>
              setSearchParams({ ...searchParams, action: value })
            }
            options={Object.values(AuditActionType).map((type) => ({
              label: type,
              value: type,
            }))}
          />
          <Select
            style={{ width: 200 }}
            placeholder="Тип объекта"
            allowClear
            onChange={(value) =>
              setSearchParams({ ...searchParams, entityType: value })
            }
            options={Object.values(AuditEntityType).map((type) => ({
              label: type,
              value: type,
            }))}
          />
          <Input
            placeholder="ID объекта"
            style={{ width: 200 }}
            onChange={(e) =>
              setSearchParams({ ...searchParams, entityId: e.target.value })
            }
          />
          <Button type="primary" onClick={handleSearch}>
            Поиск
          </Button>
          <Button onClick={handleReset}>Сброс</Button>
        </Space>
      </Space>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              padding: '8px 16px',
              background: '#fafafa',
              fontWeight: 'bold',
            }}
          >
            <div style={{ flex: 1 }}>Дата</div>
            <div style={{ flex: 1 }}>Действие</div>
            <div style={{ flex: 1 }}>Тип объекта</div>
            <div style={{ flex: 1 }}>ID объекта</div>
            <div style={{ flex: 2 }}>Описание</div>
            <div style={{ flex: 1 }}>Пользователь</div>
          </div>
          <List
            height={tableHeight}
            itemCount={data?.items.length || 0}
            itemSize={ROW_HEIGHT}
            width="100%"
          >
            {renderRow}
          </List>
          {data?.items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Нет данных
            </div>
          )}
        </>
      )}
    </Card>
  );
};
