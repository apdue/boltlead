'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Lead Forms Manager
      </Link>
      <Link
        href="/balance-checker"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/balance-checker" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Balance Checker
      </Link>
    </nav>
  );
} 