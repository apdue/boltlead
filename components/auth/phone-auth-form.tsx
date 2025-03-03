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

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export function PhoneAuthForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTP, setShowOTP] = React.useState(false);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  async function onPhoneSubmit(data: PhoneFormData) {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: data.phone,
      });

      if (error) throw error;

      setShowOTP(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onOTPSubmit(data: OtpFormData) {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneForm.getValues('phone'),
        token: data.otp,
        type: 'sms',
      });

      if (error) throw error;

      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (showOTP) {
    return (
      <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="otp">Enter OTP</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            disabled={isLoading}
            {...otpForm.register('otp')}
          />
          {otpForm.formState.errors.otp && (
            <p className="text-sm text-destructive">
              {otpForm.formState.errors.otp.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Verifying...
            </div>
          ) : (
            'Verify OTP'
          )}
        </Button>
        <Button
          type="button"
          variant="link"
          className="px-0"
          onClick={() => setShowOTP(false)}
        >
          Use a different phone number
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1234567890"
          disabled={isLoading}
          {...phoneForm.register('phone')}
        />
        {phoneForm.formState.errors.phone && (
          <p className="text-sm text-destructive">
            {phoneForm.formState.errors.phone.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Sending OTP...
          </div>
        ) : (
          'Send OTP'
        )}
      </Button>
    </form>
  );
} 