import { create } from "zustand";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import { useAuth } from "~/context/AuthContext";
import { useEffect } from "react";

// Types
type RouterOutput = inferRouterOutputs<AppRouter>;
type CartData = RouterOutput["cart"]["getCart"];
type Product = NonNullable<CartData["items"][number]["product"]>;
type CartItem = CartData["items"][number];
type CartItemWithProduct = Omit<CartItem, "product"> & { product: Product };

interface CartState {
  items: CartItemWithProduct[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface CartActions {
  _setState: (newState: Partial<CartState>) => void;
  _recalculateTotals: (items: CartItemWithProduct[]) => void;
  clearCartClient: () => void;
  resetCart: () => void;
}

type CartStore = CartState & CartActions;

const defaultInitState: CartState = {
  items: [],
  itemCount: 0,
  total: 0,
  isLoading: false,
  isInitialized: false,
  error: null,
};

const calculateTotals = (items: CartItemWithProduct[]) => {
  const validItems = items.filter((item): item is CartItemWithProduct => Boolean(item?.product));
  const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = validItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return { itemCount, total };
};

// Create the store
export const useCartStore = create<CartStore>((set, get) => ({
  ...defaultInitState,
  _setState: (newState) => {
    const currentState = get();
    const nextState = { ...currentState, ...newState };
    
    // Only update if state has actually changed
    if (JSON.stringify(currentState) !== JSON.stringify(nextState)) {
      set(nextState);
    }
  },
  _recalculateTotals: (items) => {
    const { itemCount, total } = calculateTotals(items);
    const currentState = get();
    
    // Only update if totals have changed
    if (currentState.itemCount !== itemCount || currentState.total !== total) {
      set({ itemCount, total });
    }
  },
  clearCartClient: () => {
    set({ 
      items: [], 
      itemCount: 0, 
      total: 0, 
      error: null, 
      isInitialized: true,
      isLoading: false 
    });
  },
  resetCart: () => set(defaultInitState),
}));

// Custom hook for cart operations
export const useCart = () => {
  const { user } = useAuth();
  const cart = useCartStore();
  const utils = api.useUtils();

  // Fetch cart data
  const { data: cartData, isLoading: isCartLoading } = api.cart.getCart.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Update cart state when data changes
  useEffect(() => {
    if (!cartData) return;
    
    cart._setState({ 
      items: cartData.items as CartItemWithProduct[], 
      isInitialized: true,
      error: null 
    });
    cart._recalculateTotals(cartData.items as CartItemWithProduct[]);
  }, [cartData, cart]);

  const handleError = (message: string) => {
    cart._setState({ error: message });
    toast.error(message);
  };

  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  const addItemMutation = api.cart.addItem.useMutation({
    onMutate: () => {
      cart._setState({ isLoading: true, error: null });
    },
    onSuccess: () => {
      handleSuccess("Item added to cart");
      void utils.cart.getCart.invalidate();
    },
    onError: () => handleError("Failed to add item to cart"),
    onSettled: () => {
      cart._setState({ isLoading: false });
    }
  });

  const updateItemMutation = api.cart.updateItemQuantity.useMutation({
    onMutate: () => {
      cart._setState({ isLoading: true, error: null });
    },
    onSuccess: () => {
      handleSuccess("Cart updated");
      void utils.cart.getCart.invalidate();
    },
    onError: () => handleError("Failed to update cart"),
    onSettled: () => {
      cart._setState({ isLoading: false });
    }
  });

  const removeItemMutation = api.cart.removeItem.useMutation({
    onMutate: () => {
      cart._setState({ isLoading: true, error: null });
    },
    onSuccess: () => {
      handleSuccess("Item removed from cart");
      void utils.cart.getCart.invalidate();
    },
    onError: () => handleError("Failed to remove item from cart"),
    onSettled: () => {
      cart._setState({ isLoading: false });
    }
  });

  const clearCartMutation = api.cart.clearCart.useMutation({
    onMutate: () => {
      cart._setState({ isLoading: true, error: null });
    },
    onSuccess: () => {
      cart.clearCartClient();
      handleSuccess("Cart cleared");
      void utils.cart.getCart.invalidate();
    },
    onError: () => handleError("Failed to clear cart"),
    onSettled: () => {
      cart._setState({ isLoading: false });
    }
  });

  const addToCart = async (productId: number, quantity = 1) => {
    if (!user) {
      handleError("Please login to add items to cart");
      return;
    }
    await addItemMutation.mutateAsync({ productId, quantity });
  };

  const updateCartItem = async (cartItemId: number, quantity: number) => {
    if (!user) {
      handleError("Please login to update cart");
      return;
    }
    await updateItemMutation.mutateAsync({ cartItemId, quantity });
  };

  const removeFromCart = async (cartItemId: number) => {
    if (!user) {
      handleError("Please login to remove items from cart");
      return;
    }
    await removeItemMutation.mutateAsync({ cartItemId });
  };

  const clearCart = async () => {
    if (!user) {
      handleError("Please login to clear cart");
      return;
    }
    await clearCartMutation.mutateAsync();
  };

  return {
    ...cart,
    isLoading: cart.isLoading || isCartLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };
};