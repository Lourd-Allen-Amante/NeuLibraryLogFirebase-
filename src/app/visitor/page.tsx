"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VISIT_PURPOSES, Purpose } from '@/lib/types';
import { CheckCircle2, Clock, DoorOpen, Scan, Keyboard, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useFirestore, useAuth, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export default function VisitorCheckIn() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  
  const [step, setStep] = useState<'identify' | 'purpose' | 'welcome'>('identify');
  const [idMethod, setIdMethod] = useState<'schoolId' | 'email' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose | ''>('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ensure an anonymous session for logging if not logged in
  useEffect(() => {
    if (!user && auth) {
      signInAnonymously(auth).catch((err) => console.error("Anonymous auth failed", err));
    }
  }, [user, auth]);

  // Real-time clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (idMethod === 'schoolId') {
      // Auto-formatting for 00-00000-000
      value = value.replace(/\D/g, '');
      if (value.length > 10) value = value.slice(0, 10);
      let formatted = value;
      if (value.length > 2) formatted = `${value.slice(0, 2)}-${value.slice(2)}`;
      if (value.length > 7) formatted = `${value.slice(0, 2)}-${value.slice(2, 7)}-${value.slice(7)}`;
      setInputValue(formatted);
    } else {
      setInputValue(value);
    }
  };

  const validateAndProceed = () => {
    if (idMethod === 'schoolId' && !/^\d{2}-\d{5}-\d{3}$/.test(inputValue)) {
      toast({ 
        title: "Invalid Format", 
        description: "Please enter a valid School ID (00-00000-000).", 
        variant: "destructive" 
      });
      return;
    }
    if (idMethod === 'email' && !inputValue.toLowerCase().endsWith('@neu.edu.ph')) {
      toast({ 
        title: "Institutional Email Required", 
        description: "Please use your official @neu.edu.ph email.", 
        variant: "destructive" 
      });
      return;
    }
    if (!inputValue) {
      toast({ title: "Identification Required", variant: "destructive" });
      return;
    }
    setStep('purpose');
  };

  const handleCheckIn = async () => {
    if (!selectedPurpose) {
      toast({ title: "Please select a purpose", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'visitorLogs'), {
        visitorId: user?.uid || 'anonymous-terminal',
        schoolId: idMethod === 'schoolId' ? inputValue : 'N/A',
        visitorEmail: idMethod === 'email' ? inputValue : 'N/A',
        visitorName: 'Student', // Generalized as requested
        visitorType: 'Student',
        college: 'General',
        purpose: selectedPurpose,
        entryDateTime: new Date().toISOString()
      });

      setStep('welcome');
      
      // Auto-reset the terminal for the next student
      setTimeout(() => {
        setStep('identify');
        setIdMethod(null);
        setInputValue('');
        setSelectedPurpose('');
        setIsProcessing(false);
      }, 5000);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to record entry", variant: "destructive" });
      setIsProcessing(false);
    }
  };

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
                <p className="text-emerald-100/70">Welcome, Student. Choose your identification method.</p>
              </div>
              <CardContent className="p-10 space-y-8 bg-white">
                {!idMethod ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-44 flex flex-col gap-4 rounded-3xl border-2 border-emerald-50 hover:border-[#1B4332] hover:bg-emerald-50 transition-all group"
                      onClick={() => setIdMethod('schoolId')}
                    >
                      <Keyboard className="h-12 w-12 text-[#1B4332] group-hover:scale-110 transition-transform" />
                      <div className="text-center">
                        <span className="block font-bold text-lg text-emerald-900 leading-tight">School ID / RFID</span>
                        <span className="text-[10px] text-emerald-600/60 mt-1 uppercase font-bold tracking-widest">00-00000-000</span>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-44 flex flex-col gap-4 rounded-3xl border-2 border-emerald-50 hover:border-[#1B4332] hover:bg-emerald-50 transition-all group"
                      onClick={() => setIdMethod('email')}
                    >
                      <Mail className="h-12 w-12 text-[#1B4332] group-hover:scale-110 transition-transform" />
                      <div className="text-center">
                        <span className="block font-bold text-lg text-emerald-900 leading-tight">Institutional Email</span>
                        <span className="text-[10px] text-emerald-600/60 mt-1 uppercase font-bold tracking-widest">@neu.edu.ph</span>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-4">
                      <Label className="text-lg font-bold text-[#1B4332]">
                        {idMethod === 'schoolId' ? 'Enter School ID or Tap RFID' : 'Enter Institutional Email'}
                      </Label>
                      <Input 
                        placeholder={idMethod === 'schoolId' ? "00-00000-000" : "firstname.lastname@neu.edu.ph"} 
                        value={inputValue}
                        onChange={handleIdInput}
                        className="h-16 text-2xl text-center font-mono tracking-widest border-2 border-emerald-100 focus:border-[#1B4332] rounded-2xl bg-emerald-50/20"
                        autoFocus
                      />
                      {idMethod === 'schoolId' && (
                        <div className="py-6 flex flex-col items-center justify-center bg-emerald-50/50 rounded-2xl border-2 border-dashed border-emerald-200">
                           <Scan className="h-10 w-10 text-emerald-600 animate-pulse mb-2" />
                           <span className="text-[10px] uppercase font-bold text-emerald-800/40 tracking-[0.2em]">RFID Sensor Active</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-4">
                      <Button variant="ghost" className="h-14 flex-1 rounded-xl text-emerald-800 hover:bg-emerald-50 font-bold" onClick={() => { setIdMethod(null); setInputValue(''); }}>Back</Button>
                      <Button 
                        className="h-14 flex-[2] bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xl font-headline rounded-xl shadow-lg" 
                        onClick={validateAndProceed}
                      >
                        Verify & Continue
                      </Button>
                    </div>
                  </div>
                )}
                
                <Link href="/" className="block">
                  <Button variant="ghost" className="w-full h-12 text-emerald-800/40 hover:text-[#1B4332] font-bold text-[10px] uppercase tracking-widest">
                    <ArrowLeft className="mr-2 h-3 w-3" /> Back to Portal
                  </Button>
                </Link>
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
                  <Button 
                    className="flex-[2] h-14 text-xl font-headline bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow-lg" 
                    onClick={handleCheckIn}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Record Entry'}
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
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-xs font-medium uppercase tracking-widest">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    Terminal resetting in 5 seconds...
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <footer className="p-6 text-center text-emerald-800/10 text-[8px] uppercase tracking-[0.4em]">
        New Era University • Library Terminal Management
      </footer>
    </div>
  );
}
