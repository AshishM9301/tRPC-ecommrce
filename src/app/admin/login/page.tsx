'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '~/context/AuthContext';
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, loading, error } = useAuth();
  const router = useRouter(); // Keep router in case middleware redirect needs backup

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      // Middleware should redirect to /admin upon successful login for admin users
      // router.push('/admin'); // Optional backup redirect
    } catch (err) {
      console.error("Admin Login page caught error:", err);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Admin / Seller Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Not an Admin/Seller?{" "}
              <Link href="/login" className="underline hover:text-primary">
                Customer Login
              </Link>
            </p>
            {/* Optionally add a link to signup if admins can be created via signup */}
            {/* <p className="text-center text-sm text-muted-foreground">*/}
            {/*   Don&apos;t have an account?{" "}*/}
            {/*   <Link href="/admin/signup" className="underline hover:text-primary">*/}
            {/*     Request Access / Sign up*/}
            {/*   </Link>*/}
            {/* </p>*/}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 