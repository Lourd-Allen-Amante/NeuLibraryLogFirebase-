
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
  LogOut,
  FileDown,
  Calendar as CalendarIcon,
  Download
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
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
  const [visitorTypeFilter, setVisitorTypeFilter] = useState('All'); // 'All', 'Student', 'Employee'
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: subDays(new Date(), 7),
    to: new Date()
  });

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
      const logDate = parseISO(log.entryDateTime);
      const inDateRange = (!dateRange.from || logDate >= startOfDay(dateRange.from)) && 
                         (!dateRange.to || logDate <= endOfDay(dateRange.to));
      
      const matchesSearch = log.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           log.college.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPurpose = purposeFilter === 'All' || log.purpose === purposeFilter;
      const matchesCollege = collegeFilter === 'All' || log.college === collegeFilter;
      
      const matchesType = visitorTypeFilter === 'All' || 
                         (visitorTypeFilter === 'Employee' ? (log.visitorType === 'Faculty' || log.visitorType === 'Staff') : log.visitorType === visitorTypeFilter);
      
      return inDateRange && matchesSearch && matchesPurpose && matchesCollege && matchesType;
    });
  }, [logs, searchQuery, purposeFilter, collegeFilter, visitorTypeFilter, dateRange]);

  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const today = startOfDay(new Date());
    const countToday = filteredLogs.filter(l => startOfDay(parseISO(l.entryDateTime)).getTime() === today.getTime()).length;
    
    // Most popular purpose in filtered view
    const purposes = filteredLogs.reduce((acc, l) => {
      acc[l.purpose] = (acc[l.purpose] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topPurpose = Object.entries(purposes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total, countToday, topPurpose };
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
        periodDescription: `Filtered results from ${dateRange.from ? format(dateRange.from, 'PP') : 'start'} to ${dateRange.to ? format(dateRange.to, 'PP') : 'now'}`,
        visitorEntries: filteredLogs.slice(0, 100).map(v => ({
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

  const handleExport = () => {
    toast({
      title: "Generating Report",
      description: "Your PDF report is being prepared for download.",
    });
    // In a real app, logic for generating PDF would go here.
  };

  const handleDeleteLog = (id: string) => {
    const docRef = doc(db, 'visitorLogs', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Log Entry Removed" });
  };

  if (isAdminLoading) return <div className="flex h-screen items-center justify-center bg-[#F1F5F8]"><Loader2 className="animate-spin h-10 w-10 text-[#264D73]" /></div>;

  // jcesperanza@neu.edu.ph is super admin
  const isSuperUser = authUser?.email === 'jcesperanza@neu.edu.ph';
  const hasAccess = !!adminRole || isSuperUser;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#F1F5F8]">
        <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
        <h1 className="text-3xl font-headline font-bold text-[#264D73]">Administrative Authorization Required</h1>
        <p className="text-muted-foreground mt-2 max-w-md">This area is restricted to Library Personnel. If you believe this is an error, contact the IT department.</p>
        <Link href="/"><Button className="mt-8 bg-[#264D73] h-12 px-8">Return to Terminal</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F8] flex font-body">
      {/* Sidebar */}
      <aside className="w-72 bg-[#264D73] text-white hidden lg:flex flex-col border-r border-white/5">
        <div className="p-8">
          <div className="flex items-center gap-3 font-headline font-bold text-2xl mb-12">
            <Image src={neuLogo?.imageUrl || ''} alt="NEU" width={40} height={40} className="bg-white rounded-full p-1" />
            ScholarFlow
          </div>
          
          <nav className="space-y-4">
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Management</div>
            <Button variant="ghost" className="w-full justify-start text-white bg-white/10 font-bold h-12 rounded-xl">
              <LayoutDashboard className="mr-3 h-5 w-5 text-[#36BBDB]" /> Overview
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/5 font-medium h-12 rounded-xl">
              <ClipboardList className="mr-3 h-5 w-5" /> Visit History
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/5 font-medium h-12 rounded-xl">
              <Users className="mr-3 h-5 w-5" /> User Access
            </Button>
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-[#36BBDB]">
               <Image src={adminAvatar?.imageUrl || ''} alt="Admin" fill className="object-cover" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{authUser?.displayName}</p>
              <p className="text-xs text-[#36BBDB] font-medium">Chief Librarian</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-headline font-bold text-[#264D73]">Library Dashboard</h1>
            <p className="text-muted-foreground font-medium">Monitoring visitor patterns and institutional statistics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-[#264D73] text-[#264D73] hover:bg-[#264D73]/5" onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" /> Export Report
            </Button>
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground">
                <LogOut className="mr-2 h-4 w-4" /> Exit
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-none shadow-md bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Users className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="font-bold text-xs uppercase tracking-wider">Filtered Volume</CardDescription>
              <CardTitle className="text-4xl font-headline text-[#264D73]">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> Based on active filters
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-[#264D73] text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-100 font-bold text-xs uppercase tracking-wider">Today's Entries</CardDescription>
              <CardTitle className="text-4xl font-headline">{stats.countToday}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-blue-200">System Live Check-ins</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold text-xs uppercase tracking-wider">Peak Purpose</CardDescription>
              <CardTitle className="text-xl font-headline text-[#264D73] truncate">{stats.topPurpose}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-[#36BBDB] border-[#36BBDB]">Popular Trend</Badge>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-[#36BBDB] text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-50 font-bold text-xs uppercase tracking-wider">System Status</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <CheckCircle className="h-6 w-6" /> Operational
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-blue-50">All terminal endpoints connected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Panel */}
        <Card className="mb-10 border-none shadow-md bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#36BBDB]" /> Control Center
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="space-y-2 lg:col-span-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Search Visitor</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Name or College..." className="pl-10 h-11 border-slate-200 rounded-xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-11 justify-start text-left font-normal rounded-xl">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "Start"} - {dateRange.to ? format(dateRange.to, "PPP") : "End"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Purpose of Visit</Label>
                <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="All Reasons" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Reasons</SelectItem>
                    <SelectItem value="Reading Books">Reading Books</SelectItem>
                    <SelectItem value="Research in Thesis">Research in Thesis</SelectItem>
                    <SelectItem value="Use of Computer">Use of Computer</SelectItem>
                    <SelectItem value="Doing Assignments">Doing Assignments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">College</Label>
                <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="All Colleges" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Colleges</SelectItem>
                    <SelectItem value="College of Engineering">Engineering</SelectItem>
                    <SelectItem value="College of Arts and Sciences">Arts & Sciences</SelectItem>
                    <SelectItem value="College of Education">Education</SelectItem>
                    <SelectItem value="College of Computer Studies">Computer Studies</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Visitor Classification</Label>
                <Select value={visitorTypeFilter} onValueChange={setVisitorTypeFilter}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Any Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Classifications</SelectItem>
                    <SelectItem value="Student">Students Only</SelectItem>
                    <SelectItem value="Employee">Employees (Faculty/Staff)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t flex justify-end gap-3">
              <Button variant="ghost" className="rounded-xl h-11" onClick={() => {
                setPurposeFilter('All');
                setCollegeFilter('All');
                setVisitorTypeFilter('All');
                setSearchQuery('');
                setDateRange({ from: subDays(new Date(), 7), to: new Date() });
              }}>Reset Workspace</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Visual Charts */}
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-[#264D73]">Attendance Volumetrics</CardTitle>
                <CardDescription>Visualizing daily library entry fluctuations over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 13, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 13}} dx={-10} />
                    <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="visitors" fill="#264D73" radius={[8, 8, 0, 0]} barSize={40}>
                       {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 6 ? '#36BBDB' : '#264D73'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl text-[#264D73]">Detailed Visitation Logs</CardTitle>
                  <CardDescription>Comprehensive ledger of institutional access</CardDescription>
                </div>
                <Badge variant="secondary" className="px-3 py-1 text-sm">{filteredLogs.length} Records</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold py-5 pl-8 text-xs uppercase tracking-widest">Visitor Info</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest">Institution</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest">Activity</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest">Timestamp</TableHead>
                      <TableHead className="text-right pr-8 font-bold text-xs uppercase tracking-widest">Mgmt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.slice(0, 20).map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-8 py-5">
                          <div className="font-bold text-[#264D73]">{log.visitorName}</div>
                          <div className="text-xs text-muted-foreground">{log.visitorEmail}</div>
                        </TableCell>
                        <TableCell>
                           <Badge className={cn(
                             "font-bold text-[10px] rounded-md px-2 py-0.5",
                             log.visitorType === 'Student' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                           )}>
                             {log.visitorType?.toUpperCase()}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-600">{log.college}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm font-semibold text-[#264D73]">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#36BBDB]" />
                            {log.purpose}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {format(parseISO(log.entryDateTime), 'MMM d, yyyy')}<br/>
                          <span className="font-bold">{format(parseISO(log.entryDateTime), 'hh:mm a')}</span>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive font-medium" onClick={() => handleDeleteLog(log.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Purge Entry
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filteredLogs.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-10 w-10 text-slate-200 mb-2" />
                            <p className="text-slate-400 font-medium">No results found for current filter configuration</p>
                            <Button variant="link" className="text-[#36BBDB]" onClick={() => setSearchQuery('')}>Clear search</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {filteredLogs.length > 20 && (
                  <div className="p-4 text-center border-t">
                    <Button variant="ghost" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Load More Entries</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-10">
            {/* AI Insights */}
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <div className="h-2 bg-[#36BBDB]" />
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2 text-[#264D73]">
                  <Sparkles className="h-6 w-6 text-[#36BBDB]" /> AI Trend Analysis
                </CardTitle>
                <CardDescription>Generative summary of current filtered datasets</CardDescription>
              </CardHeader>
              <CardContent>
                {isSummarizing ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="relative h-16 w-16 mb-4">
                       <Loader2 className="h-16 w-16 text-[#36BBDB] animate-spin absolute" />
                       <Sparkles className="h-8 w-8 text-[#264D73] absolute top-4 left-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Processing Patterns...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-[#F1F5F8] rounded-2xl border border-slate-200 leading-relaxed text-slate-700 italic">
                      "{aiSummary}"
                    </div>
                    <Button variant="outline" className="w-full border-slate-200 text-slate-500 hover:text-[#264D73]" onClick={generateAiSummary}>
                      Refresh Analysis
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="bg-slate-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 mb-6 font-medium">Click to generate a natural language summary of the current filtered results.</p>
                    <Button className="w-full bg-[#264D73] hover:bg-[#264D73]/90 h-12 rounded-xl" onClick={generateAiSummary} disabled={!filteredLogs.length}>
                      Analyze Current View
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions / Status */}
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-[#264D73]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start h-12 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600">
                  <Download className="mr-3 h-5 w-5 text-sky-500" /> Download Monthly CSV
                </Button>
                <Button variant="outline" className="justify-start h-12 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600">
                  <ShieldAlert className="mr-3 h-5 w-5 text-rose-500" /> Manage Blacklist
                </Button>
                <Button variant="outline" className="justify-start h-12 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600">
                  <CalendarIcon className="mr-3 h-5 w-5 text-amber-500" /> Shift Schedule
                </Button>
              </CardContent>
            </Card>

            {/* Admin Notice */}
            <div className="p-6 bg-[#264D73]/5 rounded-2xl border border-[#264D73]/10">
              <h4 className="font-bold text-[#264D73] text-sm mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> System Policy Reminder
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                All visitor data is strictly for institutional research and security audit purposes. Ensure data privacy protocols are followed when exporting reports.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
