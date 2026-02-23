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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ProfileSettingsData, profileSettingsSchema } from '@/lib/types';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ProfileSettingsForm() {
  const { userProfile, updateUserProfile, isLoading } = useUserProfile();
  const { toast } = useToast();

  const form = useForm<ProfileSettingsData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      username: '',
      preferredCurrency: 'INR',
      darkModeEnabled: false,
      budgetLimit: 0,
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        username: userProfile.username || '',
        preferredCurrency: (userProfile.preferredCurrency as 'INR' | 'USD' | 'EUR') || 'INR',
        darkModeEnabled: userProfile.darkModeEnabled || false,
        budgetLimit: userProfile.budgetLimit || 0,
      });
    }
  }, [userProfile, form]);

  const onSubmit = (data: ProfileSettingsData) => {
    updateUserProfile(data);
    toast({
      title: 'Settings saved!',
      description: 'Your profile has been updated.',
    });
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budgetLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Budget</FormLabel>
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
            <FormField
              control={form.control}
              name="darkModeEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Dark Mode</FormLabel>
                    <FormDescription>
                      Enable or disable dark mode for the application.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Save Changes</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
