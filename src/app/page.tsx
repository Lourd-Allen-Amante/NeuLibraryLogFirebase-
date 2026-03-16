"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, ShieldCheck, LogIn, ArrowRight, DoorOpen, LogOut, Loader2, KeyRound, Mail } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LandingPage() {
  const { toast } = useToast();
  const libraryBg = PlaceHolderImages.find(img => img.id === 'library-bg');
  const neuLogo = PlaceHolderImages.find(img => img.id === 'neu-logo');
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Specific Greeting for Regular User - flexible matching for typo
  useEffect(() => {
    if (!user?.email) return;
    const email = user.email.toLowerCase();
    if (email === 'jcesperanza@neu.edu.ph' || email === 'jceperanza@neu.edu.ph') {
      toast({
        title: "Welcome to NEU Library!",
        description: "You have successfully logged into the system.",
      });
    }
  }, [user, toast]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Access Granted",
        description: `Welcome back, ${email.split('@')[0]}!`,
      });
      setIsLoginDialogOpen(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "Invalid email or password.";
      // Handle various Firebase Auth error codes
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Incorrect credentials. Please try again.";
      } else if (error.code === 'auth/user-disabled') {
        message = "This account has been disabled.";
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast({
      title: "Signed Out",
      description: "You have been securely logged out.",
    });
  };

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
        <div className="absolute inset-0 bg-[#0a1f16]/75 backdrop-blur-[2px]"></div>
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
              <LogIn className="mr-2 h-4 w-4" /> Admin Login
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
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto font-light">
            Secure terminal and administration for <span className="font-bold border-b-2 border-emerald-50">New Era INC Library</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Visitor Terminal Card */}
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

          {/* Admin Console Card */}
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

        <p className="mt-8 text-emerald-200 text-sm font-medium animate-pulse">
          Terminal open for all students. Admin login required for dashboard.
        </p>
      </main>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#1B4332] p-8 text-white text-center">
            <DialogTitle className="text-2xl font-headline font-bold">Admin Authentication</DialogTitle>
            <DialogDescription className="text-emerald-100/60 mt-1">
              Enter your institutional credentials
            </DialogDescription>
          </div>
          <form onSubmit={handleEmailLogin} className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-emerald-800/60">Institutional Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-emerald-600/40" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@neu.edu.ph" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-emerald-100 focus:border-[#1B4332] rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-emerald-800/60">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-emerald-600/40" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 border-emerald-100 focus:border-[#1B4332] rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl shadow-lg"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              Verify Credentials
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <footer className="relative z-10 text-center p-8 text-emerald-200/40 text-[10px] font-mono uppercase tracking-[0.2em]">
        New Era University • Intellectually Driven • Spiritually Fortified
      </footer>
    </div>
  );
}