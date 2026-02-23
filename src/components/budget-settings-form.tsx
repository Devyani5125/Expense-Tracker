'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/use-user-profile';
import { BudgetSettingsData, budgetSettingsSchema } from '@/lib/types';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function BudgetSettingsForm() {
  const { userProfile, updateUserProfile, isLoading } = useUserProfile();
  const { toast } = useToast();

  const form = useForm<BudgetSettingsData>({
    resolver: zodResolver(budgetSettingsSchema),
    defaultValues: {
      budgetLimit: 0,
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        budgetLimit: userProfile.budgetLimit || 0,
      });
    }
  }, [userProfile, form]);

  const onSubmit = (data: BudgetSettingsData) => {
    updateUserProfile(data);
    toast({
      title: 'Budget saved!',
      description: 'Your monthly budget has been updated.',
    });
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>
          Set a monthly budget to track your spending against. This will be shown on your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="budgetLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Budget Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50000" {...field} />
                  </FormControl>
                  <FormDescription>
                    Set a monthly budget for your expenses (in your preferred currency).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save Budget</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
