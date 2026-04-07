"use client"

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Expense, Category, categories } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface ExpenseChartProps {
  expenses: Expense[];
  currency?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--accent))",
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) {
    return null;
  }

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, currency }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="glass-card rounded-xl p-3 shadow-2xl border-none">
            <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: data.payload.fill }}></div>
                <p className="text-xs font-black uppercase tracking-widest">{data.name}</p>
            </div>
          <p className="text-sm font-bold opacity-80">
            {formatCurrency(data.value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

export default function ExpenseChart({ expenses, currency }: ExpenseChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    const categoryTotals: { [category in Category]?: number } = {};

    categories.forEach(cat => {
      categoryTotals[cat] = 0;
    });

    expenses.forEach(expense => {
      if (categoryTotals[expense.category] !== undefined) {
        categoryTotals[expense.category]! += expense.amount;
      }
    });

    return categories
      .map(cat => ({
        name: cat,
        value: categoryTotals[cat] || 0,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  if (!mounted) return <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chartData.length > 0 ? (
        <PieChart>
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="90%"
            innerRadius="60%"
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Legend 
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                paddingTop: '20px'
            }}
          />
        </PieChart>
      ) : (
        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-primary/5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No expenses recorded yet.</p>
        </div>
      )}
    </ResponsiveContainer>
  )
}