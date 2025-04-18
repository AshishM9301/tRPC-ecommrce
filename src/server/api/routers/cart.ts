import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc"; // Removed unused publicProcedure
import { db } from "~/server/db";
import type { Cart, CartItem, Product } from "@prisma/client"; // Import types

// Define a type for CartItem with Product included
type CartItemWithProduct = CartItem & { product: Product | null };
// Define a type for Cart with CartItems and Products included
type CartWithDetails = Cart & { items: CartItemWithProduct[] };


export const cartRouter = createTRPCRouter({
  /**
   * Get the current user's cart, creating one if it doesn't exist.
   */
  getCart: protectedProcedure.query(async ({ ctx }) => {
    // --- FIX: Use ctx.user.userId ---
    const userId = ctx.user.userId;

    let cart: CartWithDetails | null = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true, // Include product details for each item
          },
          orderBy: { createdAt: 'asc' }, // Optional: order items
        },
      },
    });

    // Create a cart for the user if they don't have one
    // Use nullish coalescing assignment for cleaner syntax
    cart ??= await db.cart.create({
      data: { userId },
      include: {
        // --- FIX: Ensure consistency in include ---
        items: { include: { product: true }, orderBy: { createdAt: 'asc' } },
      },
    });

    // Calculate total price
    // --- FIX: Add explicit types for reduce ---
    const total = cart.items.reduce((sum: number, item: CartItemWithProduct) => {
       // Handle cases where product might be deleted or price is null/undefined
      const price = item.product?.price ?? 0; // Use Decimal if needed
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + price * quantity;
    }, 0);


    // Filter out items where the product might no longer exist
    // --- FIX: Add explicit type for filter ---
    const validItems = cart.items.filter((item: CartItemWithProduct): item is CartItem & { product: Product } => item.product !== null);

    // --- FIX: Define return type structure ---
    const resultCart: Cart & { items: (CartItem & { product: Product })[], total: number } = {
        ...cart,
        items: validItems,
        total: total,
    };

    return resultCart;
  }),

  /**
   * Add an item to the cart or update its quantity if it already exists.
   */
  addItem: protectedProcedure
    .input(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      }),
    )
    // --- FIX: Add return type ---
    .mutation(async ({ ctx, input }): Promise<CartItemWithProduct> => {
      // --- FIX: Use ctx.user.userId ---
      const userId = ctx.user.userId;
      const { productId, quantity } = input;

      // 1. Find or create the user's cart
      const cart = await db.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        // No include needed here, we fetch the item later
      });

      // 2. Check if product exists
      const product = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
      }

      // --- FIX: Use upsert for CartItem directly ---
      const upsertedItem = await db.cartItem.upsert({
         where: {
             cartId_productId: { // Use the compound unique key
                 cartId: cart.id,
                 productId: productId,
             },
         },
         create: {
             cartId: cart.id,
             productId: productId,
             quantity: quantity,
         },
         update: {
             // Use Prisma's atomic increment operation
             quantity: {
                 increment: quantity,
             },
         },
         include: { product: true }, // Include product details in the response
     });


      return upsertedItem; // Return the newly created or updated item
    }),

  /**
   * Update the quantity of a specific item in the cart.
   */
  updateItemQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.number().int(),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      }),
    )
     // --- FIX: Add return type ---
    .mutation(async ({ ctx, input }): Promise<CartItemWithProduct> => {
      // --- FIX: Use ctx.user.userId ---
      const userId = ctx.user.userId;
      const { cartItemId, quantity } = input;

      // Verify the item belongs to the user's cart before updating
      const item = await db.cartItem.findFirst({
        where: {
          id: cartItemId,
          cart: { userId: userId }, // Ensure item is in the user's cart
        },
         // No include needed for the check itself
      });

      if (!item) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart item not found or does not belong to the user."
        });
      }

      // Optional: Stock check could be added here before update if needed

      const updatedItem = await db.cartItem.update({
        where: {
           id: cartItemId,
           // Ownership already verified above
         },
        data: { quantity },
         include: { product: true }, // Include product details in response
      });

      return updatedItem;
    }),

  /**
   * Remove an item from the cart.
   */
  removeItem: protectedProcedure
    .input(
      z.object({
        cartItemId: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<CartItemWithProduct> => {
      const userId = ctx.user.userId;
      const { cartItemId } = input;

      // 1. Find the cart item and verify it belongs to the user's cart
      const cartItem = await db.cartItem.findUnique({
        where: { id: cartItemId },
        include: {
          cart: true,
          product: true,
        },
      });

      if (!cartItem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cart item not found" });
      }

      if (cartItem.cart.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to remove this item" });
      }

      // 2. Delete the cart item
      const deletedItem = await db.cartItem.delete({
        where: { id: cartItemId },
        include: { product: true },
      });

      // 3. Update cart's updatedAt timestamp
      await db.cart.update({
        where: { id: cartItem.cartId },
        data: {
          updatedAt: new Date(),
        },
      });

      return deletedItem;
    }),

  /**
   * Remove all items from the user's cart.
   */
  clearCart: protectedProcedure
   // --- FIX: Add return type ---
  .mutation(async ({ ctx }): Promise<{ success: boolean }> => {
    // --- FIX: Use ctx.user.userId ---
    const userId = ctx.user.userId;

    // Find the cart ID associated with the user
    const cart = await db.cart.findUnique({
      where: { userId },
      select: { id: true }, // Only need the cart ID
    });

    if (cart) {
         // Delete all items associated with that cart ID
        await db.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
    }
    // If no cart, nothing to clear.


    return { success: true };
  }),
}); 