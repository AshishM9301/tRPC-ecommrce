import { Navbar } from "~/components/Navbar";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {/* Add Footer later if needed */}
    </div>
  );
} 