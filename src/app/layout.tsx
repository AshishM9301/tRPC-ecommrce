import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/context/AuthContext";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { Navbar } from "~/components/layout/Navbar";
import PublicLayout from "./(public)/layout";
import AdminLayout from "./admin/layout";
import type { NextRequest } from "next/server";

export const metadata: Metadata = {
  title: "T3 Shoe Store",
  description: "The best place for the best shoes!",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-background min-h-screen font-sans antialiased">
        <AuthProvider>
          <TRPCReactProvider>
            <PublicLayout>{children}</PublicLayout>
            <Toaster />
          </TRPCReactProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
