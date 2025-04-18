'use client';

import { useState } from 'react';
import { RoleName } from '@prisma/client';
import { api } from '~/trpc/react';
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "~/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Label } from '~/components/ui/label';
import { toast } from "sonner";

interface AssignRoleDialogProps {
    userId: string;
    userEmail: string | null;
    currentRoles: RoleName[];
}

// Get all possible RoleName values for the dropdown
const availableRoles = Object.values(RoleName);

export function AssignRoleDialog({ userId, userEmail, currentRoles }: AssignRoleDialogProps) {
    const [selectedRole, setSelectedRole] = useState<RoleName | undefined>(undefined);
    const [isOpen, setIsOpen] = useState(false);

    const utils = api.useUtils();

    const assignRoleMutation = api.user.assignRole.useMutation({
        onSuccess: (data, variables) => {
            toast.success(`Role ${variables.roleName} assigned successfully to ${userEmail ?? userId}`);
            void utils.user.list.invalidate();
            setIsOpen(false);
            setSelectedRole(undefined);
        },
        onError: (error) => {
            toast.error(`Failed to assign role: ${error.message}`);
            console.error("Assign role error:", error);
        },
    });

    const handleAssignRole = () => {
        if (!selectedRole) {
            toast.warning("Please select a role to assign.");
            return;
        }
        assignRoleMutation.mutate({ userId, roleName: selectedRole });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Manage Roles</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Role</DialogTitle>
                    <DialogDescription>
                        Assign a new primary role to {userEmail ?? userId}. Current roles: {currentRoles.join(', ') || 'None'}
                        (Note: This currently adds the role. Removing roles needs separate logic).
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role-select" className="text-right">
                            Role
                        </Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(value: string) => setSelectedRole(value as RoleName)}
                            disabled={assignRoleMutation.isPending}
                        >
                            <SelectTrigger id="role-select" className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={assignRoleMutation.isPending}>Cancel</Button>
                    </DialogClose>
                    <Button
                        type="button"
                        onClick={handleAssignRole}
                        disabled={assignRoleMutation.isPending || !selectedRole}
                    >
                        {assignRoleMutation.isPending ? 'Assigning...' : 'Assign Role'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 