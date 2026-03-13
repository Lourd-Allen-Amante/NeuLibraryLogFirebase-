
"use client"

import React, { useState, useMemo } from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
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
  Calendar,
  MoreVertical,
  Ban,
  Unlock,
  Sparkles,
  Loader2,
  Trash2,
  CheckCircle,
  Filter
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('All');

  const adminAvatar = PlaceHolderImages.find(img => img.id === 'admin-avatar');

  // Stats calculation
  const today = startOfDay(new Date());
  const dailyVisits = visits.filter(v => startOfDay(parseISO(v.timestamp)).getTime() === today.getTime());
  const weeklyVisits = visits.filter(v => isWithinInterval(parseISO(v.timestamp), {
    start: subDays(today, 7),
    end: new Date()
  }));

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const matchesSearch = v.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           v.college.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPurpose = purposeFilter === 'All' || v.purpose === purposeFilter;
      return matchesSearch && matchesPurpose;
    });
  }, [visits, searchQuery, purposeFilter]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const count = visits.filter(v => startOfDay(parseISO(v.timestamp)).getTime() === date.getTime()).length;
      return {
        name: format(date, 'EEE'),
        visitors: count
      };
    });
  }, [visits, today]);

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
      description: `${user?.name} has been ${user?.isBlocked ? 'unblocked' : 'blocked'} from library access.`
    });
  };

  const handleDeleteVisit = (visitId: string) => {
    setVisits(visits.filter(v => v.id !== visitId));
    toast({
      title: "Log Removed",
      description: "The visitor entry has been deleted from history."
    });
  };

  const handleDownloadPdf = () => {
    toast({
      title: "Report Exported",
      description: "NEU_Visitor_Report.pdf is ready."
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
            <Button variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/10 font-medium text-destructive-foreground hover:bg-destructive/10">
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
            <h1 className="text-3xl font-headline font-bold text-primary">Administration</h1>
            <p className="text-muted-foreground">Monitor and manage library visitor logs</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadPdf} className="bg-white">
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button className="bg-accent hover:bg-accent/90">
              <Calendar className="mr-2 h-4 w-4" /> Reports
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Today's Visitors</CardDescription>
              <CardTitle className="text-3xl font-headline">{dailyVisits.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Weekly Average</CardDescription>
              <CardTitle className="text-3xl font-headline">{(weeklyVisits.length / 7).toFixed(1)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Live Visitors</CardDescription>
              <CardTitle className="text-3xl font-headline text-accent">14</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Capacity Utilization</CardDescription>
              <CardTitle className="text-3xl font-headline">28%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl">Visitor Trends</CardTitle>
                  <CardDescription>Last 7 days volume</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-[250px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                    <RechartsTooltip cursor={{fill: '#f1f5f8'}} />
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl">Live Visitor Feed</CardTitle>
                  <CardDescription>Manage current sessions and history</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search..." 
                      className="pl-10 w-[200px]" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPurposeFilter('All')}>All Purposes</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPurposeFilter('Reading Books')}>Reading</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPurposeFilter('Research in Thesis')}>Research</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPurposeFilter('Doing Assignments')}>Assignments</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.slice(0, 10).map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">{visit.userName}</TableCell>
                        <TableCell>{visit.college}</TableCell>
                        <TableCell><Badge variant="outline">{visit.purpose}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-xs">{format(parseISO(visit.timestamp), 'h:mm a')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-emerald-600">
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Left
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteVisit(visit.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-xl">AI Insights</CardTitle>
                <CardDescription>Pattern analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {isSummarizing ? (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-8 w-8 text-accent animate-spin mb-2" />
                    <p className="text-xs text-muted-foreground">Analyzing patterns...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                    <p className="text-sm leading-relaxed">{aiSummary}</p>
                    <Button variant="ghost" size="sm" className="mt-4 text-accent p-0" onClick={generateAiSummary}>Recalculate</Button>
                  </div>
                ) : (
                  <Button className="w-full bg-accent hover:bg-accent/90" onClick={generateAiSummary}>
                    <Sparkles className="mr-2 h-4 w-4" /> Run Weekly Analysis
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Blocked List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.filter(u => u.isBlocked).length > 0 ? (
                  users.filter(u => u.isBlocked).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="text-sm">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.schoolId}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleBlockUser(user.id)} className="text-emerald-600">
                        <Unlock className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No blocked visitors</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
