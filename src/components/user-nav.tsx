
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useUser } from '@/firebase';
import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';

export function UserNav() {
  const { user } = useUser();
  const { userProfile } = useUserProfile();
  const auth = useAuth();
  const { toast } = useToast();

  const handleSignOut = () => {
    auth.signOut();
  };

  const handlePasswordReset = () => {
    if (user && user.email) {
      sendPasswordResetEmail(auth, user.email)
        .then(() => {
          toast({
            title: 'Password Reset Email Sent',
            description: `A password reset link has been sent to ${user.email}.`,
          });
        })
        .catch((error) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message,
          });
        });
    }
  };

  if (!user) {
    return null;
  }

  const displayName = userProfile?.username || user.displayName || user.email?.split('@')[0];
  const photoURL = userProfile?.photoURL || user.photoURL || '';

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-primary/20 hover:ring-4 transition-all active:scale-95">
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarImage src={photoURL} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/settings">
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onClick={handlePasswordReset} className="cursor-pointer">
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Change Password</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
