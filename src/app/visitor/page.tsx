
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VISIT_PURPOSES, Purpose } from '@/lib/types';
import { CheckCircle2, Clock, DoorOpen, Scan, UserCheck, ShieldAlert } from 'lucide-react';
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
  const [step, setStep] = useState<'scan' | 'purpose' | 'welcome'>('scan');
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose | ''>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get user profile if it exists
  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScanSimulation = () => {
    if (profile?.isBlocked) {
      toast({
        title: "Access Suspended",
        description: "Your library access is currently blocked. Please contact the librarian.",
        variant: "destructive"
      });
      return;
    }
    setStep('purpose');
  };

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

    const logRef = collection(db, 'visitorLogs');
    addDocumentNonBlocking(logRef, {
      visitorId: user.uid,
      visitorName: user.displayName || 'Anonymous',
      visitorEmail: user.email,
      visitorType: profile?.visitorType || (user.email?.includes('neu.edu.ph') ? 'Student' : 'Guest'),
      college: profile?.collegeOrOffice || 'General',
      purpose: selectedPurpose,
      entryDateTime: new Date().toISOString()
    });

    setStep('welcome');
    setTimeout(() => {
      setStep('scan');
      setSelectedPurpose('');
    }, 5000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F8]">
        <Card className="p-8 text-center shadow-xl border-none">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-bold text-[#264D73]">Session Expired</p>
          <p className="text-muted-foreground text-sm mt-1">Please sign in from the portal.</p>
          <Link href="/"><Button className="mt-6 bg-[#264D73]">Back to Portal</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F8] flex flex-col font-body">
      <header className="p-6 border-b bg-white flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-[#264D73] font-headline font-bold text-2xl">
          <DoorOpen className="h-8 w-8 text-[#36BBDB]" />
          Terminal Terminal
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Live Stream</span>
            <div className="flex items-center gap-2 text-[#264D73] font-mono text-xl font-bold">
              <Clock className="h-5 w-5 text-[#36BBDB]" />
              {format(currentTime, 'hh:mm:ss aa')}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {step === 'scan' && (
            <Card className="shadow-2xl border-none overflow-hidden">
              <div className="bg-[#264D73] p-12 text-center text-white">
                <div className="mx-auto bg-white/10 p-6 rounded-full w-fit mb-6 backdrop-blur-md">
                   <Scan className="h-16 w-16 animate-pulse" />
                </div>
                <h2 className="text-3xl font-headline font-bold mb-2">Visitor Authentication</h2>
                <p className="text-blue-100/70 italic">Simulating institutional ID verification...</p>
              </div>
              <CardContent className="p-12 flex flex-col items-center gap-8 bg-white">
                <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-2xl w-full border border-blue-100">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <UserCheck className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Identified As</p>
                    <p className="font-headline font-bold text-xl text-[#264D73]">{user.displayName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full h-20 text-xl font-headline bg-[#36BBDB] hover:bg-[#2EB0D0] shadow-lg shadow-cyan-200 rounded-2xl"
                  onClick={handleScanSimulation}
                >
                  Scan ID & Continue
                </Button>
                <Link href="/" className="text-sm text-muted-foreground hover:text-[#264D73] transition-colors">
                  Exit to Gateway
                </Link>
              </CardContent>
            </Card>
          )}

          {step === 'purpose' && (
            <Card className="shadow-2xl border-none">
              <CardHeader className="bg-[#264D73] text-white rounded-t-lg text-center py-10">
                <CardTitle className="text-4xl font-headline font-bold">Mabuhay, {user.displayName?.split(' ')[0]}!</CardTitle>
                <CardDescription className="text-blue-100 text-lg">Select your primary activity for this session</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8 bg-white">
                <div className="grid grid-cols-1 gap-4">
                  <RadioGroup onValueChange={(v) => setSelectedPurpose(v as Purpose)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {VISIT_PURPOSES.map((purpose) => (
                      <div key={purpose}>
                        <RadioGroupItem value={purpose} id={purpose} className="peer sr-only" />
                        <Label
                          htmlFor={purpose}
                          className={cn(
                            "relative flex flex-col items-start justify-center rounded-2xl border-2 border-muted p-6 hover:bg-slate-50 hover:border-[#36BBDB] cursor-pointer transition-all h-32",
                            selectedPurpose === purpose && "border-[#36BBDB] bg-cyan-50/50 ring-2 ring-[#36BBDB] ring-offset-2"
                          )}
                        >
                          <span className="font-headline font-bold text-xl text-[#264D73]">{purpose}</span>
                          <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Category</span>
                          {selectedPurpose === purpose && (
                            <div className="absolute top-4 right-4">
                              <CheckCircle2 className="h-6 w-6 text-[#36BBDB]" />
                            </div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 h-14 text-lg rounded-xl" onClick={() => setStep('scan')}>Back</Button>
                  <Button className="flex-[2] h-14 text-xl font-headline bg-[#36BBDB] hover:bg-[#2EB0D0] rounded-xl" onClick={handleCheckIn}>
                    Record Visit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'welcome' && (
            <Card className="shadow-2xl border-none text-white overflow-hidden bg-[#36BBDB]">
              <CardContent className="p-20 text-center space-y-8">
                <div className="bg-white/20 p-8 rounded-full w-fit mx-auto backdrop-blur-md shadow-inner">
                  <CheckCircle2 className="h-24 w-24" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-6xl font-headline font-bold tracking-tight">Welcome to NEU Library!</h1>
                  <p className="text-2xl font-light text-blue-50 opacity-90">{user.displayName}</p>
                </div>
                <div className="pt-10">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-sm font-medium animate-pulse">
                    <Clock className="h-4 w-4" />
                    Resetting terminal in 5 seconds...
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <footer className="p-6 text-center text-muted-foreground text-xs uppercase tracking-[0.2em]">
        Official Institutional Entry Point • New Era University
      </footer>
    </div>
  );
}
