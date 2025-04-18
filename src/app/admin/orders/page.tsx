"use client";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { MoreHorizontal, Eye, Truck } from "lucide-react"; // Added icons
import type { OrderStatus } from "@prisma/client";
import { Badge } from "~/components/ui/badge"; // For status

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Helper to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

// Helper for status badge variant
const getStatusVariant = (
  status: OrderStatus,
): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "PROCESSING":
      return "default"; // Or another color
    case "SHIPPED":
      return "default";
    case "DELIVERED":
      return "default"; // Using 'outline' for success
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function OrdersPage() {
  // Use the listAll procedure
  const { data: orders, isLoading, error } = api.order.listAll.useQuery();

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Order Management</h1>
        <div className="space-y-2 rounded-md border p-2">
          {/* Simple skeleton rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <Skeleton className="h-5 w-1/6" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/6" />
              <Skeleton className="h-5 w-1/6" />
              <Skeleton className="h-5 w-1/6" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">Error loading orders: {error.message}</div>
    );
  }

  if (!orders) {
    return <div>No orders found.</div>; // Or a more descriptive message
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Order Management</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    #{order.id.toString().padStart(6, "0")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {order.user?.name ?? "N/A"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {order.user?.email ?? "No email"}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() =>
                            alert(`View details for order ${order.id}`)
                          } // Placeholder action
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            alert(`Update status for order ${order.id}`)
                          } // Placeholder action
                          className="cursor-pointer"
                        >
                          <Truck className="mr-2 h-4 w-4" /> Update Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Add Modals for View Details / Update Status later */}
    </div>
  );
}
