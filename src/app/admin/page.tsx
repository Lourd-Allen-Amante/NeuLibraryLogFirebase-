"use client";

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
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Unlock,
  Sparkles,
  Loader2,
  Trash2,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, startOfDay, parseISO, isWithinInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { adminVisitorTrendSummaries } from '@/ai/flows/admin-visitor-trend-summaries';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase';
import Link from 'next/link';

export default function AdminDashboard() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('All');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [visitorTypeFilter, setVisitorTypeFilter] = useState('All');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Check if admin
  const adminRef = useMemoFirebase(() => authUser ? doc(db, 'roles_admin', authUser.uid) : null, [db, authUser]);
  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRef);

  // Fetch real logs
  const logsQuery = useMemoFirebase(() => collection(db, 'visitorLogs'), [db]);
  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery);

  const neuLogo = PlaceHolderImages.find(img => img.id === 'neu-logo');
  const adminAvatar = PlaceHolderImages.find(img => img.id === 'admin-avatar');

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const matchesSearch = log.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           log.college.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPurpose = purposeFilter === 'All' || log.purpose === purposeFilter;
      const matchesCollege = collegeFilter === 'All' || log.college === collegeFilter;
      const matchesType = visitorTypeFilter === 'All' || 
                         (visitorTypeFilter === 'Employee' ? (log.visitorType === 'Faculty' || log.visitorType === 'Staff') : log.visitorType === visitorTypeFilter);
      return matchesSearch && matchesPurpose && matchesCollege && matchesType;
    });
  }, [logs, searchQuery, purposeFilter, collegeFilter, visitorTypeFilter]);

  const stats = useMemo(() => {
    if (!filteredLogs) return { today: 0, weekly: 0 };
    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);
    
    return {
      today: filteredLogs.filter(l => startOfDay(parseISO(l.entryDateTime)).getTime() === today.getTime()).length,
      weekly: filteredLogs.filter(l => parseISO(l.entryDateTime) >= weekAgo).length
    };
  }, [filteredLogs]);

  const chartData = useMemo(() => {
    if (!logs) return [];
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const count = logs.filter(l => startOfDay(parseISO(l.entryDateTime)).getTime() === date.getTime()).length;
      return {
        name: format(date, 'EEE'),
        visitors: count
      };
    });
  }, [logs]);

  const generateAiSummary = async () => {
    if (!filteredLogs.length) return;
    setIsSummarizing(true);
    try {
      const result = await adminVisitorTrendSummaries({
        periodDescription: `Filtered results based on current view`,
        visitorEntries: filteredLogs.slice(0, 50).map(v => ({
          timestamp: v.entryDateTime,
          purposeOfVisit: v.purpose
        }))
      });
      setAiSummary(result.summary);
    } catch (error) {
      toast({ title: "Analysis Failed", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeleteLog = (id: string) => {
    const docRef = doc(db, 'visitorLogs', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Log Deleted" });
  };

  if (isAdminLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // For developer convenience, my email can act as admin even if not in collection (safety check)
  const isSuperUser = authUser?.email === 'jcesperanza@neu.edu.ph';
  const hasAccess = !!adminRole || isSuperUser;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground mt-2">You do not have administrative privileges for ScholarFlow.</p>
        <Link href="/"><Button className="mt-6">Return to Landing Page</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white hidden lg:flex flex-col border-r border-primary-foreground/10">
        <div className="p-6">
          <div className="flex items-center gap-2 font-headline font-bold text-2xl mb-8">
            <Image src={neuLogo?.imageUrl || ''} alt="NEU" width={32} height={32} />
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
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-accent">
               <Image src={adminAvatar?.imageUrl || ''} alt="Admin" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold truncate w-32">{authUser?.displayName}</p>
              <p className="text-xs text-blue-200/60">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Library Administration</h1>
            <p className="text-muted-foreground">Monitor and filter visitor statistics</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <LogOut className="mr-2 h-4 w-4" /> Exit Dashboard
            </Button>
          </Link>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-primary text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-100">Today's Visitors</CardDescription>
              <CardTitle className="text-3xl font-headline">{stats.today}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Weekly Volume</CardDescription>
              <CardTitle className="text-3xl font-headline">{stats.weekly}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Current Capacity</CardDescription>
              <CardTitle className="text-3xl font-headline text-accent">Active</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Filtered Count</CardDescription>
              <CardTitle className="text-3xl font-headline">{filteredLogs.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-none shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Search Visitor</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name/College" className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Purpose</label>
              <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                <SelectTrigger><SelectValue placeholder="All Purposes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Purposes</SelectItem>
                  <SelectItem value="Reading Books">Reading Books</SelectItem>
                  <SelectItem value="Research in Thesis">Research in Thesis</SelectItem>
                  <SelectItem value="Use of Computer">Use of Computer</SelectItem>
                  <SelectItem value="Doing Assignments">Doing Assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">College</label>
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                <SelectTrigger><SelectValue placeholder="All Colleges" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Colleges</SelectItem>
                  <SelectItem value="College of Engineering">Engineering</SelectItem>
                  <SelectItem value="College of Arts and Sciences">Arts & Sciences</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Visitor Type</label>
              <Select value={visitorTypeFilter} onValueChange={setVisitorTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Any Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Visitors</SelectItem>
                  <SelectItem value="Student">Student Only</SelectItem>
                  <SelectItem value="Employee">Employee (Teacher/Staff)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="ghost" className="w-full" onClick={() => {
                setPurposeFilter('All');
                setCollegeFilter('All');
                setVisitorTypeFilter('All');
                setSearchQuery('');
              }}>Reset</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Visitor Volume</CardTitle>
                <CardDescription>Daily entry trends (Last 7 days)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] mt-4">
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

            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Filtered Audit Log</CardTitle>
                <CardDescription>Detailed record of library entries</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.slice(0, 15).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.visitorName}</div>
                          <div className="text-xs text-muted-foreground">{log.visitorEmail}</div>
                        </TableCell>
                        <TableCell>
                           <Badge variant={log.visitorType === 'Student' ? 'secondary' : 'default'}>{log.visitorType}</Badge>
                        </TableCell>
                        <TableCell>{log.college}</TableCell>
                        <TableCell><Badge variant="outline">{log.purpose}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-xs">{format(parseISO(log.entryDateTime), 'MMM d, h:mm a')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteLog(log.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Log
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filteredLogs.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records match current filters</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" /> AI Trends Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSummarizing ? (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-8 w-8 text-accent animate-spin mb-2" />
                    <p className="text-xs text-muted-foreground">Analyzing filtered data...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                    <p className="text-sm leading-relaxed">{aiSummary}</p>
                    <Button variant="ghost" size="sm" className="mt-4 text-accent p-0" onClick={generateAiSummary}>Re-run Analysis</Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">Analyze the current filtered logs for patterns and trends.</p>
                    <Button className="w-full bg-accent hover:bg-accent/90" onClick={generateAiSummary} disabled={!filteredLogs.length}>
                      Analyze Current View
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Access Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-3 bg-muted rounded-md">
                   <p className="font-semibold mb-1">Authorization Note:</p>
                   <p className="text-xs text-muted-foreground">Roles are determined by existence in the <code className="bg-white px-1">roles_admin</code> collection. Restricted access for regular students.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}