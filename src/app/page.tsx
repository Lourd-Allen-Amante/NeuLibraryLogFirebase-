
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, ShieldCheck, LogIn, ArrowRight, DoorOpen, LogOut, Loader2, UserCheck, ChevronRight, ShieldAlert } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LandingPage() {
  const { toast } = useToast();
  const libraryBg = PlaceHolderImages.find(img => img.id === 'library-bg');
  const neuLogo = PlaceHolderImages.find(img => img.id === 'neu-logo');
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const authorizedAdmins = [
    { name: 'JC Esperanza', email: 'jcesperanza@neu.edu.ph' },
    { name: 'Lourdallen Amante', email: 'lourdallen.amante@neu.edu.ph' },
    { name: 'Library Admin', email: 'neulibrarian@neu.edu.ph' }
  ];

  const handleGoogleLogin = async () => {
    if (!auth) return;

    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    // Optional: prompt for account selection every time for better terminal UX
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase();
      
      const isAuthorized = authorizedAdmins.some(admin => admin.email.toLowerCase() === email);
      
      if (!isAuthorized) {
        // Immediately sign out unauthorized users
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "This Google account is not on the authorized administrative list.",
        });
      } else {
        toast({
          title: "Access Granted",
          description: `Welcome back, ${result.user.displayName || email}!`,
        });
        setIsLoginDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Google Auth error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message || "An unexpected error occurred during Google login.",
        });
      }
    } finally {
      setIsLoggingIn(false);
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

  return (
    <div className="relative min-h-screen flex flex-col font-body overflow-hidden">
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
        <div className="absolute inset-0 bg-[#0a1f16]/75 backdrop-blur-[2px]"></div>
      </div>

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
            New Era <span className="text-emerald-400">INC Library</span>
          </span>
        </div>
        
        <div>
          {user && !user.isAnonymous ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-white text-[10px] font-bold uppercase tracking-wider opacity-60">Admin Session</p>
                <p className="text-white text-xs font-bold">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsLoginDialogOpen(true)} disabled={isUserLoading} className="bg-[#1B4332] border border-emerald-700 hover:bg-[#2D6A4F] text-white font-bold rounded-full px-6 shadow-xl transition-all hover:scale-105">
              <LogIn className="mr-2 h-4 w-4" /> Admin Access
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-white tracking-tight drop-shadow-lg">
            Library Gateway
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto font-light">
            Secure terminal and administration for <span className="font-bold border-b-2 border-emerald-50">New Era INC Library</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-none shadow-2xl hover:translate-y-[-8px] transition-all duration-300 bg-white/95 backdrop-blur-xl rounded-3xl group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
              <DoorOpen className="h-32 w-32 text-[#1B4332]" />
            </div>
            <CardHeader className="text-center pb-2 pt-10">
              <div className="mx-auto bg-emerald-50 p-6 rounded-3xl w-fit mb-6 shadow-inner">
                <UserCircle className="h-14 w-14 text-[#1B4332]" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold text-[#1B4332]">Visitor Terminal</CardTitle>
              <CardDescription className="text-lg">Open session check-in</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Link href="/visitor">
                <Button 
                  size="lg" 
                  className="w-full h-16 text-xl font-headline bg-emerald-700 hover:bg-[#1B4332] rounded-2xl shadow-lg"
                >
                  Launch Terminal <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl hover:translate-y-[-8px] transition-all duration-300 bg-white/95 backdrop-blur-xl rounded-3xl group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
              <ShieldCheck className="h-32 w-32 text-[#1B4332]" />
            </div>
            <CardHeader className="text-center pb-2 pt-10">
              <div className="mx-auto bg-emerald-50 p-6 rounded-3xl w-fit mb-6 shadow-inner">
                <ShieldCheck className="h-14 w-14 text-[#1B4332]" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold text-[#1B4332]">Admin Console</CardTitle>
              <CardDescription className="text-lg">Analytics & Audit</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {user && !user.isAnonymous ? (
                <Link href="/admin">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full h-16 text-xl font-headline border-2 border-[#1B4332] text-[#1B4332] hover:bg-emerald-50 rounded-2xl"
                  >
                    Open Dashboard
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full h-16 text-xl font-headline border-2 border-[#1B4332] text-[#1B4332] hover:bg-emerald-50 rounded-2xl"
                  onClick={() => setIsLoginDialogOpen(true)}
                >
                  Sign In to Access
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#1B4332] p-8 text-white text-center">
            <DialogTitle className="text-2xl font-headline font-bold">Admin Authentication</DialogTitle>
            <DialogDescription className="text-emerald-100/60 mt-1">
              Secure Google Sign-In for Institutional Access
            </DialogDescription>
          </div>
          <div className="p-8 bg-white space-y-6">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full h-14 bg-white border border-emerald-100 text-emerald-900 hover:bg-emerald-50 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all"
            >
              {isLoggingIn ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span className="font-bold">Continue with Google</span>
            </Button>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/40 text-center">Authorized Personnel</p>
              <div className="grid gap-2">
                {authorizedAdmins.map((admin) => (
                  <div
                    key={admin.email}
                    className="flex items-center gap-3 p-3 rounded-xl border border-emerald-50 bg-emerald-50/20"
                  >
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <UserCheck className="h-3 w-3 text-[#1B4332]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1B4332] text-[10px] leading-none">{admin.name}</p>
                      <p className="text-[9px] text-emerald-800/60 font-mono mt-1">{admin.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-center text-emerald-800/30 font-mono uppercase tracking-widest pt-2">
              Institutional Security Policy • Phase 1
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="relative z-10 text-center p-8 text-emerald-200/40 text-[10px] font-mono uppercase tracking-[0.2em]">
        New Era University • Intellectually Driven • Spiritually Fortified
      </footer>
    </div>
  );
}
