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
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, currency }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
            <div className="flex items-center gap-2">
                <div style={{width: 10, height: 10, backgroundColor: data.payload.fill, borderRadius: '50%'}}></div>
                <p className="text-sm font-bold">{data.name}</p>
            </div>
          <p className="text-sm text-muted-foreground pl-4">
            {formatCurrency(data.value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

export default function ExpenseChart({ expenses, currency }: ExpenseChartProps) {
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
            outerRadius={100}
            innerRadius={60}
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend 
            iconSize={10} 
            wrapperStyle={{
                fontSize: '0.8rem',
            }}
          />
        </PieChart>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">No expenses for the selected period.</p>
        </div>
      )}
    </ResponsiveContainer>
  )
}
