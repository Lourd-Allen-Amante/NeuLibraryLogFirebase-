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
  Sparkles,
  Loader2,
  Trash2,
  CheckCircle,
  LogOut,
  FileDown,
  Calendar as CalendarIcon,
  Download,
  CreditCard,
  UserPlus,
  ShieldX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { adminVisitorTrendSummaries } from '@/ai/flows/admin-visitor-trend-summaries';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboard() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('All');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [visitorTypeFilter, setVisitorTypeFilter] = useState('All'); 
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: subDays(new Date(), 7),
    to: new Date()
  });

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Firestore Queries
  const adminRef = useMemoFirebase(() => authUser ? doc(db, 'roles_admin', authUser.uid) : null, [db, authUser]);
  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRef);

  const logsQuery = useMemoFirebase(() => collection(db, 'visitorLogs'), [db]);
  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery);

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  const neuLogo = PlaceHolderImages.find(img => img.id === 'neu-logo');

  // Filtering Logic
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const logDate = parseISO(log.entryDateTime);
      const inDateRange = (!dateRange.from || logDate >= startOfDay(dateRange.from)) && 
                         (!dateRange.to || logDate <= endOfDay(dateRange.to));
      
      const matchesSearch = 
        log.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.schoolId?.includes(searchQuery);
      
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
    
    const purposes = filteredLogs.reduce((acc, l) => {
      acc[l.purpose] = (acc[l.purpose] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topPurpose = Object.entries(purposes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total, countToday, topPurpose };
  }, [filteredLogs]);

  // Actions
  const toggleBlockStatus = (userId: string, currentStatus: boolean) => {
    const userRef = doc(db, 'users', userId);
    updateDocumentNonBlocking(userRef, { isBlocked: !currentStatus });
    toast({
      title: !currentStatus ? "Visitor Blocked" : "Visitor Unblocked",
      description: `The user status has been updated.`,
    });
  };

  const handleAddVisitor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newVisitor = {
      name: formData.get('fullName') as string,
      schoolId: formData.get('schoolId') as string,
      email: formData.get('email') as string,
      collegeOrOffice: formData.get('college') as string,
      visitorType: formData.get('type') as string,
      isBlocked: false,
      role: 'RegularUser'
    };

    // Use a temp ID or actual auth creation if needed, here we just add to Firestore
    const newDocRef = doc(collection(db, 'users'));
    setDoc(newDocRef, { ...newVisitor, id: newDocRef.id });
    
    toast({ title: "Visitor Added Successfully" });
    (e.target as HTMLFormElement).reset();
  };

  if (isAdminLoading || isLogsLoading || isUsersLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F8]">
        <Loader2 className="animate-spin h-10 w-10 text-[#1B4332]" />
      </div>
    );
  }

  const isSuperUser = authUser?.email === 'jcesperanza@neu.edu.ph';
  const hasAccess = !!adminRole || isSuperUser;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#F1F5F8]">
        <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
        <h1 className="text-3xl font-headline font-bold text-[#1B4332]">Access Restricted</h1>
        <p className="text-muted-foreground mt-2 max-w-md">This area is for Library Personnel only.</p>
        <Link href="/"><Button className="mt-8 bg-[#1B4332] h-12 px-8">Return to Portal</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col font-body">
      {/* Green Header - Matching Screenshot */}
      <header className="bg-[#1B4332] text-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {neuLogo?.imageUrl && (
            <Image src={neuLogo.imageUrl} alt="NEU" width={40} height={40} className="bg-white rounded-full p-1" />
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight">NEU Library</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-200/60 font-bold">Admin Dashboard</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'overview' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
          </Button>
          <Button 
            variant="ghost" 
            className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'logs' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")}
            onClick={() => setActiveTab('logs')}
          >
            <ClipboardList className="mr-2 h-4 w-4" /> Visitor Logs
          </Button>
          <Button 
            variant="ghost" 
            className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'manage' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")}
            onClick={() => setActiveTab('manage')}
          >
            <Users className="mr-2 h-4 w-4" /> Manage Visitors
          </Button>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="bg-[#2D6A4F] border-none text-white hover:bg-[#40916C] h-9 text-xs font-bold">
            <FileDown className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10 h-9 text-xs font-bold">
              Sign Out
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Filtered Volume</CardDescription>
                  <CardTitle className="text-3xl font-headline text-[#1B4332]">{stats.total}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-xs text-muted-foreground">Active filter results</p></CardContent>
              </Card>
              <Card className="border-emerald-100 shadow-sm bg-emerald-50">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Today's Entries</CardDescription>
                  <CardTitle className="text-3xl font-headline text-[#1B4332]">{stats.countToday}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-xs text-emerald-600 font-medium">Live check-ins</p></CardContent>
              </Card>
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Peak Activity</CardDescription>
                  <CardTitle className="text-xl font-headline text-[#1B4332] truncate">{stats.topPurpose}</CardTitle>
                </CardHeader>
                <CardContent><Badge variant="outline" className="text-emerald-600 border-emerald-200">Main Trend</Badge></CardContent>
              </Card>
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Security Status</CardDescription>
                  <CardTitle className="text-xl font-headline text-[#1B4332] flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" /> Secure
                  </CardTitle>
                </CardHeader>
                <CardContent><p className="text-xs text-muted-foreground">Terminal Link Stable</p></CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-emerald-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-[#1B4332]">7-Day Visitation Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={filteredLogs.slice(0, 10).map((l, i) => ({ name: `Entry ${i+1}`, value: 1 }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#1B4332" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-emerald-100 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-[#1B4332] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-500" /> AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-emerald-50/50 p-4 rounded-xl text-sm italic text-emerald-900 leading-relaxed border border-emerald-100">
                    "Visitor patterns show a peak in research activity during the early morning sessions. Consider allocating more staff to the main hall between 9 AM and 11 AM."
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-emerald-50 mb-4">
              <CardTitle className="text-lg font-bold text-[#1B4332]">Entry Ledger</CardTitle>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search logs..." 
                  className="w-64 h-9 text-xs rounded-lg"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-emerald-50/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Visitor</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">ID / Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">College</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Activity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-emerald-50/20 transition-colors">
                    <TableCell className="font-medium text-[#1B4332]">{log.visitorName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono">{log.schoolId}</span>
                        <Badge variant="outline" className="w-fit text-[8px] px-1.5 py-0 mt-1">{log.visitorType}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{log.college}</TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-700">{log.purpose}</TableCell>
                    <TableCell className="text-[10px] font-mono">{format(parseISO(log.entryDateTime), 'HH:mm | MMM d')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Registered Visitors - Left */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl font-bold text-[#1B4332]">Registered Visitors</h2>
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-emerald-50">
                  <CardTitle className="text-md font-bold text-emerald-800">All Users</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9 h-9 w-48 text-xs rounded-lg" />
                  </div>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-emerald-50/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">ID</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">College/Office</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold text-emerald-900 text-xs">{user.name}</TableCell>
                        <TableCell className="text-xs font-mono">{user.schoolId}</TableCell>
                        <TableCell className="text-xs">{user.collegeOrOffice}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full",
                            user.isBlocked ? "bg-rose-100 text-rose-600 hover:bg-rose-100" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-100"
                          )}>
                            {user.isBlocked ? "Blocked" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn(
                              "text-[10px] font-bold h-7 px-3 rounded-md",
                              user.isBlocked ? "text-emerald-600 hover:bg-emerald-50" : "text-rose-600 hover:bg-rose-50"
                            )}
                            onClick={() => toggleBlockStatus(user.id, user.isBlocked)}
                          >
                            {user.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Right Column - Blocked & Add New */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#1B4332]">Blocked Visitors</h2>
                <Card className="border-emerald-100 shadow-sm">
                  <CardHeader className="py-4 border-b border-emerald-50">
                    <CardTitle className="text-md font-bold text-emerald-800">Blocked List</CardTitle>
                  </CardHeader>
                  <Table>
                    <TableHeader className="bg-emerald-50/30">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">ID</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers?.filter(u => u.isBlocked).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-bold text-emerald-900 text-xs">{user.name}</TableCell>
                          <TableCell className="text-xs font-mono">{user.schoolId}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-[10px] font-bold h-7 border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => toggleBlockStatus(user.id, true)}
                            >
                              Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#1B4332]">Add New Visitor</h2>
                <Card className="border-emerald-100 shadow-sm">
                  <form onSubmit={handleAddVisitor}>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Full Name</Label>
                          <Input name="fullName" placeholder="Juan dela Cruz" className="h-10 text-xs rounded-lg border-emerald-100" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">School ID</Label>
                          <Input name="schoolId" placeholder="20XX-XXXXX" className="h-10 text-xs rounded-lg border-emerald-100" required />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Institutional Email</Label>
                        <Input name="email" type="email" placeholder="name@neu.edu.ph" className="h-10 text-xs rounded-lg border-emerald-100" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">College / Office</Label>
                          <Input name="college" placeholder="e.g. CICS, CAET..." className="h-10 text-xs rounded-lg border-emerald-100" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Type</Label>
                          <Select name="type" defaultValue="Student">
                            <SelectTrigger className="h-10 text-xs rounded-lg border-emerald-100"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Student">Student</SelectItem>
                              <SelectItem value="Faculty">Faculty</SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                              <SelectItem value="Guest">Guest</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold h-12 rounded-xl mt-2">
                        + Add Visitor
                      </Button>
                    </CardContent>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}