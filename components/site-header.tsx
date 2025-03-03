'use client';

import { MainNav } from '@/components/main-nav';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function SiteHeader() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between space-x-4 sm:space-x-0">
        <MainNav />
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
} 