'use client';

import { useAuth } from "~/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { LogOut, User as UserIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";

export function UserNav() {
    const { user, loading, signOutUser, error } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOutUser();
            toast.success("Signed out successfully.");
            // Middleware should handle redirect automatically
        } catch (err) {
            // Error is already handled by useAuth hook
            // toast.error("Sign out failed.");
            console.error("UserNav sign out error:", err);
        }
    };

    if (loading) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    if (!user) {
        // This shouldn't typically be visible if middleware protects layout,
        // but good as a fallback.
        return null;
    }

    // Get initials for fallback avatar
    const getInitials = (email: string | null | undefined) => {
        return email ? email.substring(0, 2).toUpperCase() : <UserIcon className="h-4 w-4" />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                        {/* Add user.photoURL if available */}
                        {/* <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} /> */}
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    <div className="text-xs leading-none text-muted-foreground">
                        {user.email}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Add link to account page if needed */}
                {/* <DropdownMenuItem>Profile</DropdownMenuItem> */}
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 