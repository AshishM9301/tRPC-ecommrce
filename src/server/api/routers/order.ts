import { z } from "zod";
import { OrderStatus, RoleName } from "@prisma/client";
import {
  createTRPCRouter,
  publicProcedure,   // Potentially for checking order status by ID publicly?
  customerProcedure, // Customers create orders and view their own
  sellerProcedure,   // Sellers view orders containing their products
  adminProcedure,    // Admins/SuperAdmins view all orders
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Input schema for creating an order
const OrderItemInput = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be positive"),
});

const CreateOrderInput = z.object({
  items: z.array(OrderItemInput).min(1, "Order must contain at least one item"),
  // Add other fields like shipping address if needed later
});

export const orderRouter = createTRPCRouter({
  // Procedure for customers to create an order
  create: customerProcedure
    .input(CreateOrderInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      const { items } = input;

      // 1. Fetch product details for validation and price calculation
      const productIds = items.map(item => item.productId);
      const products = await ctx.db.product.findMany({
        where: { id: { in: productIds } },
      });

      // Check if all products were found
      if (products.length !== productIds.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "One or more products not found" });
      }

      let totalAmount = 0;
      // Explicitly type the array for Prisma createMany input
      const orderItemsData: { productId: number; quantity: number; price: number }[] = [];

      // 2. Validate stock and calculate total
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        // Should always find product due to check above, but check anyway
        if (!product) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Product ID ${item.productId} not found after initial fetch.` });
        }

        if (product.stock < item.quantity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Insufficient stock for product: ${product.name}` });
        }

        totalAmount += product.price * item.quantity;
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price, // Store price at time of order
        });
      }

      // 3. Use a transaction to create order, items, and update stock
      try {
        const createdOrder = await ctx.db.$transaction(async (tx) => {
          // a. Create the Order
          const order = await tx.order.create({
            data: {
              userId: userId,
              totalAmount: totalAmount,
              status: OrderStatus.PENDING, // Initial status
              orderItems: {
                createMany: {
                  data: orderItemsData,
                },
              },
            },
            include: { orderItems: true } // Include items in the result
          });

          // b. Update stock for each product
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
              },
            });
          }

          return order;
        });

        console.log(`Order created: ${createdOrder.id} by user ${userId}`);
        return createdOrder;
      } catch (error) {
        console.error("Order creation transaction failed:", error);
        // Throw a generic error, or could inspect error type
        if (error instanceof TRPCError) throw error; // Re-throw specific TRPC errors (like stock check failure if run inside tx)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create order due to a transaction error." });
      }
    }),

  // Procedure for a customer to list their own orders
  listByUser: customerProcedure
    // TODO: Add pagination
    .query(async ({ ctx }) => {
      const userId = ctx.user.userId;
      const orders = await ctx.db.order.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, imageUrl: true }
              }
            }
          }
        }
        // Add pagination later
      });
      return orders;
    }),

  // Procedure for Admins/SuperAdmins to list all orders
  listAll: adminProcedure
    // TODO: Add pagination, filtering by status/user
    .query(async ({ ctx }) => {
      const orders = await ctx.db.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { // Include necessary details
          user: { select: { id: true, email: true, name: true } },
          orderItems: {
            include: {
              product: { select: { id: true, name: true } }
            }
          }
        }
        // Add pagination later
      });
      return orders;
    }),

  // Procedure for Sellers to list orders containing their products
  listBySeller: sellerProcedure
    // TODO: Add pagination
    .query(async ({ ctx }) => {
      const sellerId = ctx.user.userId;

      const orders = await ctx.db.order.findMany({
        where: {
          // Find orders where at least one orderItem has a product created by this seller
          orderItems: {
            some: {
              product: {
                createdById: sellerId,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true } }, // Show who ordered
          orderItems: {
            where: { // Only include items created by this seller in the nested list
              product: {
                createdById: sellerId,
              },
            },
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
        // Add pagination later
      });
      return orders;
    }),

    // Potential future: getOrderById (needs permission checks based on role/ownership)
}); 