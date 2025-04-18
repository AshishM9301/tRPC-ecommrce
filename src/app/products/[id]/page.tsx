import { notFound } from "next/navigation";
import Image from "next/image";
import { api } from "~/trpc/server";
import { formatCurrency } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { TRPCError } from "@trpc/server";

// Define props for the page, extracting params
interface ProductPageProps {
  params: {
    id: string; // ID from the URL
  };
}

// Export metadata function for dynamic title (optional but good practice)
export async function generateMetadata({ params }: ProductPageProps) {
  const productId = Number(params.id);
  if (isNaN(productId)) {
    return { title: "Invalid Product" }; // Handle non-numeric ID
  }
  try {
    const product = await api.product.getById({ id: productId });
    return {
      title: product.name, // Set page title to product name
      description: product.description, // Optional: set description
    };
  } catch (error) {
    // Handle case where product isn't found for metadata
    return { title: "Product Not Found" };
  }
}

// The main page component
export default async function ProductPage({ params }: ProductPageProps) {
  const productId = Number(params.id);

  // Validate ID
  if (isNaN(productId)) {
    notFound(); // Render 404 if ID is not a number
  }

  let product;
  try {
    product = await api.product.getById({ id: productId });
  } catch (error) {
    // Check if it's a TRPCError before accessing code
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    // Re-throw other errors or handle them differently
    console.error("Error fetching product:", error);
    // Display a generic error to the user
    return (
      <div className="container mx-auto px-4 py-8 text-red-600">
        Error loading product details. Please try again later.
      </div>
    );
  }

  // If fetching succeeded but product is somehow null/undefined (shouldn't happen with try/catch)
  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg border">
          <Image
            src={product.imageUrl ?? "/placeholder-image.png"}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            {product.name}
          </h1>

          <p className="text-2xl font-semibold lg:text-3xl">
            {formatCurrency(product.price)}
          </p>

          <Separator />

          <div>
            <h2 className="mb-2 text-lg font-medium">Description</h2>
            <p className="text-muted-foreground">
              {product.description ?? "No description available."}
            </p>
          </div>

          {/* Stock Information (Optional) */}
          {product.stock !== null && (
            <p className="text-muted-foreground text-sm">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>
          )}

          <Separator />

          {/* Add to Cart Button */}
          <div className="pt-4">
            <Button
              size="lg"
              disabled={product.stock === 0}
              onClick={() => alert("Add to cart clicked!")}
            >
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
