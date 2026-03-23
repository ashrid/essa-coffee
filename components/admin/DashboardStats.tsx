import { formatPrice } from "@/lib/utils";

interface DashboardStatsProps {
  newOrdersCount: number;
  todayRevenue: number;
}

export function DashboardStats({ newOrdersCount, todayRevenue }: DashboardStatsProps) {
  const stats = [
    {
      label: "New Orders",
      value: newOrdersCount,
      color: "bg-blue-50 border-blue-100",
      valueColor: "text-blue-700",
    },
    {
      label: "Today's Revenue",
      value: formatPrice(todayRevenue),
      color: "bg-forest-50 border-forest-100",
      valueColor: "text-forest-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map(({ label, value, color, valueColor }) => (
        <div key={label} className={`rounded-lg border p-4 ${color}`}>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
