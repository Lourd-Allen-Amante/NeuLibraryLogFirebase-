"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  ShieldAlert, 
  Search,
  Loader2,
  UserPlus,
  Filter,
  FileDown,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  Cell,
  ResponsiveContainer 
} from "recharts";
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parseISO, format, isSameDay, isWithinInterval, startOfWeek, endOfWeek, subDays, startOfDay, eachDayOfInterval, isSameMonth } from 'date-fns';
import { VISIT_PURPOSES } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CHART_COLORS = [
  "hsl(153 43% 18%)", // Primary
  "hsl(153 43% 30%)", 
  "hsl(153 43% 45%)", 
  "hsl(153 20% 60%)", 
  "hsl(153 10% 80%)"
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // Filtering States
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Form States for Add Visitor
  const [formName, setFormName] = useState('');
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCollege, setFormCollege] = useState('');
  const [formType, setFormType] = useState('Student');

  // Firestore Queries
  const adminRef = useMemoFirebase(() => authUser ? doc(db, 'roles_admin', authUser.uid) : null, [db, authUser]);
  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRef);

  const logsQuery = useMemoFirebase(() => collection(db, 'visitorLogs'), [db]);
  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery);

  const registeredVisitorsQuery = useMemoFirebase(() => collection(db, 'registeredVisitors'), [db]);
  const { data: allVisitors, isLoading: isVisitorsLoading } = useCollection(registeredVisitorsQuery);

  const neuLogo = PlaceHolderImages.find(img => img.id === 'neu-logo');

  // Logic for statistics and filtering
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs
      .filter(log => {
        const logDate = parseISO(log.entryDateTime);
        const now = new Date();
        
        // Date Filtering
        let dateMatch = true;
        if (dateFilter === 'today') dateMatch = isSameDay(logDate, now);
        if (dateFilter === 'week') dateMatch = isWithinInterval(logDate, { start: startOfWeek(now), end: endOfWeek(now) });

        // Category Filtering
        const purposeMatch = purposeFilter === 'all' || log.purpose === purposeFilter;
        const collegeMatch = collegeFilter === 'all' || log.college === collegeFilter;
        
        // Type Filtering (Student vs Employee)
        let typeMatch = true;
        if (typeFilter === 'Student') typeMatch = log.visitorType === 'Student';
        if (typeFilter === 'Employee') typeMatch = ['Faculty', 'Staff'].includes(log.visitorType);

        return dateMatch && purposeMatch && collegeMatch && typeMatch;
      });
  }, [logs, dateFilter, purposeFilter, collegeFilter, typeFilter]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => parseISO(b.entryDateTime).getTime() - parseISO(a.entryDateTime).getTime());
  }, [filteredLogs]);

  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const students = filteredLogs.filter(l => l.visitorType === 'Student').length;
    const employees = filteredLogs.filter(l => ['Faculty', 'Staff'].includes(l.visitorType)).length;
    
    const purposeCounts = filteredLogs.reduce((acc: any, curr) => {
      acc[curr.purpose] = (acc[curr.purpose] || 0) + 1;
      return acc;
    }, {});
    const topPurpose = Object.entries(purposeCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total, students, employees, topPurpose };
  }, [filteredLogs]);

  // Chart Data Calculations
  const collegeChartData = useMemo(() => {
    const counts = filteredLogs.reduce((acc: any, log) => {
      acc[log.college] = (acc[log.college] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filteredLogs]);

  const purposeChartData = useMemo(() => {
    const counts = filteredLogs.reduce((acc: any, log) => {
      acc[log.purpose] = (acc[log.purpose] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value], index) => ({ 
      name, 
      value,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [filteredLogs]);

  const trendChartData = useMemo(() => {
    if (dateFilter === 'today') {
      // Hourly trend for today
      const hours = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, count: 0 }));
      filteredLogs.forEach(log => {
        const hour = parseISO(log.entryDateTime).getHours();
        hours[hour].count++;
      });
      return hours.filter((_, i) => i >= 7 && i <= 20); // Filter for library hours 7am-8pm
    } else {
      // Daily trend for the interval
      const now = new Date();
      const start = dateFilter === 'week' ? startOfWeek(now) : subDays(now, 30);
      const days = eachDayOfInterval({ start, end: now });
      
      const dayMap = days.reduce((acc: any, day) => {
        acc[format(day, 'yyyy-MM-dd')] = 0;
        return acc;
      }, {});

      filteredLogs.forEach(log => {
        const dayStr = format(parseISO(log.entryDateTime), 'yyyy-MM-dd');
        if (dayMap[dayStr] !== undefined) dayMap[dayStr]++;
      });

      return Object.entries(dayMap).map(([date, count]) => ({
        time: format(parseISO(date), 'MMM d'),
        count
      }));
    }
  }, [filteredLogs, dateFilter]);

  const chartConfig: ChartConfig = {
    count: {
      label: "Visitors",
      color: "hsl(153 43% 18%)",
    },
  };

  const uniqueColleges = useMemo(() => {
    if (!logs) return [];
    const colleges = new Set(logs.map(l => l.college));
    return Array.from(colleges).sort();
  }, [logs]);

  const handleNameInput = (val: string) => {
    const formatted = val
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    setFormName(formatted);
  };

  const handleIdInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length > 7) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 7)}-${digits.slice(7)}`;
    setFormSchoolId(formatted);
  };

  const handleExportPdf = (period: 'today' | 'week' | 'month') => {
    if (!logs || logs.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    const now = new Date();
    let exportLogs = logs;

    if (period === 'today') {
      exportLogs = logs.filter(l => isSameDay(parseISO(l.entryDateTime), now));
    } else if (period === 'week') {
      exportLogs = logs.filter(l => isWithinInterval(parseISO(l.entryDateTime), { start: subDays(now, 7), end: now }));
    } else if (period === 'month') {
      exportLogs = logs.filter(l => isWithinInterval(parseISO(l.entryDateTime), { start: subDays(now, 30), end: now }));
    }

    exportLogs.sort((a, b) => parseISO(b.entryDateTime).getTime() - parseISO(a.entryDateTime).getTime());

    if (exportLogs.length === 0) {
      toast({ title: `No entries found for ${period}`, variant: "destructive" });
      setIsExporting(false);
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(27, 67, 50);
    doc.text("New Era University Library", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Visitor Log Report - ${period.toUpperCase()}`, 14, 30);
    doc.text(`Generated on: ${format(now, 'MMMM d, yyyy HH:mm')}`, 14, 38);

    const tableData = exportLogs.map(log => [
      log.visitorName,
      log.schoolId,
      log.visitorType,
      log.college,
      log.purpose,
      format(parseISO(log.entryDateTime), 'MMM d, HH:mm')
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Visitor Name', 'School ID', 'Type', 'College', 'Purpose', 'Timestamp']],
      body: tableData,
      headStyles: { fillColor: [27, 67, 50] },
      styles: { fontSize: 8 },
    });

    doc.save(`NEU_Library_Logs_${period}.pdf`);
    setIsExporting(false);
    toast({ title: "PDF Exported Successfully" });
  };

  const toggleBlockStatus = (visitorId: string, currentStatus: boolean) => {
    const visitorRef = doc(db, 'registeredVisitors', visitorId);
    updateDocumentNonBlocking(visitorRef, { isBlocked: !currentStatus });
    toast({ title: !currentStatus ? "Visitor Blocked" : "Visitor Unblocked" });
  };

  const handleAddVisitor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\d{2}-\d{5}-\d{3}$/.test(formSchoolId)) {
      toast({ title: "Invalid School ID format", variant: "destructive" });
      return;
    }
    const newVisitorRef = doc(collection(db, 'registeredVisitors'));
    setDoc(newVisitorRef, {
      id: newVisitorRef.id,
      name: formName,
      schoolId: formSchoolId,
      email: formEmail,
      collegeDepartment: formCollege,
      visitorType: formType,
      isBlocked: false
    });
    toast({ title: "Visitor Registered Successfully" });
    setFormName(''); setFormSchoolId(''); setFormEmail(''); setFormCollege('');
  };

  const isSuperUser = authUser?.email === 'jcesperanza@neu.edu.ph' || authUser?.email === 'lourdallen.amante@neu.edu.ph';
  const hasAccess = !!adminRole || isSuperUser;

  if (isAdminLoading || isLogsLoading || isVisitorsLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#F1F5F8]"><Loader2 className="animate-spin h-10 w-10 text-[#1B4332]" /></div>;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#F1F5F8]">
        <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
        <h1 className="text-3xl font-headline font-bold text-[#1B4332]">Access Restricted</h1>
        <Link href="/"><Button className="mt-8 bg-[#1B4332] h-12 px-8">Return to Portal</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col font-body">
      <header className="bg-[#1B4332] text-white px-8 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          {neuLogo?.imageUrl && <Image src={neuLogo.imageUrl} alt="NEU" width={40} height={40} className="bg-white rounded-full p-1 shadow-md" />}
          <div>
            <h1 className="text-lg font-bold tracking-tight">NEU Library</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-200/60 font-bold">Admin Console</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'overview' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")} onClick={() => setActiveTab('overview')}><LayoutDashboard className="mr-2 h-4 w-4" /> Statistics</Button>
          <Button variant="ghost" className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'logs' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")} onClick={() => setActiveTab('logs')}><ClipboardList className="mr-2 h-4 w-4" /> Visitor Logs</Button>
          <Button variant="ghost" className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'manage' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")} onClick={() => setActiveTab('manage')}><Users className="mr-2 h-4 w-4" /> Manage Visitors</Button>
        </nav>
        <Link href="/"><Button variant="ghost" className="text-white hover:bg-white/10 h-9 text-xs font-bold">Sign Out</Button></Link>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <Card className="border-emerald-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-emerald-50"><CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-900"><Filter className="h-4 w-4" /> Filter Analytics</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-emerald-800/60">Time Period</Label>
                    <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                      <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-emerald-800/60">Visitor Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="Student">Students Only</SelectItem><SelectItem value="Employee">Employees Only</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-emerald-800/60">College</Label>
                    <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                      <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Colleges</SelectItem>{uniqueColleges.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-emerald-800/60">Purpose</Label>
                    <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                      <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Purposes</SelectItem>{VISIT_PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-emerald-100 shadow-sm bg-white"><CardHeader className="pb-2"><CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Filtered Entries</CardDescription><CardTitle className="text-4xl font-headline text-[#1B4332]">{stats.total}</CardTitle></CardHeader></Card>
              <Card className="border-emerald-100 shadow-sm bg-white"><CardHeader className="pb-2"><CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Students</CardDescription><CardTitle className="text-4xl font-headline text-emerald-600">{stats.students}</CardTitle></CardHeader></Card>
              <Card className="border-emerald-100 shadow-sm bg-white"><CardHeader className="pb-2"><CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Employees</CardDescription><CardTitle className="text-4xl font-headline text-emerald-700">{stats.employees}</CardTitle></CardHeader></Card>
              <Card className="border-emerald-100 shadow-sm bg-emerald-50"><CardHeader className="pb-2"><CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Top Activity</CardDescription><CardTitle className="text-lg font-bold text-[#1B4332] truncate">{stats.topPurpose}</CardTitle></CardHeader></Card>
            </div>

            {/* Visual Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Visitor Trend Line Chart */}
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="border-b border-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-md font-bold text-emerald-900">Visitor Traffic Trend</CardTitle>
                      <CardDescription className="text-xs">Visitor frequency over time</CardDescription>
                    </div>
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `${value}`}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(153 43% 18%)" 
                          strokeWidth={3} 
                          dot={{ fill: "hsl(153 43% 18%)", r: 4 }} 
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* College Distribution Bar Chart */}
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="border-b border-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-md font-bold text-emerald-900">Distribution by College</CardTitle>
                      <CardDescription className="text-xs">Entries grouped by department</CardDescription>
                    </div>
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collegeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          width={80}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(153 43% 18%)" 
                          radius={[0, 4, 4, 0]} 
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Purpose Distribution Pie Chart */}
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="border-b border-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-md font-bold text-emerald-900">Visit Purposes</CardTitle>
                      <CardDescription className="text-xs">Breakdown of library activities</CardDescription>
                    </div>
                    <PieChartIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={purposeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {purposeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-emerald-50">
              <CardTitle className="text-lg font-bold text-[#1B4332]">Visitor Logs</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-emerald-700 border-emerald-100">{sortedLogs.length} Results</Badge>
                <Input placeholder="Search logs..." className="w-48 h-9 text-xs rounded-lg border-emerald-100" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 text-xs font-bold border-emerald-100 text-emerald-700" disabled={isExporting}>
                      {isExporting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileDown className="mr-2 h-3 w-3" />} Export PDF
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => handleExportPdf('today')} className="text-xs font-bold">Today</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportPdf('week')} className="text-xs font-bold">Last Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportPdf('month')} className="text-xs font-bold">Last Month</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-emerald-50/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Visitor</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">School ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Purpose</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-emerald-800 text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLogs.filter(l => l.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) || l.schoolId.includes(searchQuery)).map((log) => (
                  <TableRow key={log.id} className="hover:bg-emerald-50/10 border-emerald-50">
                    <TableCell className="font-bold text-[#1B4332]">{log.visitorName}</TableCell>
                    <TableCell className="text-xs font-mono">{log.schoolId}</TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-700">{log.purpose}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[9px] font-bold">{log.visitorType}</Badge></TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground text-right">{format(parseISO(log.entryDateTime), 'MMM d, HH:mm')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-emerald-100 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-emerald-50">
                  <CardTitle className="text-md font-bold text-emerald-900">Registered Patrons</CardTitle>
                  <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search name or ID..." className="pl-9 h-9 w-64 text-xs rounded-lg border-emerald-100" onChange={(e) => setSearchQuery(e.target.value)} /></div>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-emerald-50/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">School ID</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVisitors?.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.schoolId.includes(searchQuery)).map((visitor) => (
                      <TableRow key={visitor.id} className="border-emerald-50">
                        <TableCell className="font-bold text-emerald-900 text-xs">{visitor.name}</TableCell>
                        <TableCell className="text-xs font-mono">{visitor.schoolId}</TableCell>
                        <TableCell><Badge className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", visitor.isBlocked ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>{visitor.isBlocked ? "Blocked" : "Active"}</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm" className={cn("text-[10px] font-bold h-7 px-3 rounded-md", visitor.isBlocked ? "text-emerald-600" : "text-rose-600")} onClick={() => toggleBlockStatus(visitor.id, visitor.isBlocked)}>{visitor.isBlocked ? "Unblock" : "Block"}</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card className="border-emerald-100 shadow-sm sticky top-8">
                <CardHeader className="bg-emerald-50 border-b border-emerald-100"><CardTitle className="text-md font-bold text-emerald-900">Register New Visitor</CardTitle></CardHeader>
                <form onSubmit={handleAddVisitor}>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">Full Name</Label><Input value={formName} onChange={(e) => handleNameInput(e.target.value)} placeholder="e.g. Jorus Junio" className="h-10 text-xs rounded-lg border-emerald-100" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">School ID</Label><Input value={formSchoolId} onChange={(e) => handleIdInput(e.target.value)} placeholder="00-00000-000" className="h-10 text-xs rounded-lg border-emerald-100 font-mono" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">Institutional Email</Label><Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="firstname.lastname@neu.edu.ph" className="h-10 text-xs rounded-lg border-emerald-100" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">College Department</Label><Input value={formCollege} onChange={(e) => setFormCollege(e.target.value.toUpperCase())} placeholder="e.g. CICS" className="h-10 text-xs rounded-lg border-emerald-100" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">Visitor Type</Label><Select value={formType} onValueChange={setFormType}><SelectTrigger className="h-10 text-xs rounded-lg border-emerald-100"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Student">Student</SelectItem><SelectItem value="Faculty">Faculty</SelectItem><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Guest">Guest</SelectItem></SelectContent></Select></div>
                    <Button type="submit" className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold h-12 rounded-xl mt-4 shadow-lg"><UserPlus className="mr-2 h-4 w-4" /> Add to Registry</Button>
                  </CardContent>
                </form>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}