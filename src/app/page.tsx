
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, ShieldCheck, LogIn, ArrowRight, DoorOpen, LogOut } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LandingPage() {
  const { toast } = useToast();
  const libraryBg = PlaceHolderImages.find(img => img.id === 'library-bg');
  const neuLogo = PlaceHolderImages.find(img => img.id === 'neu-logo');
  const { auth } = useAuth() ? { auth: useAuth() } : { auth: null };
  const { user, isUserLoading } = useUser();

  const handleGoogleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to ScholarFlow.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign-in Error",
        description: "Google Sign-In might not be enabled in the Firebase Console yet.",
      });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({
      title: "Signed Out",
      description: "You have been securely logged out.",
    });
  };

  const isSuperAdmin = user?.email === 'jcesperanza@neu.edu.ph';

  return (
    <div className="relative min-h-screen flex flex-col font-body overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {libraryBg?.imageUrl && (
          <Image 
            src={libraryBg.imageUrl} 
            alt="Library Background" 
            fill 
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-[#1c3b5a]/90 backdrop-blur-[2px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-20 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          {neuLogo?.imageUrl && (
            <Image 
              src={neuLogo.imageUrl} 
              alt="NEU Logo" 
              width={40} 
              height={40} 
              className="bg-white rounded-full p-1 shadow-md"
            />
          )}
          <span className="text-white font-headline font-bold text-xl tracking-tight">
            Scholar<span className="text-[#36BBDB]">Flow</span>
          </span>
        </div>
        
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-white text-xs font-bold uppercase tracking-wider">{user.displayName}</p>
                {isSuperAdmin && <p className="text-[#36BBDB] text-[10px] font-bold uppercase">System Administrator</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleGoogleLogin} disabled={isUserLoading} className="bg-[#36BBDB] hover:bg-[#2EB0D0] text-white font-bold rounded-full px-6">
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-white tracking-tight drop-shadow-lg">
            Library Gateway
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-light">
            Secure terminal and administration for <span className="font-bold border-b-2 border-[#36BBDB]">New Era University Library</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Visitor Terminal Card */}
          <Card className="border-none shadow-2xl hover:translate-y-[-8px] transition-all duration-300 bg-white/95 backdrop-blur-xl rounded-3xl group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
              <DoorOpen className="h-32 w-32 text-[#264D73]" />
            </div>
            <CardHeader className="text-center pb-2 pt-10">
              <div className="mx-auto bg-blue-50 p-6 rounded-3xl w-fit mb-6 shadow-inner">
                <UserCircle className="h-14 w-14 text-[#264D73]" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold text-[#264D73]">Visitor Terminal</CardTitle>
              <CardDescription className="text-lg">Daily session check-in</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Link href={user ? "/visitor" : "#"}>
                <Button 
                  size="lg" 
                  className="w-full h-16 text-xl font-headline bg-[#36BBDB] hover:bg-[#2EB0D0] rounded-2xl shadow-lg"
                  onClick={() => !user && handleGoogleLogin()}
                >
                  Launch Terminal <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Console Card */}
          <Card className="border-none shadow-2xl hover:translate-y-[-8px] transition-all duration-300 bg-white/95 backdrop-blur-xl rounded-3xl group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
              <ShieldCheck className="h-32 w-32 text-[#264D73]" />
            </div>
            <CardHeader className="text-center pb-2 pt-10">
              <div className="mx-auto bg-blue-50 p-6 rounded-3xl w-fit mb-6 shadow-inner">
                <ShieldCheck className="h-14 w-14 text-[#264D73]" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold text-[#264D73]">Admin Console</CardTitle>
              <CardDescription className="text-lg">Analytics & Audit</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Link href={user ? "/admin" : "#"}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full h-16 text-xl font-headline border-2 border-[#264D73] text-[#264D73] hover:bg-[#264D73]/5 rounded-2xl"
                  onClick={() => !user && handleGoogleLogin()}
                >
                  Open Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {!user && (
          <p className="mt-8 text-blue-200 text-sm font-medium animate-pulse">
            Sign in with your @neu.edu.ph account to continue.
          </p>
        )}
      </main>

      <footer className="relative z-10 text-center p-8 text-blue-200/40 text-[10px] font-mono uppercase tracking-[0.2em]">
        New Era University • Intellectually Driven • Spiritually Fortified
      </footer>
    </div>
  );
}
