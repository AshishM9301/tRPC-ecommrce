"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "~/app/admin/_components/UserNav";

export default function AdminNavbar() {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <div className="bg-muted/40 hidden border-r md:block">
      <div className="flex h-full max-h-screen gap-2">
        <div className="flex h-14 w-full flex-1 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span className="">Admin Panel</span>
          </Link>
          {/* Add theme toggle or user menu button here later */}
          <header className="bg-muted/40 flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
            {/* Mobile Nav Toggle (Sheet) can be added here */}
            <div className="flex-1">
              {/* Left side of header - e.g., Breadcrumbs or Search */}
            </div>
            {/* Right side of header */}
            <UserNav />
          </header>
        </div>

        {/* Optional Footer in Sidebar */}
      </div>
    </div>
  );
}
