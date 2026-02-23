import { z } from 'zod';
import { UtensilsCrossed, Plane, ShoppingCart, ReceiptText, MoreHorizontal, BookOpen } from 'lucide-react';

export const expenseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  date: z.date(),
  category: z.enum(['Food', 'Travel', 'Shopping', 'Bills', 'Others', 'Education']),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Debit Card', 'Online']),
  userId: z.string().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Others', 'Education'] as const;
export type Category = (typeof categories)[number];

export const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Online'] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const categoryIcons: Record<Category, React.ElementType> = {
  Food: UtensilsCrossed,
  Travel: Plane,
  Shopping: ShoppingCart,
  Bills: ReceiptText,
  Education: BookOpen,
  Others: MoreHorizontal,
};

// Based on docs/backend.json
export const userProfileSchema = z.object({
    id: z.string(),
    username: z.string().optional(),
    email: z.string().email().optional(),
    preferredCurrency: z.string().default('INR'),
    darkModeEnabled: z.boolean().default(false),
    budgetLimit: z.number().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
  });
  
  export type UserProfile = z.infer<typeof userProfileSchema>;
  
  export const profileSettingsSchema = z.object({
    username: z.string().max(50).optional(),
    preferredCurrency: z.enum(['INR', 'USD', 'EUR']),
    darkModeEnabled: z.boolean(),
    budgetLimit: z.coerce.number().min(0, 'Budget must be a positive number.').optional(),
  });
  
  export type ProfileSettingsData = z.infer<typeof profileSettingsSchema>;
