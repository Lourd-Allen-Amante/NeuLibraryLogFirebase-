"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VISIT_PURPOSES, Purpose } from '@/lib/types';
import { CheckCircle2, Clock, DoorOpen, LogIn, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { addDocumentNonBlocking, useMemoFirebase } from '@/firebase';

export default function VisitorCheckIn() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [step, setStep] = useState<'purpose' | 'welcome'>('purpose');
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose | ''>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get user profile if it exists
  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    if (!user || !db) return;
    if (!selectedPurpose) {
      toast({
        title: "Purpose Required",
        description: "Please select why you are visiting today.",
        variant: "destructive"
      });
      return;
    }

    if (profile?.isBlocked) {
      toast({
        title: "Access Denied",
        description: "Your library access has been suspended.",
        variant: "destructive"
      });
      return;
    }

    const logRef = collection(db, 'visitorLogs');
    addDocumentNonBlocking(logRef, {
      visitorId: user.uid,
      visitorName: user.displayName || 'Anonymous',
      visitorEmail: user.email,
      visitorType: profile?.visitorType || 'Guest',
      college: profile?.collegeOrOffice || 'N/A',
      purpose: selectedPurpose,
      entryDateTime: new Date().toISOString()
    });

    setStep('welcome');
    setTimeout(() => {
      setStep('purpose');
      setSelectedPurpose('');
    }, 5000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p>Please sign in to access the visitor terminal.</p>
          <Link href="/"><Button className="mt-4">Go to Login</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6 border-b bg-white flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-primary font-headline font-bold text-xl">
          <DoorOpen className="h-6 w-6 text-accent" />
          ScholarFlow Terminal
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-primary font-mono font-medium">
            <Clock className="h-4 w-4" />
            {format(currentTime, 'hh:mm:ss aa')}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {step === 'purpose' && (
            <Card className="shadow-xl border-none">
              <CardHeader className="bg-primary text-white rounded-t-lg text-center py-8">
                <CardTitle className="text-3xl font-headline">Welcome, {user.displayName || 'Visitor'}!</CardTitle>
                <CardDescription className="text-white/70">Identify your purpose of visit to enter</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-xl font-headline text-primary">Purpose of Visit</Label>
                  <RadioGroup onValueChange={(v) => setSelectedPurpose(v as Purpose)} className="grid gap-3">
                    {VISIT_PURPOSES.map((purpose) => (
                      <div key={purpose} className="flex items-center space-x-2">
                        <RadioGroupItem value={purpose} id={purpose} className="peer sr-only" />
                        <Label
                          htmlFor={purpose}
                          className={cn(
                            "flex flex-1 items-center justify-between rounded-xl border-2 border-muted p-4 hover:bg-accent/5 hover:border-accent cursor-pointer transition-all",
                            selectedPurpose === purpose && "border-accent bg-accent/10 ring-2 ring-accent ring-offset-2"
                          )}
                        >
                          <span className="font-medium text-lg">{purpose}</span>
                          {selectedPurpose === purpose && <CheckCircle2 className="h-5 w-5 text-accent" />}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex gap-4">
                  <Link href="/" className="flex-1"><Button variant="outline" className="w-full h-12">Cancel</Button></Link>
                  <Button className="flex-[2] h-12 bg-accent hover:bg-accent/90" onClick={handleCheckIn}>
                    <LogIn className="mr-2 h-4 w-4" /> Check-in
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'welcome' && (
            <Card className="shadow-2xl border-none text-white overflow-hidden bg-accent">
              <CardContent className="p-16 text-center space-y-6">
                <div className="bg-white/20 p-6 rounded-full w-fit mx-auto backdrop-blur-sm">
                  <CheckCircle2 className="h-20 w-20" />
                </div>
                <h1 className="text-5xl font-headline font-bold">Welcome to NEU Library!</h1>
                <p className="text-2xl font-light opacity-90">{user.displayName}</p>
                <p className="text-white/60 pt-4 italic animate-pulse">
                  Check-in successful. Resetting terminal...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}