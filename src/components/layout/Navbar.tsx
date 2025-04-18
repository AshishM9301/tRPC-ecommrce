import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-background border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          MyApp
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Products
          </Link>
          {/* Add other nav links here */}
          <Link href="/admin/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Admin (Test Link)
          </Link>
          {/* Add Login/Logout button later */}
        </div>
      </div>
    </nav>
  );
} 