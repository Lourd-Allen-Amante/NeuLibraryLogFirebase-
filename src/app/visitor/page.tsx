
"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VISIT_PURPOSES, MOCK_USERS, UserProfile, VisitRecord, Purpose } from '@/lib/types';
import { Scan, Mail, CheckCircle2, ArrowLeft, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function VisitorCheckIn() {
  const { toast } = useToast();
  const [step, setStep] = useState<'identify' | 'purpose' | 'welcome'>('identify');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose | ''>('');
  const [emailInput, setEmailInput] = useState('');

  const handleIdentify = (method: 'rfid' | 'email') => {
    // Simulate finding a user. In real app, this would be an API call.
    let user: UserProfile | undefined;
    
    if (method === 'rfid') {
      user = MOCK_USERS.find(u => u.schoolId === '2023-0001');
    } else {
      if (!emailInput.includes('@neu.edu.ph')) {
        toast({
          title: "Invalid Email",
          description: "Please use your institutional NEU email.",
          variant: "destructive"
        });
        return;
      }
      user = MOCK_USERS.find(u => u.email === emailInput);
    }

    if (user) {
      if (user.isBlocked) {
        toast({
          title: "Entry Denied",
          description: "Your access has been temporarily suspended. Please contact the librarian.",
          variant: "destructive"
        });
        return;
      }
      setCurrentUser(user);
      setStep('purpose');
    } else {
      toast({
        title: "User Not Found",
        description: "Credentials not recognized. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCompleteVisit = () => {
    if (!selectedPurpose) {
      toast({
        title: "Purpose Required",
        description: "Please select your primary purpose of visit.",
        variant: "destructive"
      });
      return;
    }
    
    // Logic to save the visit would go here
    setStep('welcome');
    setTimeout(() => {
      // Reset for next visitor after 5 seconds
      reset();
    }, 5000);
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
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition-colors font-headline font-bold text-xl">
          <Scan className="h-6 w-6" />
          NEU ScholarFlow
        </Link>
        <div className="text-muted-foreground text-sm font-medium">
          Library Terminal #01
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {step === 'identify' && (
            <Card className="shadow-xl border-none">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-3xl font-headline font-bold">Visitor Check-in</CardTitle>
                <CardDescription className="text-lg">Please tap your ID card or login with email</CardDescription>
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
                    Tap RFID ID Card
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with Email</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Institutional Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        placeholder="yourname@neu.edu.ph" 
                        className="pl-10 h-12"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full h-12 font-headline bg-primary hover:bg-primary/90" 
                    onClick={() => handleIdentify('email')}
                  >
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'purpose' && currentUser && (
            <Card className="shadow-xl border-none">
              <CardHeader className="bg-primary text-white rounded-t-lg text-center py-8">
                <div className="bg-white/10 p-3 rounded-full w-fit mx-auto mb-4">
                  <UserCircle2 className="h-12 w-12" />
                </div>
                <CardTitle className="text-3xl font-headline">Authenticated</CardTitle>
                <p className="text-blue-100 text-lg">{currentUser.name}</p>
                <p className="text-blue-200 text-sm opacity-80 uppercase tracking-widest mt-1">
                  {currentUser.college || currentUser.office}
                </p>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-xl font-headline text-primary">Purpose of Visit</Label>
                  <RadioGroup 
                    onValueChange={(v) => setSelectedPurpose(v as Purpose)}
                    className="grid gap-3"
                  >
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
                  <Button variant="outline" className="flex-1 h-12" onClick={reset}>
                    Cancel
                  </Button>
                  <Button className="flex-[2] h-12 bg-accent hover:bg-accent/90" onClick={handleCompleteVisit}>
                    Enter Library
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'welcome' && currentUser && (
            <Card className="shadow-2xl border-none bg-accent overflow-hidden">
              <CardContent className="p-0">
                <div className="p-16 text-center space-y-6 text-white animate-in zoom-in-95 duration-500">
                  <div className="bg-white/20 p-6 rounded-full w-fit mx-auto mb-4 backdrop-blur-sm">
                    <CheckCircle2 className="h-24 w-24" />
                  </div>
                  <h1 className="text-6xl font-headline font-bold">Welcome!</h1>
                  <div className="space-y-2">
                    <p className="text-2xl font-light">Welcome to NEU Library!</p>
                    <p className="text-3xl font-semibold opacity-90">{currentUser.name}</p>
                  </div>
                  <p className="text-blue-100/60 pt-8 animate-pulse italic">
                    You may now proceed to the library gates. This screen will reset shortly...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function UserCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
