"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, ShieldCheck, LogIn, ArrowRight, DoorOpen } from "lucide-react";
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

  const isSuperAdmin = user?.email === 'jcesperanza@neu.edu.ph';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-body overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={libraryBg?.imageUrl || ''} 
          alt="Library Background" 
          fill 
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#1c3b5a]/90 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="text-center mb-12 space-y-6">
          <div className="mx-auto w-32 h-32 bg-white p-2 rounded-full shadow-2xl mb-6 flex items-center justify-center overflow-hidden border-4 border-white">
             <Image 
               src={neuLogo?.imageUrl || ''} 
               alt="NEU Logo" 
               width={110} 
               height={110} 
               className="object-contain"
               unoptimized
             />
          </div>
          <h1 className="text-6xl md:text-7xl font-headline font-bold text-white tracking-tight drop-shadow-lg">
            Scholar<span className="text-[#36BBDB]">Flow</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-light leading-relaxed">
            Visitor Management for <span className="font-bold border-b-2 border-[#36BBDB]">New Era University</span> Library.
          </p>
        </div>

        {!user ? (
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
              <div className="h-2 bg-[#36BBDB]" />
              <CardHeader className="text-center pt-10">
                <CardTitle className="text-2xl font-headline font-bold text-[#264D73]">Institutional Access</CardTitle>
                <CardDescription className="text-slate-500">Secure sign-in using your @neu.edu.ph credentials</CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <Button 
                  onClick={handleGoogleLogin} 
                  disabled={isUserLoading}
                  className="w-full h-16 text-xl font-headline bg-[#264D73] hover:bg-[#1B3A57] shadow-lg rounded-2xl group transition-all"
                >
                  <LogIn className="mr-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  Sign in with Google
                </Button>
                <p className="text-center mt-6 text-xs text-muted-foreground">
                  Access is restricted to authorized NEU personnel and students.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-none shadow-2xl hover:translate-y-[-8px] transition-all duration-300 bg-white/95 backdrop-blur-xl rounded-3xl group overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
                 <DoorOpen className="h-32 w-32 text-[#264D73]" />
               </div>
              <CardHeader className="text-center pb-2 pt-10">
                <div className="mx-auto bg-blue-50 p-6 rounded-3xl w-fit mb-6 shadow-inner">
                  <UserCircle className="h-14 w-14 text-[#264D73]" />
                </div>
                <CardTitle className="text-3xl font-headline font-bold text-[#264D73]">Visitor Terminal</CardTitle>
                <CardDescription className="text-lg">Check-in for study or research session</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <Link href="/visitor">
                  <Button size="lg" className="w-full h-16 text-xl font-headline bg-[#36BBDB] hover:bg-[#2EB0D0] rounded-2xl shadow-lg">
                    Launch Entry <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl hover:translate-y-[-8px] transition-all duration-300 bg-white/95 backdrop-blur-xl rounded-3xl group overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
                 <ShieldCheck className="h-32 w-32 text-[#264D73]" />
               </div>
              <CardHeader className="text-center pb-2 pt-10">
                <div className="mx-auto bg-blue-50 p-6 rounded-3xl w-fit mb-6 shadow-inner">
                  <ShieldCheck className="h-14 w-14 text-[#264D73]" />
                </div>
                <CardTitle className="text-3xl font-headline font-bold text-[#264D73]">Admin Console</CardTitle>
                <CardDescription className="text-lg">View statistics and manage logs</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <Link href="/admin">
                  <Button size="lg" variant="outline" className="w-full h-16 text-xl font-headline border-2 border-[#264D73] text-[#264D73] hover:bg-[#264D73]/5 rounded-2xl">
                    Open Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <div className="md:col-span-2 flex flex-col items-center gap-4 mt-4">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
                <p className="text-blue-100 text-sm font-medium">Signed in as <span className="text-white font-bold">{user.displayName}</span></p>
                {isSuperAdmin && (
                   <span className="inline-block mt-1 px-2 py-0.5 bg-[#36BBDB] text-white text-[10px] font-bold rounded uppercase tracking-wider">
                     Authorized Super Admin
                   </span>
                )}
              </div>
              <Button variant="ghost" className="text-blue-200 hover:text-white hover:bg-white/10 rounded-full px-6 transition-colors" onClick={handleLogout}>
                Sign Out from System
              </Button>
            </div>
          </div>
        )}

        <footer className="text-center mt-16 text-blue-200/60 text-sm">
          <p>&copy; {new Date().getFullYear()} New Era University Library Management System</p>
          <p className="mt-1 font-mono uppercase tracking-[0.2em] text-[10px]">Intellectually Driven • Spiritually Fortified</p>
        </footer>
      </div>
    </div>
  );
}
