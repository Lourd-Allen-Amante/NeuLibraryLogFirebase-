
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, ShieldCheck, LogIn, ArrowRight, DoorOpen, LogOut, Loader2, KeyRound, Mail, UserCheck, ChevronRight } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
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
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const authorizedAdmins = [
    { name: 'JC Esperanza', email: 'jcesperanza@neu.edu.ph' },
    { name: 'Lourdallen Amante', email: 'lourdallen.amante@neu.edu.ph' },
    { name: 'Library Admin', email: 'neulibrarian@neu.edu.ph' }
  ];

  // Default password for demo/prototype accounts
  const DEFAULT_PASSWORD = 'password123';

  const handleAdminSelect = async (email: string) => {
    if (!auth) return;

    setSelectedEmail(email);
    setIsLoggingIn(true);
    
    try {
      // First, attempt to sign in
      await signInWithEmailAndPassword(auth, email, DEFAULT_PASSWORD);
      
      toast({
        title: "Access Granted",
        description: `Welcome back, ${email.split('@')[0]}!`,
      });
      setIsLoginDialogOpen(false);
    } catch (error: any) {
      // If the user doesn't exist, create the account automatically for the prototype
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, DEFAULT_PASSWORD);
          toast({
            title: "Account Initialized",
            description: `Admin access configured for ${email}.`,
          });
          setIsLoginDialogOpen(false);
        } catch (createError: any) {
          console.error("Auto-registration error:", createError);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Could not initialize admin account. Please contact IT support.",
          });
        }
      } else {
        console.error("Auth error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message || "An unexpected error occurred during login.",
        });
      }
    } finally {
      setIsLoggingIn(false);
      setSelectedEmail(null);
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
                <p className="text-white text-[10px] font-bold uppercase tracking-wider opacity-60">Session Active</p>
                <p className="text-white text-xs font-bold">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsLoginDialogOpen(true)} disabled={isUserLoading} className="bg-[#1B4332] border border-emerald-700 hover:bg-[#2D6A4F] text-white font-bold rounded-full px-6">
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
              Select an authorized account to continue
            </DialogDescription>
          </div>
          <div className="p-6 bg-white space-y-3">
            <div className="grid gap-3">
              {authorizedAdmins.map((admin) => (
                <Button
                  key={admin.email}
                  variant="outline"
                  className="h-auto py-4 px-6 flex items-center justify-between group hover:border-[#1B4332] hover:bg-emerald-50 rounded-2xl transition-all border-emerald-100"
                  disabled={isLoggingIn}
                  onClick={() => handleAdminSelect(admin.email)}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="bg-emerald-100 p-2 rounded-xl group-hover:bg-[#1B4332] transition-colors">
                      <UserCheck className="h-5 w-5 text-[#1B4332] group-hover:text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1B4332] text-sm">{admin.name}</p>
                      <p className="text-[10px] text-emerald-800/60 font-mono">{admin.email}</p>
                    </div>
                  </div>
                  {isLoggingIn && selectedEmail === admin.email ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-emerald-200 group-hover:text-[#1B4332] transition-colors" />
                  )}
                </Button>
              ))}
            </div>
            <p className="text-[9px] text-center text-emerald-800/30 font-mono uppercase tracking-widest pt-4">
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
