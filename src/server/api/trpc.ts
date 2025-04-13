/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { RoleName } from "@prisma/client";
import { verifyFirebaseToken } from "~/lib/firebase/admin"; // Import token verification
import { db } from "~/server/db";

// Helper function to get user roles from DB
async function getUserRoles(userId: string): Promise<RoleName[]> {
  if (!userId) return [];
  try {
    const userRoles = await db.userRole.findMany({
      where: { userId: userId },
      select: { role: { select: { name: true } } }, // Select only role names
    });
    return userRoles.map(ur => ur.role.name);
  } catch (error) {
    console.error("Error fetching user roles in tRPC context:", error);
    return []; // Return empty array on error
  }
}

// Define the shape of the user context
interface UserContext {
  userId: string | null;
  roles: RoleName[];
}

/**
 * 1. CONTEXT
 * Creates context for incoming requests
 * - Reads the `x-firebase-token` header from the request
 * - Verifies the token using Firebase Admin SDK (on demand within procedures)
 * - Fetches user roles from the DB (on demand within procedures)
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const token = opts.headers.get('x-firebase-token');

  // Function to verify token and get user data when needed
  const getUserFromToken = async (): Promise<UserContext> => {
    if (!token) {
      return { userId: null, roles: [] };
    }
    try {
      const decodedToken = await verifyFirebaseToken(token);
      if (!decodedToken?.uid) {
        console.log("Token verification failed or UID missing");
        return { userId: null, roles: [] };
      }
      const userId = decodedToken.uid;
      const roles = await getUserRoles(userId);
      return { userId, roles };
    } catch (error) {
      console.error("Error during token verification or role fetching:", error);
      return { userId: null, roles: [] };
    }
  };

  return {
    db,
    token, // Pass the raw token if needed
    getUserFromToken, // Provide function to get user data lazily
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Middleware to enforce authentication.
 * It calls `getUserFromToken` from the context to verify the token
 * and attaches the verified user info to the context for downstream procedures.
 */
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  const user = await ctx.getUserFromToken();
  if (!user.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  return next({
    ctx: {
      ...ctx, // Keep existing context (db, token, getUserFromToken)
      // Add verified user info
      user: {
        userId: user.userId,
        roles: user.roles,
      },
    },
  });
});

/**
 * Protected procedure (requires user to be logged in)
 * Applies the authentication middleware.
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Role-based procedures factory
 * Takes allowed roles and returns a procedure that checks against verified user roles.
 */
const createRoleBasedProcedure = (allowedRoles: RoleName[]) => {
  // Apply authentication middleware first
  return protectedProcedure.use(({ ctx, next }) => {
    // ctx.user is now guaranteed to be populated by enforceUserIsAuthed middleware
    const userRoles = ctx.user.roles;
    const hasAccess = allowedRoles.some(role => userRoles.includes(role));

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `User does not have required role(s): ${allowedRoles.join(", ")}`,
      });
    }
    // No need to return modified context, user info is already there
    return next();
  });
};

// Export specific role-based procedures
export const customerProcedure = protectedProcedure; // Any logged-in user
export const sellerProcedure = createRoleBasedProcedure([RoleName.SELLER, RoleName.ADMIN, RoleName.SUPER_ADMIN]);
export const adminProcedure = createRoleBasedProcedure([RoleName.ADMIN, RoleName.SUPER_ADMIN]);
export const superAdminProcedure = createRoleBasedProcedure([RoleName.SUPER_ADMIN]);
