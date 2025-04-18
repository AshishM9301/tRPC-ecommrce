import { create } from "zustand";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
// Remove useEffect as it's no longer needed for syncing
// import { useEffect } from "react";
import type { StateCreator } from "zustand";
import type { TRPCClientError } from "@trpc/client"; // Import for error type

// Derive RouterOutputs from AppRouter
type RouterOutputs = inferRouterOutputs<AppRouter>;
// Ensure getCart output type is correctly inferred or defined
// Make sure your `getCart` router actually returns `{ id: string, items: CartItemWithProduct[], total: number }`
type CartData = RouterOutputs["cart"]["getCart"];

// Define types based on tRPC output
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number; // Ensure this matches Prisma schema (Float/Decimal)
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  id: number;
  quantity: number;
  productId: number;
  cartId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemWithProduct extends CartItem {
  // Ensure product is potentially nullable if relations aren't guaranteed
  product: Product | null;
}

// Keep Zustand state minimal - primarily for actions and derived UI state
export interface CartState {
  // items, itemCount, total will be derived from useQuery
  isMutating: boolean; // Track if any mutation is in progress
  clientError: string | null;
}

export interface CartActions {
  _setState: (newState: Partial<CartState>) => void;
  resetCartState: () => void; // Reset client-specific state if needed
}

type CartStore = CartState & CartActions;

const initialCartState: CartState = {
  isMutating: false,
  clientError: null,
};

const cartStateCreator: StateCreator<CartStore> = (set) => ({
  ...initialCartState,
  _setState: (newState: Partial<CartState>) => set(newState),
  resetCartState: () => set(initialCartState),
});

export const useCartStore = create<CartStore>(cartStateCreator);

// Custom hook for cart operations - REFACTORED
export function useCart() {
  // Get Zustand actions/state separately
  const storeActions = useCartStore((state) => state._setState);
  const isMutating = useCartStore((state) => state.isMutating);
  const clientError = useCartStore((state) => state.clientError);
  const resetCartState = useCartStore((state) => state.resetCartState);
  const utils = api.useUtils();

  // Central query for cart data
  const cartQuery = api.cart.getCart.useQuery(undefined, {
    // Optional: Configure staleTime, refetchOnWindowFocus etc. if needed
    // staleTime: 5 * 60 * 1000, // Example: Cache for 5 mins
    // refetchOnWindowFocus: false,
  });

  // --- Mutations ---
  // Centralized options for mutations
  const mutationOptions = {
    onMutate: () => {
      storeActions({ isMutating: true, clientError: null });
    },
    onSuccess: () => {
      // Only invalidate, let components refetch as needed
      void utils.cart.getCart.invalidate();
      // Optionally reset client error on success
      // storeActions({ clientError: null });
    },
    onError: (error: TRPCClientError<AppRouter> | Error) => {
      // More specific error type
      const message =
        error instanceof Error ? error.message : "Cart operation failed";
      storeActions({ clientError: message });
      toast.error(message);
    },
    onSettled: () => {
      storeActions({ isMutating: false });
    },
  };

  const addItemMutation = api.cart.addItem.useMutation(mutationOptions);
  const updateItemMutation =
    api.cart.updateItemQuantity.useMutation(mutationOptions);
  const removeItemMutation = api.cart.removeItem.useMutation(mutationOptions);
  const clearCartMutation = api.cart.clearCart.useMutation(mutationOptions);

  // --- Actions exposed by the hook ---
  const addItem = async (
    productId: number,
    quantity: number,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => {
    try {
      // No need to manage store state directly here for items/totals
      await addItemMutation.mutateAsync({ productId, quantity });
      toast.success("Item added to cart");
      options?.onSuccess?.();
    } catch (error) {
      // Error handling is centralized in mutationOptions
      options?.onError?.(
        error instanceof Error ? error : new Error("Failed to add item"),
      );
    }
  };

  const updateItemQuantity = async (
    cartItemId: number,
    quantity: number,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => {
    if (quantity < 1) {
      // Delegate to removeItem if quantity becomes 0 or less
      await removeItem(cartItemId, options);
      return;
    }
    try {
      await updateItemMutation.mutateAsync({ cartItemId, quantity });
      toast.success("Cart updated");
      options?.onSuccess?.();
    } catch (error) {
      options?.onError?.(
        error instanceof Error ? error : new Error("Failed to update quantity"),
      );
    }
  };

  const removeItem = async (
    cartItemId: number,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => {
    try {
      await removeItemMutation.mutateAsync({ cartItemId });
      toast.success("Item removed from cart");
      options?.onSuccess?.();
    } catch (error) {
      options?.onError?.(
        error instanceof Error ? error : new Error("Failed to remove item"),
      );
    }
  };

  const clearCart = async (options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }) => {
    try {
      await clearCartMutation.mutateAsync();
      toast.success("Cart cleared");
      options?.onSuccess?.();
    } catch (error) {
      options?.onError?.(
        error instanceof Error ? error : new Error("Failed to clear cart"),
      );
    }
  };

  // --- Derived State from Query ---
  // Provide default empty array if data is not yet available
  const items = cartQuery.data?.items ?? [];

  // Calculate itemCount based on the derived items
  const itemCount = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  // Use the total from the query response if available (assuming getCart returns it)
  // Otherwise, calculate client-side as a fallback
  const total =
    cartQuery.data?.total ??
    items.reduce((sum, item) => {
      const price = item.product?.price ?? 0;
      return sum + price * (item.quantity ?? 0);
    }, 0);

  // Combine query loading state with mutation state
  const isLoading = cartQuery.isLoading || isMutating;

  // Consider initialized once the first query attempt settles (success or error)
  const isInitialized = cartQuery.isFetched; // or cartQuery.isSuccess || cartQuery.isError;

  // Prioritize query error, fallback to client mutation error
  const error = cartQuery.error?.message ?? clientError;

  return {
    // Data derived from query
    items: items as CartItemWithProduct[], // Cast needed if Prisma type differs slightly
    itemCount,
    total,
    cartId: cartQuery.data?.id,

    // State
    isLoading,
    isInitialized, // Indicates if the initial fetch has happened
    isMutating, // Indicates if a write operation is in progress
    error,

    // Actions
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,

    // Zustand store actions (if needed externally)
    _setState: storeActions,
    resetCartState,
  };
}

// CartStoreInitializer might be redundant now if useCart handles loading state well.
// Consider removing it from layout.tsx or where it's used.
export function CartStoreInitializer() {
  // This component might no longer be necessary as useCart manages fetching.
  // If kept, ensure it doesn't cause unintended side effects like multiple fetches.
  // Example: Triggering an initial fetch if not already loading
  // const { isLoading } = useCart();
  // useEffect(() => { if (!isLoading) { /* maybe trigger something? */ } }, [isLoading]);
  return null;
} 