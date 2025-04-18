"use client";

import { cx } from "class-variance-authority";
import { LayoutDashboard, Users, ShoppingCart, Package } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

function SideNavbar() {
  const pathname = usePathname();
  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/users", label: "Users", icon: Users },
    // Add more admin sections as needed
  ];
  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <div className="z-10 flex-1">
      <nav className="grid items-start px-2 py-4 text-sm font-medium lg:px-4">
        {adminNavItems.map((item) => {
          // TODO: Add role checks here, e.g.:
          // if (item.label === 'Users' && !userRoles.includes(RoleName.SUPER_ADMIN)) return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                pathname === item.href && "text-primary",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default SideNavbar;
