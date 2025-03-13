import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { InventoryTransaction } from '@/types/inventory';
import { formatDate } from '@/utils/date';

interface SalesChartProps {
  transactions: InventoryTransaction[];
}

export function SalesChart({ transactions }: SalesChartProps) {
  const data = useMemo(() => {
    // Фильтруем только продажи
    const salesTransactions = transactions.filter((t) => t.type === 'SALE');

    // Группируем по дате
    const groupedByDate = salesTransactions.reduce((acc, transaction) => {
      const date = formatDate(transaction.createdAt);
      if (!acc[date]) {
        acc[date] = {
          date,
          amount: 0,
          count: 0,
        };
      }
      acc[date].amount += (transaction.price || 0) * transaction.quantity;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; amount: number; count: number }>);

    // Преобразуем в массив для графика
    return Object.values(groupedByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [transactions]);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#4F46E5"
            activeDot={{ r: 8 }}
            name="Сумма продаж"
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#10B981"
            name="Количество продаж"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
