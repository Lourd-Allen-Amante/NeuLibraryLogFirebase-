
"use client"

import React, { useState, useEffect } from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  ShieldAlert, 
  FileDown, 
  TrendingUp,
  Search,
  Filter,
  Calendar,
  MoreVertical,
  Ban,
  Unlock,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { INITIAL_VISITS, MOCK_USERS } from '@/lib/mock-data';
import { format, subDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { adminVisitorTrendSummaries } from '@/ai/flows/admin-visitor-trend-summaries';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [visits, setVisits] = useState(INITIAL_VISITS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [filterDate, setFilterDate] = useState<'day' | 'week' | 'month' | 'all'>('week');

  const adminAvatar = PlaceHolderImages.find(img => img.id === 'admin-avatar');

  // Calculate stats
  const today = startOfDay(new Date());
  const dailyVisits = visits.filter(v => startOfDay(parseISO(v.timestamp)).getTime() === today.getTime());
  const weeklyVisits = visits.filter(v => isWithinInterval(parseISO(v.timestamp), {
    start: subDays(today, 7),
    end: new Date()
  }));

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const count = visits.filter(v => startOfDay(parseISO(v.timestamp)).getTime() === date.getTime()).length;
    return {
      name: format(date, 'EEE'),
      visitors: count
    };
  });

  const generateAiSummary = async () => {
    setIsSummarizing(true);
    try {
      const result = await adminVisitorTrendSummaries({
        periodDescription: `Last 7 days (weekly statistics)`,
        visitorEntries: weeklyVisits.map(v => ({
          timestamp: v.timestamp,
          purposeOfVisit: v.purpose
        }))
      });
      setAiSummary(result.summary);
    } catch (error) {
      toast({
        title: "AI Analysis Failed",
        description: "Could not generate trend summary at this time.",
        variant: "destructive"
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleBlockUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
    const user = users.find(u => u.id === userId);
    toast({
      title: user?.isBlocked ? "User Unblocked" : "User Blocked",
      description: `${user?.name} has been ${user?.isBlocked ? 'unblocked' : 'blocked'} from entering the library.`
    });
  };

  const handleDownloadPdf = () => {
    toast({
      title: "PDF Report Generated",
      description: "NEU_Library_Statistics_Report.pdf is downloading..."
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white hidden lg:flex flex-col border-r border-primary-foreground/10">
        <div className="p-6">
          <div className="flex items-center gap-2 font-headline font-bold text-2xl mb-8">
            <LayoutDashboard className="h-6 w-6 text-accent" />
            ScholarFlow
          </div>
          
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 font-medium">
              <TrendingUp className="mr-3 h-5 w-5" /> Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/10 font-medium">
              <ClipboardList className="mr-3 h-5 w-5" /> Visitor Logs
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/10 font-medium">
              <Users className="mr-3 h-5 w-5" /> Membership
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/10 font-medium">
              <ShieldAlert className="mr-3 h-5 w-5" /> Access Control
            </Button>
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-accent">
               <Image src={adminAvatar?.imageUrl || ''} alt="Admin" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold">Admin User</p>
              <p className="text-xs text-blue-200/60">Library Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Administration Console</h1>
            <p className="text-muted-foreground">Monitor and manage NEU Library visitor flow</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadPdf} className="bg-white border-primary/20 text-primary">
              <FileDown className="mr-2 h-4 w-4" /> Export Report
            </Button>
            <Button className="bg-accent hover:bg-accent/90">
              <Calendar className="mr-2 h-4 w-4" /> Custom Range
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardDescription>Total Visitors Today</CardDescription>
              <CardTitle className="text-3xl font-headline">{dailyVisits.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-emerald-600 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" /> +12% from yesterday
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardDescription>Weekly Average</CardDescription>
              <CardTitle className="text-3xl font-headline">{(weeklyVisits.length / 7).toFixed(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground">
                Stable traffic flow
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardDescription>Peak Usage Time</CardDescription>
              <CardTitle className="text-3xl font-headline">2:30 PM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground">
                Typically between 2pm-4pm
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardDescription>Most Frequent Purpose</CardDescription>
              <CardTitle className="text-2xl font-headline truncate">Research</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-accent font-medium">
                42% of total visits
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Area */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl">Visitor Trends</CardTitle>
                  <CardDescription>Number of visitors over the past 7 days</CardDescription>
                </div>
                <Tabs defaultValue="week" onValueChange={(v) => setFilterDate(v as any)}>
                  <TabsList className="bg-muted">
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#888', fontSize: 12}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#888', fontSize: 12}} 
                    />
                    <RechartsTooltip 
                      cursor={{fill: '#f1f5f8'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="visitors" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                       {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 6 ? 'hsl(var(--accent))' : 'hsl(var(--primary))'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="font-headline text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    AI Intelligence Report
                  </CardTitle>
                  <CardDescription>Generative analysis of visitor patterns and anomalies</CardDescription>
                </div>
                {!aiSummary && !isSummarizing && (
                  <Button size="sm" onClick={generateAiSummary} className="bg-accent hover:bg-accent/90">
                    Analyze Data
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isSummarizing ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-10 w-10 text-accent animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Scanning visitor logs and identifying trends...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="bg-accent/5 rounded-xl p-6 border border-accent/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Sparkles className="h-20 w-20 text-accent" />
                    </div>
                    <p className="text-primary leading-relaxed relative z-10">
                      {aiSummary}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10" onClick={generateAiSummary}>
                        Refresh Analysis
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                    <p className="text-muted-foreground max-w-sm">Click "Analyze Data" to generate an AI-powered summary of your current library traffic and visitor purposes.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Logs Table */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl">Recent Visitors</CardTitle>
                  <CardDescription>Live feed of library entries</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search name/ID..." className="pl-10 w-[240px]" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Visitor</TableHead>
                      <TableHead>College/Office</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.slice(0, 6).map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-accent/5">
                        <TableCell className="font-medium">{visit.userName}</TableCell>
                        <TableCell>{visit.college}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">{visit.purpose}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{format(parseISO(visit.timestamp), 'h:mm a')}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="justify-center border-t py-4">
                <Button variant="link" className="text-primary font-headline">View All Visitor Logs</Button>
              </CardFooter>
            </Card>
          </div>

          {/* User Management Sidebar */}
          <div className="space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Member Access Control</CardTitle>
                <CardDescription>Monitor and block library access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${user.isBlocked ? 'bg-destructive' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.schoolId}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleBlockUser(user.id)}
                      className={user.isBlocked ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-destructive hover:text-destructive hover:bg-destructive/5'}
                    >
                      {user.isBlocked ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Manage All Members</Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-sm bg-primary text-white">
              <CardHeader>
                <CardTitle className="font-headline text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Terminal #01</span>
                  <Badge variant="outline" className="text-white border-white/20 bg-emerald-500/20">Online</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">RFID Scanners</span>
                  <Badge variant="outline" className="text-white border-white/20 bg-emerald-500/20">Operational</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Cloud Sync</span>
                  <span className="text-blue-200">Just now</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
