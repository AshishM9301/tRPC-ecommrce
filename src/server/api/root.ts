// import { postRouter } from "~/server/api/routers/post";
import { userRouter } from "~/server/api/routers/user";
import { productRouter } from "~/server/api/routers/product";
// import { orderRouter } from "~/server/api/routers/order"; // Assuming you might recreate/modify this later based on schema changes
import { cartRouter } from "~/server/api/routers/cart"; // Import the new cart router
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // post: postRouter,
  user: userRouter,
  product: productRouter,
  // order: orderRouter, // Keep or modify based on your needs
  cart: cartRouter, // Add the cart router
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
