import { z } from "zod";
import { RoleName } from "@prisma/client";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure, // Keep for reference, but might not be used directly here
  sellerProcedure,    // Sellers/Admins can manage products
  adminProcedure,     // Admins/SuperAdmins have full control
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Input schema for creating/updating products
const ProductInput = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  price: z.number().positive("Price must be a positive number"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')), // Optional but validate if present
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
});

const ProductUpdateInput = ProductInput.partial().extend({
  id: z.number().int().positive(), // Require ID for updates
});

export const productRouter = createTRPCRouter({
  // Procedure to add a new product (Seller or Admin role required)
  add: sellerProcedure // Use sellerProcedure (includes ADMIN, SUPER_ADMIN)
    .input(ProductInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId; // Guaranteed by sellerProcedure

      const product = await ctx.db.product.create({
        data: {
          ...input,
          imageUrl: input.imageUrl ?? null, // Use ?? instead of ||
          createdById: userId,
        },
      });
      console.log(`Product created: ${product.id} by user ${userId}`);
      return product;
    }),

  // Procedure to list products
  // Changed back to publicProcedure for general listing on homepage/product pages
  list: publicProcedure // Use publicProcedure for unauthenticated access
    .query(async ({ ctx }) => {
      // Fetch only fields needed for public display (e.g., ProductCard)
      // Avoid fetching sensitive or admin-only data here
      const products = await ctx.db.product.findMany({
        orderBy: { createdAt: 'desc' },
        select: { // Explicitly select fields needed for public cards
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          stock: true, // Might be useful to show if needed, otherwise remove
          createdAt: true, // Optional
          // Do NOT include createdById unless needed publicly
        }
        // TODO: Implement filtering/pagination later if needed for public lists
      });
      return products;
    }),

  // Procedure to get a single product by ID (Publicly accessible)
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
      });
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      return product;
    }),

  // Procedure to update a product (Admin or Seller who owns the product)
  update: sellerProcedure // Use sellerProcedure (includes ADMIN, SUPER_ADMIN)
    .input(ProductUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      const userRoles = ctx.user.roles;
      const { id, ...updateData } = input;

      // 1. Find the product
      const existingProduct = await ctx.db.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // 2. Check permissions: Admins/SuperAdmins can update any product,
      //    Sellers can only update their own products.
      const isAdminOrSuperAdmin = userRoles.includes(RoleName.ADMIN) || userRoles.includes(RoleName.SUPER_ADMIN);
      const isOwner = existingProduct.createdById === userId;

      if (!isAdminOrSuperAdmin && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to update this product" });
      }

      // 3. Perform the update
      const updatedProduct = await ctx.db.product.update({
        where: { id },
        data: {
          ...updateData,
          imageUrl: updateData.imageUrl ?? null, // Use ?? instead of ||
        },
      });

      console.log(`Product updated: ${updatedProduct.id} by user ${userId}`);
      return updatedProduct;
    }),

  // Procedure to delete a product (Admin or Seller who owns the product)
  delete: sellerProcedure // Use sellerProcedure (includes ADMIN, SUPER_ADMIN)
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      const userRoles = ctx.user.roles;
      const { id } = input;

      // 1. Find the product
      const existingProduct = await ctx.db.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // 2. Check permissions (same as update)
      const isAdminOrSuperAdmin = userRoles.includes(RoleName.ADMIN) || userRoles.includes(RoleName.SUPER_ADMIN);
      const isOwner = existingProduct.createdById === userId;

      if (!isAdminOrSuperAdmin && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to delete this product" });
      }

      // 3. Perform the delete
      // Consider related OrderItems - Prisma schema onDelete: Cascade might handle this
      // but be aware of implications. Add check if needed.
      await ctx.db.product.delete({
        where: { id },
      });

      console.log(`Product deleted: ${id} by user ${userId}`);
      return { success: true };
    }),
}); 