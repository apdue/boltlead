'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof formSchema>;

export function EmailAuthForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              email_confirm: true,
            }
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user?.identities?.length === 0) {
          toast.error('This email is already registered. Please sign in instead.');
          setIsSignUp(false);
        } else {
          toast.success(
            'Please check your email to confirm your account. Check your spam folder if you don\'t see it.',
            { duration: 6000 }
          );
          // Clear the form
          form.reset();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            toast.error(
              'Please confirm your email address before signing in. Check your spam folder if you haven\'t received the confirmation email.',
              { duration: 6000 }
            );
          } else if (signInError.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            throw signInError;
          }
        } else {
          toast.success('Signed in successfully');
          router.refresh();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          disabled={isLoading}
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          disabled={isLoading}
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {isSignUp ? 'Creating account...' : 'Signing in...'}
          </div>
        ) : isSignUp ? (
          'Create account'
        ) : (
          'Sign in'
        )}
      </Button>
      <Button
        type="button"
        variant="link"
        className="px-0"
        onClick={() => setIsSignUp(!isSignUp)}
      >
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
      </Button>
    </form>
  );
} 