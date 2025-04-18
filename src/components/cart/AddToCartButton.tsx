"use client";

import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Loader2, ShoppingCart } from "lucide-react";

interface AddToCartButtonProps {
  productId: number;
  quantity?: number;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
}

export function AddToCartButton({
  productId,
  quantity = 1,
  className,
  buttonText = "Add to Cart",
  showIcon = true,
}: AddToCartButtonProps) {
  const utils = api.useUtils();
  const addItemMutation = api.cart.addItem.useMutation({
    onSuccess: (data) => {
      toast.success(`"${data?.product?.name ?? "Item"}" added to your cart!`);
      void utils.cart.getCart.invalidate();
    },
    onError: (error) => {
      console.error("Failed to add item:", error);
      toast.error(
        error.data?.code === "BAD_REQUEST"
          ? error.message
          : "Failed to add item to cart. Please try again.",
      );
    },
  });

  const handleAddToCart = () => {
    if (quantity < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }
    if (addItemMutation.isPending) return;
    addItemMutation.mutate({ productId, quantity });
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={addItemMutation.isPending}
      className={className}
      aria-label={buttonText}
    >
      {addItemMutation.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <ShoppingCart className="mr-2 h-4 w-4" />
      ) : null}
      {buttonText}
    </Button>
  );
}
