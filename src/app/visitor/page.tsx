
"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VISIT_PURPOSES, UserProfile, Purpose } from '@/lib/types';
import { MOCK_USERS } from '@/lib/mock-data';
import { Scan, Mail, CheckCircle2, ArrowLeft, LogIn, Clock, DoorOpen, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function VisitorCheckIn() {
  const { toast } = useToast();
  const [mode, setMode] = useState<'checkin' | 'checkout'>('checkin');
  const [step, setStep] = useState<'identify' | 'purpose' | 'welcome'>('identify');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose | ''>('');
  const [emailInput, setEmailInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleIdentify = (method: 'rfid' | 'email') => {
    let user: UserProfile | undefined;
    
    if (method === 'rfid') {
      user = MOCK_USERS.find(u => u.schoolId === '2023-0001'); // Mock RFID scan
    } else {
      if (!emailInput.includes('@neu.edu.ph')) {
        toast({
          title: "Invalid Email",
          description: "Please use your institutional @neu.edu.ph email.",
          variant: "destructive"
        });
        return;
      }
      user = MOCK_USERS.find(u => u.email === emailInput);
    }

    if (user) {
      if (user.isBlocked) {
        toast({
          title: "Access Denied",
          description: "Your library access has been suspended.",
          variant: "destructive"
        });
        return;
      }
      setCurrentUser(user);
      
      if (mode === 'checkout') {
        setStep('welcome');
        setTimeout(() => reset(), 3000);
      } else {
        setStep('purpose');
      }
    } else {
      toast({
        title: "Account Not Found",
        description: "Please register at the help desk if you are a new visitor.",
        variant: "destructive"
      });
    }
  };

  const handleCompleteVisit = () => {
    if (!selectedPurpose) {
      toast({
        title: "Purpose Required",
        description: "Please select why you are visiting today.",
        variant: "destructive"
      });
      return;
    }
    setStep('welcome');
    setTimeout(() => reset(), 5000);
  };

  const reset = () => {
    setStep('identify');
    setCurrentUser(null);
    setSelectedPurpose('');
    setEmailInput('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6 border-b bg-white flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-primary font-headline font-bold text-xl">
          <DoorOpen className="h-6 w-6 text-accent" />
          ScholarFlow
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-primary font-mono font-medium">
            <Clock className="h-4 w-4" />
            {format(currentTime, 'hh:mm:ss aa')}
          </div>
          <Tabs value={mode} onValueChange={(v) => { setMode(v as any); reset(); }}>
            <TabsList className="bg-muted">
              <TabsTrigger value="checkin" className="data-[state=active]:bg-accent data-[state=active]:text-white">Check-in</TabsTrigger>
              <TabsTrigger value="checkout" className="data-[state=active]:bg-primary data-[state=active]:text-white">Check-out</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {step === 'identify' && (
            <Card className="shadow-xl border-none">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline font-bold">
                  {mode === 'checkin' ? 'Welcome to NEU Library' : 'Leaving the Library?'}
                </CardTitle>
                <CardDescription className="text-lg">
                  {mode === 'checkin' ? 'Please identify yourself to enter' : 'Scan to complete your session'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 py-8">
                <div 
                  onClick={() => handleIdentify('rfid')}
                  className="group cursor-pointer border-2 border-dashed border-muted hover:border-accent hover:bg-accent/5 rounded-2xl p-10 flex flex-col items-center justify-center transition-all"
                >
                  <div className="bg-muted group-hover:bg-accent/20 p-6 rounded-full transition-colors">
                    <Scan className="h-16 w-16 text-muted-foreground group-hover:text-accent" />
                  </div>
                  <p className="mt-4 font-headline text-xl font-semibold text-muted-foreground group-hover:text-primary">
                    Tap ID Card
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or Use Email</span></div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Institutional Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        placeholder="user@neu.edu.ph" 
                        className="pl-10 h-12"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    className={cn("w-full h-12 font-headline", mode === 'checkin' ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90")}
                    onClick={() => handleIdentify('email')}
                  >
                    {mode === 'checkin' ? <LogIn className="mr-2 h-4 w-4" /> : <LogOut className="mr-2 h-4 w-4" />}
                    {mode === 'checkin' ? 'Check-in' : 'Check-out'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'purpose' && currentUser && (
            <Card className="shadow-xl border-none">
              <CardHeader className="bg-accent text-white rounded-t-lg text-center py-8">
                <CardTitle className="text-3xl font-headline">Identity Confirmed</CardTitle>
                <p className="text-white/80 text-lg mt-2">{currentUser.name}</p>
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
                  <Button variant="outline" className="flex-1 h-12" onClick={reset}>Back</Button>
                  <Button className="flex-[2] h-12 bg-accent hover:bg-accent/90" onClick={handleCompleteVisit}>Proceed</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'welcome' && currentUser && (
            <Card className={cn("shadow-2xl border-none text-white overflow-hidden", mode === 'checkin' ? "bg-accent" : "bg-primary")}>
              <CardContent className="p-16 text-center space-y-6">
                <div className="bg-white/20 p-6 rounded-full w-fit mx-auto backdrop-blur-sm">
                  <CheckCircle2 className="h-20 w-20" />
                </div>
                <h1 className="text-5xl font-headline font-bold">
                  {mode === 'checkin' ? 'Welcome!' : 'Safe Travels!'}
                </h1>
                <p className="text-2xl font-light opacity-90">{currentUser.name}</p>
                <p className="text-white/60 pt-4 italic animate-pulse">
                  {mode === 'checkin' ? 'Gate access granted. Resetting terminal...' : 'Log updated. Thank you for visiting!'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
