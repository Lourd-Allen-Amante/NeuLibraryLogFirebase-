
"use client"

import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Library, UserCircle, ShieldCheck } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const libraryBg = PlaceHolderImages.find(img => img.id === 'library-bg');

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background with overlay */}
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
          <div className="inline-flex items-center justify-center p-3 bg-accent rounded-2xl shadow-lg mb-4">
            <Library className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight">
            NEU ScholarFlow
          </h1>
          <p className="text-xl text-blue-100 max-w-lg mx-auto font-body">
            Streamlining knowledge access and visitor management for the New Era University Library.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-none shadow-2xl hover:scale-[1.02] transition-transform bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-blue-50 p-4 rounded-full w-fit mb-4">
                <UserCircle className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline">Library Visitor</CardTitle>
              <CardDescription>Scan your ID or login to enter the library</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Link href="/visitor">
                <Button size="lg" className="w-full h-14 text-lg font-headline bg-primary hover:bg-primary/90">
                  Tap to Check-in
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl hover:scale-[1.02] transition-transform bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-blue-50 p-4 rounded-full w-fit mb-4">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline">Administrator</CardTitle>
              <CardDescription>Manage logs, view statistics, and reports</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Link href="/admin">
                <Button size="lg" variant="outline" className="w-full h-14 text-lg font-headline border-primary text-primary hover:bg-primary/5">
                  Admin Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <p className="text-center mt-12 text-blue-200/80 text-sm">
          &copy; {new Date().getFullYear()} New Era University Library System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
