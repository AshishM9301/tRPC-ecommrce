import { create } from "zustand";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import { useEffect } from "react";
import type { StateCreator } from "zustand";

// Derive RouterOutputs from AppRouter
type RouterOutputs = inferRouterOutputs<AppRouter>;
type CartWithItems = RouterOutputs["cart"]["getCart"];

// Define types based on tRPC output
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
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
  product: Product | null;
}

export interface CartState {
  items: CartItemWithProduct[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface CartActions {
  _recalculateTotals: (items: CartItemWithProduct[]) => void;
  _setState: (newState: Partial<CartState>) => void;
  clearCartClient: () => void;
  resetCart: () => void;
}

type CartStore = CartState & CartActions;

const cartStateCreator: StateCreator<CartStore> = (set, get) => ({
  // Initial state
  items: [],
  itemCount: 0,
  total: 0,
  isLoading: false,
  isInitialized: false,
  error: null,

  _setState: (newState: Partial<CartState>) => set(newState),

  _recalculateTotals: (items: CartItemWithProduct[]) => {
    const validItems = items?.filter(Boolean) ?? [];
    const itemCount = validItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    const total = validItems.reduce((sum, item) => {
      const price = item.product?.price ?? 0;
      return sum + price * (item.quantity ?? 0);
    }, 0);
    set({ itemCount, total });
  },

  clearCartClient: () => {
    set({ items: [], itemCount: 0, total: 0, error: null, isInitialized: true });
  },

  resetCart: () => {
    set({
      items: [],
      itemCount: 0,
      total: 0,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  },
});

export const useCartStore = create<CartStore>(cartStateCreator);

// Custom hook for cart operations
export function useCart() {
  const store = useCartStore();
  const utils = api.useUtils();
  
  const cartQuery = api.cart.getCart.useQuery(undefined, {
    enabled: !store.isInitialized,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  });

  const addItemMutation = api.cart.addItem.useMutation({
    onSuccess: () => {
      void utils.cart.getCart.invalidate();
      void cartQuery.refetch();
    },
  });

  const updateItemMutation = api.cart.updateItemQuantity.useMutation({
    onSuccess: () => {
      void utils.cart.getCart.invalidate();
      void cartQuery.refetch();
    },
  });

  const removeItemMutation = api.cart.removeItem.useMutation({
    onSuccess: () => {
      void utils.cart.getCart.invalidate();
      void cartQuery.refetch();
    },
  });

  const clearCartMutation = api.cart.clearCart.useMutation({
    onSuccess: () => {
      void utils.cart.getCart.invalidate();
      void cartQuery.refetch();
    },
  });

  useEffect(() => {
    if (!cartQuery.isLoading && cartQuery.data) {
      store._setState({
        items: cartQuery.data.items,
        isInitialized: true,
        isLoading: false,
      });
      store._recalculateTotals(cartQuery.data.items);
    }
  }, [cartQuery.data, cartQuery.isLoading]);

  const addItem = async (
    productId: number,
    quantity: number,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void }
  ) => {
    try {
      store._setState({ isLoading: true });
      const newItem = await addItemMutation.mutateAsync({ productId, quantity });
      const currentItems = store.items;
      const updatedItems = [...currentItems, newItem];
      store._recalculateTotals(updatedItems);
      store._setState({ items: updatedItems, isLoading: false });
      toast.success("Item added to cart");
      options?.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add item";
      store._setState({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const updateItemQuantity = async (
    cartItemId: number,
    quantity: number,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void }
  ) => {
    if (quantity < 1) {
      await removeItem(cartItemId, options);
      return;
    }
    try {
      store._setState({ isLoading: true });
      const updatedItem = await updateItemMutation.mutateAsync({ cartItemId, quantity });
      const currentItems = store.items;
      const newItems = currentItems.map((item: CartItemWithProduct) =>
        item.id === cartItemId ? updatedItem : item
      );
      store._recalculateTotals(newItems);
      store._setState({ items: newItems, isLoading: false });
      toast.success("Cart updated");
      options?.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update quantity";
      store._setState({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const removeItem = async (
    cartItemId: number,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void }
  ) => {
    try {
      store._setState({ isLoading: true });
      await removeItemMutation.mutateAsync({ cartItemId });
      const currentItems = store.items;
      const newItems = currentItems.filter((item: CartItemWithProduct) => item.id !== cartItemId);
      store._recalculateTotals(newItems);
      store._setState({ items: newItems, isLoading: false });
      toast.success("Item removed from cart");
      options?.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove item";
      store._setState({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const clearCart = async () => {
    try {
      store._setState({ isLoading: true });
      await clearCartMutation.mutateAsync();
      store._setState({ items: [], itemCount: 0, total: 0, isLoading: false });
      toast.success("Cart cleared");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clear cart";
      store._setState({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
    }
  };

  return {
    ...store,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    isLoading: store.isLoading || cartQuery.isLoading,
    error: store.error ?? cartQuery.error?.message,
  };
}

export function CartStoreInitializer() {
  const { data: cartData, isLoading } = api.cart.getCart.useQuery(undefined, {
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const store = useCartStore();

  useEffect(() => {
    if (!isLoading && cartData) {
      store._setState({
        items: cartData.items,
        isInitialized: true,
        isLoading: false,
      });
      store._recalculateTotals(cartData.items);
    }
  }, [cartData, isLoading, store]);

  return null;
}