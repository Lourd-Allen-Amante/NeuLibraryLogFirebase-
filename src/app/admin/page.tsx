"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  Calendar as CalendarIcon,
  AlertCircle,
  ArrowLeft,
  Sparkles
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parseISO, format, isSameDay, isWithinInterval, startOfWeek, endOfWeek, subDays, eachDayOfInterval } from 'date-fns';
import { VISIT_PURPOSES } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DateRange } from "react-day-picker";
import { adminVisitorTrendSummaries } from '@/ai/flows/admin-visitor-trend-summaries';

const CHART_COLORS = [
  "hsl(153 43% 18%)", 
  "hsl(153 43% 30%)", 
  "hsl(153 43% 45%)", 
  "hsl(153 20% 60%)", 
  "hsl(153 10% 80%)"
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  const [dateFilterMode, setDateFilterMode] = useState<'preset' | 'custom'>('preset');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [formName, setFormName] = useState('');
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCollege, setFormCollege] = useState('');
  const [formType, setFormType] = useState('Student');

  useEffect(() => {
    setDateRange({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
  }, []);

  const adminRef = useMemoFirebase(() => (db && authUser) ? doc(db, 'roles_admin', authUser.uid) : null, [db, authUser]);
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRef);

  const logsQuery = useMemoFirebase(() => db ? collection(db, 'visitorLogs') : null, [db]);
  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery);

  const registeredVisitorsQuery = useMemoFirebase(() => db ? collection(db, 'registeredVisitors') : null, [db]);
  const { data: allVisitors, isLoading: isVisitorsLoading } = useCollection(registeredVisitorsQuery);

  const neuLogo = PlaceHolderImages.find(img => img.id === 'neu-logo');

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs
      .filter(log => {
        const logDate = parseISO(log.entryDateTime);
        const now = new Date();
        
        let dateMatch = true;
        if (dateFilterMode === 'preset') {
          if (dateFilter === 'today') dateMatch = isSameDay(logDate, now);
          if (dateFilter === 'week') dateMatch = isWithinInterval(logDate, { start: startOfWeek(now), end: endOfWeek(now) });
          if (dateFilter === 'month') dateMatch = isWithinInterval(logDate, { start: subDays(now, 30), end: now });
        } else if (dateFilterMode === 'custom' && dateRange?.from && dateRange?.to) {
          dateMatch = isWithinInterval(logDate, { start: dateRange.from, end: dateRange.to });
        }

        const purposeMatch = purposeFilter === 'all' || log.purpose === purposeFilter;
        const collegeMatch = collegeFilter === 'all' || log.college === collegeFilter;
        
        let typeMatch = true;
        if (typeFilter === 'Student') typeMatch = log.visitorType === 'Student';
        if (typeFilter === 'Employee') typeMatch = ['Faculty', 'Staff'].includes(log.visitorType);

        return dateMatch && purposeMatch && collegeMatch && typeMatch;
      });
  }, [logs, dateFilterMode, dateFilter, dateRange, purposeFilter, collegeFilter, typeFilter]);

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

  const trendChartData = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    if (dateFilterMode === 'preset' && dateFilter === 'today') {
      const hours = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, count: 0 }));
      filteredLogs.forEach(log => {
        const hour = parseISO(log.entryDateTime).getHours();
        hours[hour].count++;
      });
      return hours.filter((_, i) => i >= 7 && i <= 20);
    } else {
      if (dateFilterMode === 'preset') {
        start = dateFilter === 'week' ? startOfWeek(now) : (dateFilter === 'month' ? subDays(now, 30) : subDays(now, 14));
        end = now;
      } else {
        start = dateRange?.from || subDays(now, 7);
        end = dateRange?.to || now;
      }
      
      const days = eachDayOfInterval({ start, end });
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
  }, [filteredLogs, dateFilter, dateFilterMode, dateRange]);

  const collegeChartData = useMemo(() => {
    const counts = filteredLogs.reduce((acc: any, log) => {
      acc[log.college] = (acc[log.college] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 5);
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

  const handleAiAnalysis = async () => {
    if (filteredLogs.length === 0) {
      toast({ title: "No data to analyze", description: "Try adjusting your filters.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setAiSummary(null);

    try {
      const result = await adminVisitorTrendSummaries({
        periodDescription: dateFilterMode === 'preset' ? dateFilter : 'custom range',
        visitorEntries: filteredLogs.map(l => ({
          timestamp: l.entryDateTime,
          purposeOfVisit: l.purpose
        }))
      });
      setAiSummary(result.summary);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({ title: "AI Analysis Failed", description: "Could not generate summary at this time.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
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

    const pdfDoc = new jsPDF();
    pdfDoc.setFontSize(18);
    pdfDoc.setTextColor(27, 67, 50);
    pdfDoc.text("New Era INC Library", 14, 20);
    pdfDoc.setFontSize(12);
    pdfDoc.setTextColor(100);
    pdfDoc.text(`Visitor Log Report - ${period.toUpperCase()}`, 14, 30);
    pdfDoc.text(`Generated: ${format(now, 'MMM d, yyyy HH:mm')}`, 14, 38);

    const tableData = exportLogs.map(log => [
      log.visitorName || 'N/A',
      log.schoolId || 'N/A',
      log.visitorType || 'Student',
      log.college || 'N/A',
      log.purpose || 'N/A',
      format(parseISO(log.entryDateTime), 'MMM d, HH:mm')
    ]);

    autoTable(pdfDoc, {
      startY: 45,
      head: [['Visitor Name', 'School ID', 'Type', 'College', 'Purpose', 'Timestamp']],
      body: tableData,
      headStyles: { fillColor: [27, 67, 50] },
      styles: { fontSize: 8 },
    });

    pdfDoc.save(`NEU_Library_Logs_${period}_${format(now, 'yyyyMMdd')}.pdf`);
    setIsExporting(false);
    toast({ title: "PDF Exported Successfully" });
  };

  const handleSchoolIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    
    let formatted = value;
    if (value.length > 2) {
      formatted = `${value.slice(0, 2)}-${value.slice(2)}`;
    }
    if (value.length > 7) {
      formatted = `${value.slice(0, 2)}-${value.slice(2, 7)}-${value.slice(7)}`;
    }
    setFormSchoolId(formatted);
  };

  const isSuperUser = useMemo(() => {
    if (!authUser?.email) return false;
    const email = authUser.email.toLowerCase();
    
    const superusers = [
      'jcesperanza@neu.edu.ph',
      'jcezperanza@neu.edu.ph',
      'jceperanza@neu.edu.ph',
      'lourdallen.amante@neu.edu.ph',
      'neulibrarian@neu.edu.ph'
    ];
    
    return superusers.includes(email);
  }, [authUser]);

  const hasAccess = !!adminRole || isSuperUser;

  if (isAuthLoading || isAdminRoleLoading || isLogsLoading || isVisitorsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F8]">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-[#1B4332] mx-auto" />
          <p className="text-xs font-bold text-[#1B4332] animate-pulse">VERIFYING ACCESS...</p>
        </div>
      </div>
    );
  }

  if (!authUser || !hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#F1F5F8]">
        <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
        <h1 className="text-3xl font-headline font-bold text-[#1B4332]">Access Restricted</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          You do not have administrative privileges. Please sign in with an authorized NEU account.
        </p>
        <Link href="/"><Button className="mt-8 bg-[#1B4332] h-12 px-8">Return to Portal</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col font-body">
      <header className="bg-[#1B4332] text-white px-8 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {neuLogo?.imageUrl && <Image src={neuLogo.imageUrl} alt="NEU" width={40} height={40} className="bg-white rounded-full p-1 shadow-md" />}
          <div>
            <h1 className="text-lg font-bold tracking-tight">New Era INC Library</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-200/60 font-bold">Admin Console</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" className="text-white/60 hover:text-white text-xs font-bold px-4 h-10 rounded-lg">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portal
            </Button>
          </Link>
          <Button variant="ghost" className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'overview' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")} onClick={() => setActiveTab('overview')}><LayoutDashboard className="mr-2 h-4 w-4" /> Statistics</Button>
          <Button variant="ghost" className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'logs' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")} onClick={() => setActiveTab('logs')}><ClipboardList className="mr-2 h-4 w-4" /> Visitor Logs</Button>
          <Button variant="ghost" className={cn("text-xs font-bold px-4 h-10 rounded-lg", activeTab === 'manage' ? "bg-white/10 text-white" : "text-white/60 hover:text-white")} onClick={() => setActiveTab('manage')}><Users className="mr-2 h-4 w-4" /> Manage Visitors</Button>
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/40">Logged in as</p>
            <p className="text-xs font-bold">{authUser?.displayName || authUser?.email || 'Admin'}</p>
          </div>
          <Link href="/"><Button variant="ghost" className="text-white hover:bg-white/10 h-9 text-xs font-bold border border-white/20">Sign Out</Button></Link>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Card className="border-emerald-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-emerald-50"><CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-900"><Filter className="h-4 w-4" /> Comprehensive Analytics Filter</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-emerald-800/60">Date Scope</Label>
                    <Select value={dateFilterMode} onValueChange={(v: any) => setDateFilterMode(v)}>
                      <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="preset">Quick Range</SelectItem><SelectItem value="custom">Custom Date Range</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    {dateFilterMode === 'preset' ? (
                      <>
                        <Label className="text-[10px] uppercase font-bold text-emerald-800/60">Quick Select</Label>
                        <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                          <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem><SelectItem value="month">Last 30 Days</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
                        <Label className="text-[10px] uppercase font-bold text-emerald-800/60">Choose Dates</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-9 w-full justify-start text-left text-xs border-emerald-100">
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}` : format(dateRange.from, "LLL dd")) : <span>Pick range</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                          </PopoverContent>
                        </Popover>
                      </>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-emerald-800/60">Visitor Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="Student">Students</SelectItem><SelectItem value="Employee">Employees</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-emerald-800/60">College</Label>
                    <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                      <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Colleges</SelectItem>{Array.from(new Set(logs?.map(l => l.college))).sort().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-emerald-800/60">Purpose</Label>
                    <Select value={purposeFilter} onValueChange={purposeFilter => setPurposeFilter(purposeFilter)}>
                      <SelectTrigger className="h-9 text-xs border-emerald-100"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Activities</SelectItem>{VISIT_PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-emerald-100 shadow-sm bg-white"><CardHeader className="pb-2"><CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Selected Records</CardDescription><CardTitle className="text-4xl font-headline text-[#1B4332]">{stats.total}</CardTitle></CardHeader></Card>
              <Card className="border-emerald-100 shadow-sm bg-white"><CardHeader className="pb-2"><CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Active Students</CardDescription><CardTitle className="text-4xl font-headline text-emerald-600">{stats.students}</CardTitle></CardHeader></Card>
              <Card className="border-emerald-100 shadow-sm bg-white"><CardHeader className="pb-2"><CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Active Employees</CardDescription><CardTitle className="text-4xl font-headline text-emerald-700">{stats.employees}</CardTitle></CardHeader></Card>
              <Card className="border-emerald-100 shadow-sm bg-emerald-50"><CardHeader className="pb-2"><CardDescription className="text-[10px] font-bold uppercase text-emerald-800/60">Primary Activity</CardDescription><CardTitle className="text-lg font-bold text-[#1B4332] truncate">{stats.topPurpose}</CardTitle></CardHeader></Card>
            </div>

            <Card className="border-emerald-200 shadow-md bg-white overflow-hidden">
              <CardHeader className="bg-emerald-50/50 flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-md font-bold text-emerald-900">AI-Powered Trend Insights</CardTitle>
                </div>
                <Button 
                  onClick={handleAiAnalysis} 
                  disabled={isAnalyzing} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg shadow-sm"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Analysis
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800/60">Analyzing library visitor patterns...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="prose prose-sm max-w-none text-emerald-900 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-500">
                    <p className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50 italic">
                      "{aiSummary}"
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground italic">Click the button above to generate a summary of current trends.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="border-b border-emerald-50"><CardTitle className="text-md font-bold text-emerald-900 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Visitation Trend</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <ChartContainer config={{ count: { label: "Visitors", color: "hsl(153 43% 18%)" } }} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="count" stroke="hsl(153 43% 18%)" strokeWidth={3} dot={{ fill: "hsl(153 43% 18%)", r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="border-b border-emerald-50"><CardTitle className="text-md font-bold text-emerald-900 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Top 5 Colleges</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <ChartContainer config={{ count: { label: "Entries", color: "hsl(153 43% 18%)" } }} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collegeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(153 43% 18%)" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm lg:col-span-2">
                <CardHeader className="border-b border-emerald-50"><CardTitle className="text-md font-bold text-emerald-900 flex items-center gap-2"><PieChartIcon className="h-4 w-4" /> Activity Breakdown</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <ChartContainer config={{}} className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={purposeChartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none">
                          {purposeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
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
          <Card className="border-emerald-100 shadow-sm animate-in slide-in-from-bottom-2 duration-500">
            <CardHeader className="flex flex-row items-center justify-between border-b border-emerald-50">
              <CardTitle className="text-lg font-bold text-[#1B4332]">Visitor Logs</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-emerald-700 border-emerald-100 px-3">{sortedLogs.length} Total Visits</Badge>
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search name or ID..." className="pl-9 h-9 w-64 text-xs rounded-lg border-emerald-100" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 text-xs font-bold border-emerald-100 text-emerald-700 hover:bg-emerald-50" disabled={isExporting}>
                      {isExporting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileDown className="mr-2 h-3 w-3" />} Export PDF
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleExportPdf('today')} className="text-xs font-bold cursor-pointer">Today's Logs</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportPdf('week')} className="text-xs font-bold cursor-pointer">This Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportPdf('month')} className="text-xs font-bold cursor-pointer">Last 30 Days</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-emerald-50/30">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Visitor Name</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-emerald-800">School ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Purpose of Visit</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-emerald-800">College</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-emerald-800">Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-emerald-800 text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLogs.filter(l => 
                    (l.visitorName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                    (l.schoolId || '').includes(searchQuery)
                  ).map((log) => (
                    <TableRow key={log.id} className="hover:bg-emerald-50/10 border-emerald-50 group">
                      <TableCell className="font-bold text-[#1B4332]">{log.visitorName || 'N/A'}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{log.schoolId || 'N/A'}</TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-700">{log.purpose || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{log.college || 'N/A'}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[9px] font-bold">{log.visitorType || 'Student'}</Badge></TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground text-right">{format(parseISO(log.entryDateTime), 'MMM d, HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                  {sortedLogs.length === 0 && <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No logs found matching your criteria.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-emerald-100 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-emerald-50">
                  <CardTitle className="text-md font-bold text-emerald-900">Registered Patrons</CardTitle>
                  <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search registry..." className="pl-9 h-9 w-64 text-xs rounded-lg border-emerald-100" onChange={(e) => setSearchQuery(e.target.value)} /></div>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-emerald-50/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Patron Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">School ID</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Administrative Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVisitors?.filter(v => 
                      (v.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                      (v.schoolId || '').includes(searchQuery)
                    ).map((visitor) => (
                      <TableRow key={visitor.id} className="border-emerald-50">
                        <TableCell className="font-bold text-emerald-900 text-xs">{visitor.name || 'N/A'}</TableCell>
                        <TableCell className="text-xs font-mono">{visitor.schoolId || 'N/A'}</TableCell>
                        <TableCell><Badge className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", visitor.isBlocked ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>{visitor.isBlocked ? "BLOCKED" : "ACTIVE"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className={cn("text-[10px] font-bold h-7 px-4 rounded-md", visitor.isBlocked ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-rose-600 hover:text-rose-700 hover:bg-rose-50")} onClick={() => {
                            if (!db) return;
                            const visitorRef = doc(db, 'registeredVisitors', visitor.id);
                            updateDocumentNonBlocking(visitorRef, { isBlocked: !visitor.isBlocked });
                            toast({ title: !visitor.isBlocked ? "Visitor Blocked" : "Visitor Restored" });
                          }}>
                            {visitor.isBlocked ? "UNBLOCK ACCESS" : "REVOKE ACCESS"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card className="border-emerald-100 shadow-sm sticky top-24">
                <CardHeader className="bg-emerald-50 border-b border-emerald-100"><CardTitle className="text-md font-bold text-emerald-900">New Registration</CardTitle></CardHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!db) return;
                  if (!/^\d{2}-\d{5}-\d{3}$/.test(formSchoolId)) { toast({ title: "ID Format Error", description: "Format must be 00-00000-000", variant: "destructive" }); return; }
                  const newRef = doc(collection(db, 'registeredVisitors'));
                  setDoc(newRef, { id: newRef.id, name: formName, schoolId: formSchoolId, email: formEmail, collegeDepartment: formCollege, visitorType: formType, isBlocked: false });
                  toast({ title: "Patron Registered" });
                  setFormName(''); setFormSchoolId(''); setFormEmail(''); setFormCollege('');
                }}>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">Full Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '))} placeholder="e.g. Jorus Junio" className="h-10 text-xs rounded-lg border-emerald-100" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">Institutional ID</Label><Input value={formSchoolId} onChange={handleSchoolIdChange} placeholder="00-00000-000" className="h-10 text-xs rounded-lg border-emerald-100 font-mono" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">NEU Email</Label><Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="name@neu.edu.ph" className="h-10 text-xs rounded-lg border-emerald-100" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">College</Label><Input value={formCollege} onChange={(e) => setFormCollege(e.target.value.toUpperCase())} placeholder="e.g. CICS" className="h-10 text-xs rounded-lg border-emerald-100" required /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-emerald-800/60">Role</Label><Select value={formType} onValueChange={setFormType}><SelectTrigger className="h-10 text-xs rounded-lg border-emerald-100"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Student">Student</SelectItem><SelectItem value="Faculty">Faculty</SelectItem><SelectItem value="Staff">Staff</SelectItem></SelectContent></Select></div>
                    <Button type="submit" className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold h-12 rounded-xl mt-4 shadow-lg"><UserPlus className="mr-2 h-4 w-4" /> Add to Database</Button>
                  </CardContent>
                </form>
              </Card>
            </div>
          </div>
        )}
      </main>

      <footer className="p-8 text-center text-emerald-800/20 text-[9px] font-mono uppercase tracking-[0.3em]">
        New Era University • Intellectually Driven • Spiritually Fortified
      </footer>
    </div>
  );
}
