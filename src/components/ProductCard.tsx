import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "./ui/button"; // Assuming you might want an Add to Cart button later
import { formatCurrency } from "~/lib/utils"; // Assuming formatCurrency is moved/exists here
import { AddToCartButton } from "./cart/AddToCartButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="relative h-48 p-0">
        {" "}
        {/* Adjust height as needed */}
        <Link href={`/products/${product.id}`} aria-label={product.name}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="bg-muted absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <Link href={`/products/${product.id}`} className="hover:underline">
          <CardTitle className="truncate text-lg leading-tight font-semibold">
            {product.name}
          </CardTitle>
        </Link>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <span className="font-semibold">{formatCurrency(product.price)}</span>
        {/* Placeholder for future Add to Cart button */}
        <AddToCartButton productId={product.id} />
      </CardFooter>
    </Card>
  );
}
