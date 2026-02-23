"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Expense, Category, categories } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface ExpenseChartProps {
  expenses: Expense[];
  currency?: string;
}

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
        total: categoryTotals[cat] || 0,
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chartData.length > 0 ? (
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            width={80}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
            }}
            formatter={(value: number) => formatCurrency(value, currency)}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">No expenses for the selected period.</p>
        </div>
      )}
    </ResponsiveContainer>
  )
}
