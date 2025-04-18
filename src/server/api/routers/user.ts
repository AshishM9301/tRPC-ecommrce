import { z } from "zod";
import { RoleName } from "@prisma/client";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  superAdminProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getUser } from "~/lib/firebase/admin"; // Import helper to get Firebase user data

// Input schema for assigning roles
const RoleAssignmentInput = z.object({
  userId: z.string().min(1, "User ID cannot be empty"),
  roleName: z.nativeEnum(RoleName, { errorMap: () => ({ message: "Invalid role specified" }) }),
});

export const userRouter = createTRPCRouter({
  // Procedure to get the current logged-in user's details
  getSelf: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user is guaranteed to be available due to protectedProcedure
    const firebaseUser = await getUser(ctx.user.userId); // Fetch latest data from Firebase

    return {
      id: ctx.user.userId,
      roles: ctx.user.roles,
      email: firebaseUser?.email,
      name: firebaseUser?.displayName,
      // Add other relevant fields from your User model or Firebase if needed
    };
  }),

  // Procedure for Super Admins to list users
  list: superAdminProcedure.query(async ({ ctx }) => {
    // Fetch users from your database. Include roles.
    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: {
          select: {
            role: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map roles to a flat array of RoleName
    return users.map(user => ({
      ...user,
      roles: user.roles.map(ur => ur.role.name)
    }));
  }),

  // Procedure for Super Admins to assign roles
  assignRole: superAdminProcedure
    .input(RoleAssignmentInput)
    .mutation(async ({ ctx, input }) => {
      const { userId, roleName } = input;

      // Find the role ID from the role name
      const role = await ctx.db.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Role not found" });
      }

      // Use upsert to add the role to the user
      // This will create the UserRole link if it doesn't exist
      // or do nothing if it already exists.
      // Consider if you want logic to *remove* other roles or *replace* roles.
      await ctx.db.userRole.upsert({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: role.id,
          },
        },
        create: {
          userId: userId,
          roleId: role.id,
          assignedBy: ctx.user.userId, // Log who assigned the role
        },
        update: { // No update needed if it exists, but required by upsert
          assignedBy: ctx.user.userId, // Maybe update who assigned it last?
        },
      });

      // Check if the user exists in our DB, if not, create them
      // This ensures users assigned roles via admin panel exist in our User table
      await ctx.db.user.upsert({
          where: { id: userId },
          update: {}, // No update needed if user exists
          create: { id: userId }
      });

      console.log(`Assigned role ${roleName} to user ${userId} by ${ctx.user.userId}`);
      return { success: true };
    }),

  // Procedure for logged-in users to sync their profile (e.g., after signup)
  syncProfile: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.userId;
    const userRoles = ctx.user.roles; // Roles verified by protectedProcedure

    // 1. Ensure user exists in our DB
    let userInDb = await ctx.db.user.findUnique({
      where: { id: userId },
    });

    if (!userInDb) {
      const firebaseUser = await getUser(userId);
      userInDb = await ctx.db.user.create({
        data: {
          id: userId,
          email: firebaseUser?.email,
          name: firebaseUser?.displayName,
        },
      });
      console.log(`Created user profile in DB for ${userId}`);
    }

    // 2. Assign default CUSTOMER role if user has no roles
    if (userRoles.length === 0) {
      const customerRole = await ctx.db.role.findUnique({ where: { name: RoleName.CUSTOMER } });
      if (customerRole) {
        try {
          await ctx.db.userRole.create({
            data: {
              userId: userId,
              roleId: customerRole.id,
            },
          });
          console.log(`Assigned default CUSTOMER role to ${userId}`);
          // Return updated roles or a success message
          return { success: true, roles: [RoleName.CUSTOMER] };
        } catch (error) {
          // Handle potential race condition if role was assigned elsewhere
          console.error(`Failed to assign CUSTOMER role to ${userId}, maybe already assigned?`, error);
        }
      } else {
        console.error("CUSTOMER Role not found in database!");
      }
    }

    // If user exists and already had roles (or CUSTOMER role couldn't be assigned)
    return { success: true, roles: userRoles };
  }),

}); 