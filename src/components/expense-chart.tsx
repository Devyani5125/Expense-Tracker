"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Expense, Category } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface ExpenseChartProps {
  expenses: Expense[];
}

export default function ExpenseChart({ expenses }: ExpenseChartProps) {
  const chartData = React.useMemo(() => {
    const dataByDate: { [date: string]: Record<Category, number> & { date: string } } = {};

    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedExpenses.forEach(expense => {
      const dateStr = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = { date: dateStr, Food: 0, Travel: 0, Shopping: 0, Bills: 0, Others: 0, Education: 0 };
      }
      dataByDate[dateStr][expense.category] += expense.amount;
    });

    return Object.values(dataByDate);
  }, [expenses]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chartData.length > 0 ? (
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend
            iconSize={10}
            wrapperStyle={{
                paddingTop: '20px',
            }}
          />
          <Bar dataKey="Food" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Travel" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Shopping" stackId="a" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Bills" stackId="a" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Others" stackId="a" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Education" stackId="a" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">No data for the selected period.</p>
        </div>
      )}
    </ResponsiveContainer>
  )
}
