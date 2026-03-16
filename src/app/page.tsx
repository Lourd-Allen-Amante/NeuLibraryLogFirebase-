"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Library, UserCircle, ShieldCheck, LogIn } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import Link from 'next/link';

export default function LandingPage() {
  const libraryBg = PlaceHolderImages.find(img => img.id === 'library-bg');
  const neuLogo = PlaceHolderImages.find(img => img.id === 'neu-logo');
  const { auth } = useAuth() ? { auth: useAuth() } : { auth: null };
  const { user, isUserLoading } = useUser();

  const handleGoogleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <Image 
          src={libraryBg?.imageUrl || ''} 
          alt="Library Background" 
          fill 
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-12 space-y-4">
          <div className="mx-auto w-24 h-24 bg-white p-2 rounded-full shadow-xl mb-4 flex items-center justify-center overflow-hidden">
             <Image 
               src={neuLogo?.imageUrl || ''} 
               alt="NEU Logo" 
               width={80} 
               height={80} 
               className="object-contain"
             />
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight">
            NEU ScholarFlow
          </h1>
          <p className="text-xl text-blue-100 max-w-lg mx-auto font-body">
            Official Visitor Management System for New Era University Library.
          </p>
        </div>

        {!user ? (
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle>Institutional Access</CardTitle>
                <CardDescription>Sign in with your @neu.edu.ph account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGoogleLogin} 
                  disabled={isUserLoading}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign in with Google
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-2xl hover:scale-[1.02] transition-transform bg-white/95 backdrop-blur">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-blue-50 p-4 rounded-full w-fit mb-4">
                  <UserCircle className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">Visitor Terminal</CardTitle>
                <CardDescription>Check-in or out for your visit</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Link href="/visitor">
                  <Button size="lg" className="w-full h-14 text-lg font-headline bg-primary hover:bg-primary/90">
                    Enter Terminal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl hover:scale-[1.02] transition-transform bg-white/95 backdrop-blur">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-blue-50 p-4 rounded-full w-fit mb-4">
                  <ShieldCheck className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">Admin Dashboard</CardTitle>
                <CardDescription>Manage logs and statistics</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Link href="/admin">
                  <Button size="lg" variant="outline" className="w-full h-14 text-lg font-headline border-primary text-primary hover:bg-primary/5">
                    View Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <div className="md:col-span-2 flex justify-center mt-4">
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
                Signed in as {user.email} (Logout)
              </Button>
            </div>
          </div>
        )}

        <p className="text-center mt-12 text-blue-200/80 text-sm">
          &copy; {new Date().getFullYear()} New Era University Library System. All rights reserved.
        </p>
      </div>
    </div>
  );
}