import Link from "next/link";
import { api } from "~/trpc/server";
import { ProductCard } from "~/components/ProductCard";

export default async function Home() {
  // Fetch products on the server
  const products = await api.product.list();

  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Featured Products
        </h1>
        {products.length === 0 ? (
          <p>No products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
