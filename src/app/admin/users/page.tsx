'use client';

import { api } from "~/trpc/react";
import { RoleName } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { AssignRoleDialog } from "./_components/AssignRoleDialog";
import { Skeleton } from "~/components/ui/skeleton"; // For loading state
import { useAuth } from "~/context/AuthContext"; // To check current user role

export default function UsersPage() {
  const { data: users, isLoading, error } = api.user.list.useQuery();
  const { user: currentUser } = useAuth(); // Get current logged-in user info

  // We need to check if the *current* user is SUPER_ADMIN to allow role assignment
  // This check should ideally happen server-side via the procedure, but
  // we can also use it client-side to conditionally render the button.
  // NOTE: Fetching current user roles via useAuth might be slightly delayed
  // compared to direct tRPC context. For critical checks, rely on procedure protection.
  const { data: selfData } = api.user.getSelf.useQuery(undefined, {
    enabled: !!currentUser, // Only run if firebase user exists
  });
  const isSuperAdmin = selfData?.roles?.includes(RoleName.SUPER_ADMIN) ?? false;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">User Management</h1>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">Error loading users: {error.message}</div>;
  }

  if (!users) {
    return <div>No users found.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">User Management</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Roles</TableHead>
              {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 5 : 4} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium truncate max-w-xs">{user.id}</TableCell>
                  <TableCell>{user.email ?? 'N/A'}</TableCell>
                  <TableCell>{user.name ?? 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} variant="secondary">{role}</Badge>
                        ))
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </div>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <AssignRoleDialog
                        userId={user.id}
                        userEmail={user.email}
                        currentRoles={user.roles}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 