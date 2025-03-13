import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from 'antd';
import { AuditLogs } from '../../components/manager/audit/AuditLogs';

const { Title } = Typography;

const AuditPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();

  if (!shopId) {
    return <div>Магазин не найден</div>;
  }

  return (
    <div>
      <Title level={2}>Журнал аудита</Title>
      <AuditLogs shopId={shopId} />
    </div>
  );
};

export default AuditPage;
