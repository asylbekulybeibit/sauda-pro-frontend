import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';

function SalesPage() {
  const { shopId } = useParams<{ shopId: string }>();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Продажи</h1>
      </div>
      {/* TODO: Implement sales management */}
    </div>
  );
}

export default SalesPage;
