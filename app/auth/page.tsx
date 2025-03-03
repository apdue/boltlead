'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailAuthForm } from '@/components/auth/email-auth-form';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { PhoneAuthForm } from '@/components/auth/phone-auth-form';
import Link from 'next/link';

export default function AuthenticationPage() {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Choose your preferred sign in method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <EmailAuthForm />
          </TabsContent>
          <TabsContent value="google" className="flex justify-center">
            <GoogleAuthButton />
          </TabsContent>
          <TabsContent value="phone">
            <PhoneAuthForm />
          </TabsContent>
        </Tabs>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </div>
      </CardContent>
    </Card>
  );
} 