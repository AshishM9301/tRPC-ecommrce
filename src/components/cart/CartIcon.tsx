"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useCart } from "~/store/cartStore";

export function CartIcon() {
  const { itemCount, isLoading, isInitialized } = useCart();

  if (!isInitialized || isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/cart" aria-label={`Shopping Cart with ${itemCount} items`}>
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs">
            {itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
