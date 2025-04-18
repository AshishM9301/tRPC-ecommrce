"use client";

import { usePathname } from "next/navigation";
import { redirect } from "next/navigation";

function AdminPage() {
  const pathname = usePathname();

  if (pathname === "/admin") {
    return redirect("/admin/dashboard");
  }

  return <div>AdminPage</div>;
}

export default AdminPage;
