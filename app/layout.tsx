import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { SiteHeader } from '@/components/site-header';

// Define a className instead of using the Inter font object
const fontClassName = 'font-sans'; // We'll use Tailwind's font-sans which typically maps to Inter or a similar font

export const metadata: Metadata = {
  title: 'Facebook Tools - Lead Forms & Balance Manager',
  description: 'Manage lead forms and check balances for your Facebook pages',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontClassName}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}