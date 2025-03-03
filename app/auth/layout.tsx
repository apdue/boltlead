export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-[450px] p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
} 