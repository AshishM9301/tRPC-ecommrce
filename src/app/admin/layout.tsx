import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";
import { UserNav } from "./_components/UserNav";
import SideNavbar from "~/components/SideNavbar";

// TODO: Add component to fetch user roles to conditionally render links
// import { api } from "~/trpc/server";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // const user = await api.user.getSelf(); // Fetch user to check roles later
  // const userRoles = user?.roles ?? [];

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="flex h-full max-h-screen flex-1 gap-2">
        <SideNavbar />
      </div>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {children}
      </main>
    </div>
  );
}
