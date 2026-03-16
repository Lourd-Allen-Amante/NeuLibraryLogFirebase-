
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VISIT_PURPOSES, Purpose } from '@/lib/types';
import { CheckCircle2, Clock, DoorOpen, Scan, Keyboard, CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function VisitorCheckIn() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [step, setStep] = useState<'identify' | 'purpose' | 'welcome'>('identify');
  const [idMethod, setIdMethod] = useState<'input' | 'rfid' | null>(null);
  const [schoolId, setSchoolId] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose | ''>('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [user, isUserLoading, auth]);

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    
    let formatted = value;
    if (value.length > 2) formatted = `${value.slice(0, 2)}-${value.slice(2)}`;
    if (value.length > 7) formatted = `${value.slice(0, 2)}-${value.slice(2, 7)}-${value.slice(7)}`;
    
    setSchoolId(formatted);
  };

  const validateAndProceed = () => {
    if (profile?.isBlocked) {
      toast({
        title: "Access Suspended",
        description: "Your library access is currently blocked. Please contact the librarian.",
        variant: "destructive"
      });
      return;
    }

    if (idMethod === 'input' && !/^\d{2}-\d{5}-\d{3}$/.test(schoolId)) {
      toast({
        title: "Invalid Format",
        description: "Please enter your ID in 00-00000-000 format.",
        variant: "destructive"
      });
      return;
    }

    setStep('purpose');
  };

  const handleCheckIn = () => {
    if (!user || !db) {
      toast({
        title: "System Not Ready",
        description: "Please wait for the terminal to initialize.",
        variant: "destructive"
      });
      return;
    }

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
      schoolId: schoolId || profile?.schoolId || 'N/A',
      visitorName: 'Student',
      visitorEmail: user.email || 'anonymous@terminal.neu',
      visitorType: profile?.visitorType || 'Student',
      college: profile?.collegeOrOffice || 'General',
      purpose: selectedPurpose,
      entryDateTime: new Date().toISOString()
    });

    setStep('welcome');
    setTimeout(() => {
      setStep('identify');
      setSelectedPurpose('');
      setSchoolId('');
      setIdMethod(null);
    }, 5000);
  };

  if (isUserLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F8]">
        <Loader2 className="h-10 w-10 text-[#1B4332] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col font-body">
      <header className="p-6 border-b border-emerald-100 bg-white flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-[#1B4332] font-headline font-bold text-2xl">
          <DoorOpen className="h-8 w-8 text-emerald-600" />
          Library Terminal
        </Link>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-emerald-800/60 uppercase tracking-[0.2em] font-bold">Terminal Clock</span>
          <div className="flex items-center gap-2 text-[#1B4332] font-mono text-xl font-bold">
            <Clock className="h-5 w-5 text-emerald-600" />
            {currentTime ? format(currentTime, 'hh:mm:ss aa') : '--:--:--'}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {step === 'identify' && (
            <Card className="shadow-2xl border-none overflow-hidden rounded-3xl">
              <div className="bg-[#1B4332] p-10 text-center text-white">
                <h2 className="text-3xl font-headline font-bold mb-2">Identification</h2>
                <p className="text-emerald-100/70">Welcome, Student. How will you identify today?</p>
              </div>
              <CardContent className="p-10 space-y-8 bg-white">
                {!idMethod ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-40 flex flex-col gap-4 rounded-3xl border-2 border-emerald-50 hover:border-[#1B4332] hover:bg-emerald-50 transition-all group"
                        onClick={() => setIdMethod('input')}
                      >
                        <Keyboard className="h-12 w-12 text-[#1B4332] group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg text-emerald-900">Input School ID</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-40 flex flex-col gap-4 rounded-3xl border-2 border-emerald-50 hover:border-[#1B4332] hover:bg-emerald-50 transition-all group"
                        onClick={() => setIdMethod('rfid')}
                      >
                        <CreditCard className="h-12 w-12 text-[#1B4332] group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg text-emerald-900">Tap ID Card (RFID)</span>
                      </Button>
                    </div>
                    <Link href="/" className="block">
                      <Button variant="ghost" className="w-full h-12 text-emerald-800 hover:bg-emerald-50 font-bold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portal
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {idMethod === 'input' ? (
                      <div className="space-y-4">
                        <Label className="text-lg font-bold text-[#1B4332]">Enter School ID Number</Label>
                        <Input 
                          placeholder="00-00000-000" 
                          value={schoolId}
                          onChange={handleIdInput}
                          className="h-16 text-3xl text-center font-mono tracking-widest border-2 border-emerald-100 focus:border-[#1B4332] rounded-2xl bg-emerald-50/20"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center bg-emerald-50/50 rounded-3xl border-2 border-dashed border-emerald-600 group cursor-pointer" onClick={() => validateAndProceed()}>
                        <div className="relative">
                          <Scan className="h-24 w-24 text-emerald-600 animate-pulse" />
                          <CreditCard className="h-12 w-12 text-[#1B4332] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="mt-6 text-xl font-bold text-[#1B4332]">Place ID card near the reader</p>
                        <p className="text-sm text-emerald-600/60 mt-2">(Click here to simulate tap)</p>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <Button variant="ghost" className="h-14 flex-1 rounded-xl text-emerald-800 hover:bg-emerald-50 font-bold" onClick={() => { setIdMethod(null); setSchoolId(''); }}>Back</Button>
                      {idMethod === 'input' && (
                        <Button className="h-14 flex-[2] bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xl font-headline rounded-xl shadow-lg" onClick={validateAndProceed}>
                          Verify ID
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 'purpose' && (
            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden">
              <CardHeader className="bg-[#1B4332] text-white text-center py-10">
                <CardTitle className="text-4xl font-headline font-bold">Mabuhay, Student!</CardTitle>
                <CardDescription className="text-emerald-100 text-lg">Select your purpose for visiting today</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8 bg-white">
                <RadioGroup onValueChange={(v) => setSelectedPurpose(v as Purpose)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {VISIT_PURPOSES.map((purpose) => (
                    <div key={purpose}>
                      <RadioGroupItem value={purpose} id={purpose} className="peer sr-only" />
                      <Label
                        htmlFor={purpose}
                        className={cn(
                          "relative flex flex-col items-start justify-center rounded-2xl border-2 border-emerald-50 p-6 hover:bg-emerald-50/50 hover:border-[#1B4332] cursor-pointer transition-all h-32",
                          selectedPurpose === purpose && "border-[#1B4332] bg-emerald-50 ring-2 ring-[#1B4332] ring-offset-2"
                        )}
                      >
                        <span className="font-headline font-bold text-xl text-[#1B4332]">{purpose}</span>
                        <span className="text-[10px] text-emerald-800/40 mt-1 uppercase tracking-[0.2em] font-bold">Activity</span>
                        {selectedPurpose === purpose && (
                          <div className="absolute top-4 right-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 h-14 text-lg rounded-xl border-emerald-100 text-emerald-800 hover:bg-emerald-50 font-bold" onClick={() => setStep('identify')}>Back</Button>
                  <Button className="flex-[2] h-14 text-xl font-headline bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow-lg" onClick={handleCheckIn}>
                    Record Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'welcome' && (
            <Card className="shadow-2xl border-none text-white overflow-hidden bg-[#1B4332] animate-in zoom-in duration-300 rounded-3xl">
              <CardContent className="p-20 text-center space-y-8">
                <div className="bg-white/20 p-8 rounded-full w-fit mx-auto backdrop-blur-md shadow-inner">
                  <CheckCircle2 className="h-24 w-24 text-emerald-400" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-6xl font-headline font-bold tracking-tight">Welcome to NEU Library!</h1>
                  <p className="text-2xl font-light text-emerald-50 opacity-90">Visitor Validated</p>
                </div>
                <div className="pt-10">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-sm font-medium">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    Resetting terminal for next visitor...
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <footer className="p-6 text-center text-emerald-800/40 flex items-center justify-center gap-4">
        <span className="text-[10px] uppercase tracking-[0.4em]">New Era University • Library Management System</span>
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-800/20 hover:text-emerald-600 transition-colors">
            <Scan className="h-4 w-4" />
          </Button>
        </Link>
      </footer>
    </div>
  );
}
