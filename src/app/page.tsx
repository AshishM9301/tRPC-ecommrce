import Link from "next/link";

// import { LatestPost } from "~/app/_components/post"; // Remove unused import
import { api } from "~/trpc/server"; // Remove HydrateClient import for now

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" }); // Remove tRPC call

  // void api.post.getLatest.prefetch(); // Remove tRPC prefetch

  return (
    // <HydrateClient> // Temporarily remove wrapper
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            T3 Shoe Store {/* Updated title */}
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="/products" // Link to products page (will create later)
            >
              <h3 className="text-2xl font-bold">Shop Products →</h3>
              <div className="text-lg">
                Browse our latest collection of shoes.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="/login" // Link to login page
            >
              <h3 className="text-2xl font-bold">Login / Account →</h3>
              <div className="text-lg">
                Access your account or sign up.
              </div>
            </Link>
          </div>
          {/* Remove the section displaying the hello message */}
          {/* <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              {hello ? hello.greeting : "Loading tRPC query..."}
            </p>
          </div> */}

          {/* <LatestPost /> Remove component */}
        </div>
      </main>
    // </HydrateClient> // Temporarily remove wrapper
  );
}
