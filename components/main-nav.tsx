'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/"
          className={cn(
            'inline-flex h-16 w-full items-center justify-center rounded-lg bg-muted px-6 font-medium transition-colors hover:bg-muted/80 hover:text-primary',
            pathname === '/' &&
              'bg-primary/10 text-primary hover:bg-primary/20'
          )}
        >
          Lead Forms Manager
        </Link>
        <Link
          href="/balance-checker"
          className={cn(
            'inline-flex h-16 w-full items-center justify-center rounded-lg bg-muted px-6 font-medium transition-colors hover:bg-muted/80 hover:text-primary',
            pathname === '/balance-checker' &&
              'bg-primary/10 text-primary hover:bg-primary/20'
          )}
        >
          Balance Checker
        </Link>
      </div>
    </nav>
  );
} 