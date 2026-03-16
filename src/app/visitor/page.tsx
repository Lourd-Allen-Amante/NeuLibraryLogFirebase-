
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VISIT_PURPOSES, Purpose } from '@/lib/types';
import { CheckCircle2, Clock, DoorOpen, Scan, UserCheck, ShieldAlert, CreditCard, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';

export default function VisitorCheckIn() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [step, setStep] = useState<'identify' | 'purpose' | 'welcome'>('identify');
  const [idMethod, setIdMethod] = useState<'input' | 'rfid' | null>(null);
  const [schoolId, setSchoolId] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose | ''>('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Get user profile if it exists
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
    
    // Format: 00-00000-000
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
      schoolId: schoolId || profile?.schoolId || 'N/A',
      visitorName: user.displayName || 'Anonymous',
      visitorEmail: user.email,
      visitorType: profile?.visitorType || (user.email?.includes('neu.edu.ph') ? 'Student' : 'Guest'),
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F8]">
        <Card className="p-8 text-center shadow-xl border-none">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-bold text-[#264D73]">Session Required</p>
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
          Library Terminal
        </Link>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Terminal Clock</span>
          <div className="flex items-center gap-2 text-[#264D73] font-mono text-xl font-bold">
            <Clock className="h-5 w-5 text-[#36BBDB]" />
            {currentTime ? format(currentTime, 'hh:mm:ss aa') : '--:--:--'}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {step === 'identify' && (
            <Card className="shadow-2xl border-none overflow-hidden">
              <div className="bg-[#264D73] p-10 text-center text-white">
                <h2 className="text-3xl font-headline font-bold mb-2">Identification</h2>
                <p className="text-blue-100/70">Welcome, {user.displayName?.split(' ')[0]}. How will you identify today?</p>
              </div>
              <CardContent className="p-10 space-y-8 bg-white">
                {!idMethod ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-40 flex flex-col gap-4 rounded-3xl border-2 hover:border-[#36BBDB] hover:bg-cyan-50/50"
                      onClick={() => setIdMethod('input')}
                    >
                      <Keyboard className="h-12 w-12 text-[#264D73]" />
                      <span className="font-bold text-lg">Input School ID</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-40 flex flex-col gap-4 rounded-3xl border-2 hover:border-[#36BBDB] hover:bg-cyan-50/50"
                      onClick={() => setIdMethod('rfid')}
                    >
                      <CreditCard className="h-12 w-12 text-[#264D73]" />
                      <span className="font-bold text-lg">Tap ID Card (RFID)</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {idMethod === 'input' ? (
                      <div className="space-y-4">
                        <Label className="text-lg font-bold text-[#264D73]">Enter School ID Number</Label>
                        <Input 
                          placeholder="00-00000-000" 
                          value={schoolId}
                          onChange={handleIdInput}
                          className="h-16 text-3xl text-center font-mono tracking-widest border-2 focus:border-[#36BBDB] rounded-2xl"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center bg-blue-50/50 rounded-3xl border-2 border-dashed border-[#36BBDB] group cursor-pointer" onClick={() => validateAndProceed()}>
                        <div className="relative">
                          <Scan className="h-24 w-24 text-[#36BBDB] animate-pulse" />
                          <CreditCard className="h-12 w-12 text-[#264D73] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="mt-6 text-xl font-bold text-[#264D73]">Place ID card near the reader</p>
                        <p className="text-sm text-muted-foreground mt-2">(Click here to simulate tap)</p>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <Button variant="ghost" className="h-14 flex-1 rounded-xl" onClick={() => { setIdMethod(null); setSchoolId(''); }}>Back</Button>
                      {idMethod === 'input' && (
                        <Button className="h-14 flex-[2] bg-[#36BBDB] hover:bg-[#2EB0D0] text-white text-xl font-headline rounded-xl" onClick={validateAndProceed}>
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
            <Card className="shadow-2xl border-none">
              <CardHeader className="bg-[#264D73] text-white rounded-t-lg text-center py-10">
                <CardTitle className="text-4xl font-headline font-bold">Mabuhay, {user.displayName?.split(' ')[0]}!</CardTitle>
                <CardDescription className="text-blue-100 text-lg">Select your purpose for visiting today</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8 bg-white">
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
                        <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.2em] font-bold">Activity</span>
                        {selectedPurpose === purpose && (
                          <div className="absolute top-4 right-4">
                            <CheckCircle2 className="h-6 w-6 text-[#36BBDB]" />
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 h-14 text-lg rounded-xl" onClick={() => setStep('identify')}>Back</Button>
                  <Button className="flex-[2] h-14 text-xl font-headline bg-[#36BBDB] hover:bg-[#2EB0D0] rounded-xl" onClick={handleCheckIn}>
                    Record Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'welcome' && (
            <Card className="shadow-2xl border-none text-white overflow-hidden bg-[#36BBDB] animate-in zoom-in duration-300">
              <CardContent className="p-20 text-center space-y-8">
                <div className="bg-white/20 p-8 rounded-full w-fit mx-auto backdrop-blur-md shadow-inner">
                  <CheckCircle2 className="h-24 w-24" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-6xl font-headline font-bold tracking-tight">Welcome to NEU Library!</h1>
                  <p className="text-2xl font-light text-blue-50 opacity-90">Validated: {user.displayName}</p>
                </div>
                <div className="pt-10">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    Resetting terminal for next visitor...
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <footer className="p-6 text-center text-muted-foreground text-[10px] uppercase tracking-[0.4em]">
        New Era University • Library Management System
      </footer>
    </div>
  );
}
