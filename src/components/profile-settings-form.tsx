
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ProfileSettingsData, profileSettingsSchema, avatarPresets } from '@/lib/types';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function ProfileSettingsForm() {
  const { userProfile, updateUserProfile, isLoading } = useUserProfile();
  const { toast } = useToast();

  const form = useForm<ProfileSettingsData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      username: '',
      preferredCurrency: 'INR',
      darkModeEnabled: false,
      photoURL: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        username: userProfile.username || '',
        preferredCurrency: (userProfile.preferredCurrency as 'INR' | 'USD' | 'EUR') || 'INR',
        darkModeEnabled: userProfile.darkModeEnabled || false,
        photoURL: userProfile.photoURL || '',
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
    return (
      <Card className="animate-pulse">
        <CardContent className="h-96" />
      </Card>
    );
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account settings and preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="photoURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose Your Avatar</FormLabel>
                  <div className="flex flex-wrap gap-4 pt-2">
                    {avatarPresets.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => field.onChange(url)}
                        className={cn(
                          "relative rounded-full transition-all ring-offset-2 ring-primary hover:scale-110 active:scale-95",
                          field.value === url ? "ring-2 scale-110" : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                        )}
                      >
                        <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                          <AvatarImage src={url} />
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
