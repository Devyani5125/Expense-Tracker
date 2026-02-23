import { z } from 'zod';
import { UtensilsCrossed, Plane, ShoppingCart, ReceiptText, MoreHorizontal } from 'lucide-react';

export const expenseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  date: z.date(),
  category: z.enum(['Food', 'Travel', 'Shopping', 'Bills', 'Others']),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Debit Card', 'Online']),
  userId: z.string().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Others'] as const;
export type Category = (typeof categories)[number];

export const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Online'] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const categoryIcons: Record<Category, React.ElementType> = {
  Food: UtensilsCrossed,
  Travel: Plane,
  Shopping: ShoppingCart,
  Bills: ReceiptText,
  Others: MoreHorizontal,
};
