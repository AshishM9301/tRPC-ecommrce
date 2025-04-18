"use client";

import Link from "next/link";
import { useAuth } from "~/context/AuthContext";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "~/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Menu,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Package,
  ShoppingBag,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { RoleName } from "@prisma/client";
import AdminNavbar from "./AdminNavbar";
import { CartIcon } from "~/components/cart/CartIcon";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/cart", label: "Cart" },
  // Add more public nav items here
];

export function Navbar() {
  const { user, loading, signOutUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success("Signed out successfully.");
      router.push("/"); // Redirect to home after signout
    } catch (err) {
      console.error("Navbar sign out error:", err);
    }
  };

  const getInitials = (email: string | null | undefined) => {
    return email ? (
      email.substring(0, 2).toUpperCase()
    ) : (
      <UserIcon className="h-4 w-4" />
    );
  };

  const renderAuthSection = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      );
    }
    if (user) {
      return (
        <div className="flex items-center gap-4">
          <CartIcon />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="text-muted-foreground text-xs leading-none">
                  {user.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/account">
                  <UserIcon className="mr-2 h-4 w-4" /> Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/account/orders">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  };

  if (pathname.startsWith("/admin")) {
    return <AdminNavbar />;
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center">
        {/* Mobile Menu */}
        <div className="mr-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="mt-6 grid gap-6 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Package className="h-6 w-6" /> {/* Site Icon */}
                  <span>Shoe Store</span>
                </Link>
                {navItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/cart"
                    className="text-muted-foreground hover:text-foreground flex items-center"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Cart
                  </Link>
                </SheetClose>
                {user && (
                  <SheetClose asChild>
                    <Link
                      href="/account/orders"
                      className="text-muted-foreground hover:text-foreground flex items-center"
                    >
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Orders
                    </Link>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Menu */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Package className="h-6 w-6" /> {/* Site Icon */}
          <span className="hidden font-bold sm:inline-block">Shoe Store</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground/80 text-foreground/60 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Section (Login/Signup or User Menu) */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {renderAuthSection()}
        </div>
      </div>
    </header>
  );
}
