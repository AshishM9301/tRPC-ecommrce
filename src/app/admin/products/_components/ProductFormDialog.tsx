'use client';

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from '~/components/ui/label';
import { toast } from "sonner";
import type { Product } from '@prisma/client'; // Import Product type

// Zod schema for form validation (matches ProductInput in tRPC router)
const ProductFormSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    description: z.string().min(10, "Description must be at least 10 characters long"),
    price: z.coerce.number().positive("Price must be a positive number"), // Use coerce for form input
    imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    stock: z.coerce.number().int().min(0, "Stock cannot be negative").default(0), // Use coerce
});
type ProductFormData = z.infer<typeof ProductFormSchema>;

interface ProductFormDialogProps {
    product?: Product | null; // Optional: Pass product data for editing
    triggerButton: React.ReactNode; // Allow custom trigger button
}

export function ProductFormDialog({ product, triggerButton }: ProductFormDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isEditMode = !!product;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
        resolver: zodResolver(ProductFormSchema),
        defaultValues: {
            name: product?.name ?? '',
            description: product?.description ?? '',
            price: product?.price ?? 0,
            imageUrl: product?.imageUrl ?? '',
            stock: product?.stock ?? 0,
        },
    });

    // Reset form when product data changes (e.g., opening dialog for different product)
    useEffect(() => {
        reset({
            name: product?.name ?? '',
            description: product?.description ?? '',
            price: product?.price ?? 0,
            imageUrl: product?.imageUrl ?? '',
            stock: product?.stock ?? 0,
        });
    }, [product, reset]);

    const utils = api.useUtils();

    const addMutation = api.product.add.useMutation({
        onSuccess: () => {
            toast.success("Product added successfully!");
            void utils.product.list.invalidate();
            setIsOpen(false);
            reset(); // Clear form
        },
        onError: (error) => {
            toast.error(`Failed to add product: ${error.message}`);
        },
    });

    const updateMutation = api.product.update.useMutation({
        onSuccess: () => {
            toast.success("Product updated successfully!");
            void utils.product.list.invalidate();
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error(`Failed to update product: ${error.message}`);
        },
    });

    const onSubmit = (data: ProductFormData) => {
        if (isEditMode && product) {
            updateMutation.mutate({ id: product.id, ...data });
        } else {
            addMutation.mutate(data);
        }
    };

    const isLoading = addMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) reset(); // Reset form on close
        }}>
            <DialogTrigger asChild>
                {triggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? `Editing details for ${product?.name}` : 'Fill in the details for the new product.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" {...register("name")} className="col-span-3" disabled={isLoading} />
                    </div>
                    {errors.name && <p className="col-span-4 text-right text-sm text-red-600">{errors.name.message}</p>}

                    {/* Description */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">Description</Label>
                        <Textarea id="description" {...register("description")} className="col-span-3 min-h-[100px]" disabled={isLoading} />
                    </div>
                    {errors.description && <p className="col-span-4 text-right text-sm text-red-600">{errors.description.message}</p>}

                    {/* Price */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Price ($)</Label>
                        <Input id="price" type="number" step="0.01" {...register("price")} className="col-span-3" disabled={isLoading} />
                    </div>
                    {errors.price && <p className="col-span-4 text-right text-sm text-red-600">{errors.price.message}</p>}

                    {/* Stock */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">Stock</Label>
                        <Input id="stock" type="number" step="1" {...register("stock")} className="col-span-3" disabled={isLoading} />
                    </div>
                    {errors.stock && <p className="col-span-4 text-right text-sm text-red-600">{errors.stock.message}</p>}

                    {/* Image URL */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
                        <Input id="imageUrl" {...register("imageUrl")} className="col-span-3" placeholder="https://..." disabled={isLoading} />
                    </div>
                    {errors.imageUrl && <p className="col-span-4 text-right text-sm text-red-600">{errors.imageUrl.message}</p>}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Product')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 