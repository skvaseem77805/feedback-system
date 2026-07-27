'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  ChevronLeft,
  Upload,
  Download,
  Eye,
  FileSpreadsheet,
  FileUp,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  RotateCcw,
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { loadPageState, savePageState, saveScrollPosition, restoreScrollPosition } from '@/lib/state-preservation';
import { Toaster } from '@/components/ui/sonner';
import { ImportAnalyticsChart, ChartDataPoint } from '@/components/ImportAnalyticsChart';

interface PreviewRow {
  rowNumber: number;
  rollNumber: string;
  name: string;
  year: number | null;
  yearLabel: string;
  branch: string;
  email: string;
  phone: string;
  status: 'new' | 'update' | 'updated' | 'UPDATED' | 'invalid';
  existing: boolean;
  errors: string[];
  valid: boolean;
}

interface ImportBatchItem {
  id: string;
  fileName: string;
  importedBy: string;
  createdAt: string;
  totalRecords: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  duplicateCount: number;
  durationMs: number;
  status: string;
  importDetails?: any;
}

interface StatsData {
  totalRegistered: number;
  totalImported: number;
  manualAdded: number;
  todayRegistrations: number;
  todayImports: number;
  thisMonthRegistrations: number;
  thisMonthImports: number;
  failedImports: number;
  dailyRegistrations: ChartDataPoint[];
}

export default function AdminImportExportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authorized, setAuthorized] = useState(false);

  const savedState = loadPageState('admin_import_export', {
    fromDate: '',
    toDate: '',
    monthFilter: '',
    yearFilter: '',
    searchQuery: '',
  });

  // Stats & Analytics state
  const [stats, setStats] = useState<StatsData>({
    totalRegistered: 0,
    totalImported: 0,
    manualAdded: 0,
    todayRegistrations: 0,
    todayImports: 0,
    thisMonthRegistrations: 0,
    thisMonthImports: 0,
    failedImports: 0,
    dailyRegistrations: []
  });

  // Filter state
  const [fromDate, setFromDate] = useState(savedState.fromDate);
  const [toDate, setToDate] = useState(savedState.toDate);
  const [monthFilter, setMonthFilter] = useState(savedState.monthFilter);
  const [yearFilter, setYearFilter] = useState(savedState.yearFilter);

  // History & Search state
  const [history, setHistory] = useState<ImportBatchItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    savePageState('admin_import_export', { fromDate, toDate, monthFilter, yearFilter, searchQuery });
  }, [fromDate, toDate, monthFilter, yearFilter, searchQuery]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ rollNumber: '', name: '', department: '', year: '', email: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<any>(null);

  // Details Modal
  const [viewBatch, setViewBatch] = useState<ImportBatchItem | null>(null);
  const [showImportedDetails, setShowImportedDetails] = useState(false);
  const [showUpdatedDetails, setShowUpdatedDetails] = useState(false);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);
  const [showErrorsDetails, setShowErrorsDetails] = useState(false);

  // Bulk Modals
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkModifyModal, setShowBulkModifyModal] = useState(false);
  const [bulkModifyForm, setBulkModifyForm] = useState({ year: 'KEEP_EXISTING', section: 'KEEP_EXISTING', branch: 'KEEP_EXISTING' });
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [error, setError] = useState('');

  // Get Admin headers
  const getAdminHeaders = useCallback(() => {
    return {
      'x-admin-auth': 'true',
      'x-admin-email': localStorage.getItem('adminEmail') || '',
      'x-admin-id': localStorage.getItem('adminId') || '',
    };
  }, []);

  // Fetch Statistics & Chart Data
  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (monthFilter) params.set('month', monthFilter);
      if (yearFilter) params.set('year', yearFilter);

      const res = await fetch(`/api/admin/import-stats?${params.toString()}`, { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        console.error('Failed to load stats: HTTP status', res.status);
      }
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }, [fromDate, toDate, monthFilter, yearFilter, getAdminHeaders]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        saveScrollPosition('admin_import_export');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Import History Batches
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (monthFilter) params.set('month', monthFilter);
      if (yearFilter) params.set('year', yearFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/import-history?${params.toString()}`, { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      } else {
        console.error('Failed to load history: HTTP status', res.status);
      }
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
      restoreScrollPosition('admin_import_export');
    }
  }, [fromDate, toDate, monthFilter, yearFilter, searchQuery, getAdminHeaders]);

  // Initial Auth & Load
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
      router.push('/auth');
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    loadStats();
    loadHistory();

    const interval = setInterval(() => {
      loadStats();
      loadHistory();
    }, 3000);

    return () => clearInterval(interval);
  }, [authorized, loadStats, loadHistory]);

  const handleApplyFilters = () => {
    loadStats();
    loadHistory();
    toast.success('Filters applied successfully.');
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setMonthFilter('');
    setYearFilter('');
    setSearchQuery('');
    toast.info('Filters reset.');
  };

  // Upload Handlers
  const handleFile = async (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/students/import', { method: 'POST', body: formData, headers: getAdminHeaders() });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Import failed');
      return;
    }
    setPreviewRows(data.preview || []);
    setShowPreview(true);
  };

  const confirmImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('confirm', 'true');

    const res = await fetch('/api/admin/students/import', { method: 'POST', body: formData, headers: getAdminHeaders() });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Import failed');
      setImporting(false);
      return;
    }
    setReport(data);
    setShowPreview(false);
    toast.success(`Import batch ${data.batchId || ''} completed successfully.`);
    setImporting(false);

    // Refresh Stats & History
    loadStats();
    loadHistory();
  };

  const downloadTemplate = () => {
    const rows = [
      ['RollNo', 'Name', 'Department', 'Year', 'Email'],
      ['24B81A05Q5', 'NALLA NEELIMA', 'CSE', '3rd', 'neelima@example.com'],
      ['24B81A05Q6', 'SANTHOSH KUMAR', 'CSE', '2nd', 'santhosh@example.com'],
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportStudents = async () => {
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100000', sortField: 'name', sortDirection: 'ASC' });
      const res = await fetch(`/api/admin/students?${params.toString()}`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Export failed');

      const allStudents = data.students || [];
      const rows = [
        ['RollNo', 'Name', 'Department', 'Year', 'Email'],
        ...allStudents.map((s: any) => [s.id, s.name, s.department, s.academicYear, s.email]),
      ];
      const csv = rows.map((row) => row.map((val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'students-export.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Export failed');
    }
  };

  const downloadCategoryCSV = (category: 'imported' | 'updated' | 'skipped' | 'errors') => {
    if (!report || !report[category]) return;
    const data = report[category];
    let headers: string[] = [];
    let rows: string[][] = [];

    if (category === 'imported') {
      headers = ['Roll Number', 'Student Name', 'Email', 'Branch', 'Year', 'Imported At'];
      rows = data.map((s: any) => [
        s.rollNo || '',
        s.name || '',
        s.email || '',
        s.branch || '',
        s.year || '',
        s.importedAt ? new Date(s.importedAt).toISOString() : ''
      ]);
    } else if (category === 'updated') {
      headers = ['Roll Number', 'Student Name', 'Updated Field', 'Old Value', 'New Value', 'Updated At'];
      data.forEach((s: any) => {
        (s.changes || []).forEach((c: any) => {
          rows.push([
            s.rollNo || '',
            s.name || '',
            c.field || '',
            c.oldValue || '',
            c.newValue || '',
            s.updatedAt ? new Date(s.updatedAt).toISOString() : ''
          ]);
        });
      });
    } else if (category === 'skipped' || category === 'errors') {
      headers = ['Roll Number', 'Student Name', 'Email', 'Branch', 'Year', 'Reason'];
      rows = data.map((s: any) => [
        s.rollNo || '',
        s.name || '',
        s.email || '',
        s.branch || '',
        s.year || '',
        s.reason || ''
      ]);
    }

    const csvContent = [headers, ...rows].map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-import-${category}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const headers = { ...getAdminHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rollNumber: addForm.rollNumber,
          name: addForm.name,
          department: addForm.department,
          year: addForm.year,
          email: addForm.email || null,
          confirm: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || 'Failed to add student');
        setAddLoading(false);
        return;
      }

      toast.success('Student added successfully.');
      setShowAddModal(false);
      setAddForm({ rollNumber: '', name: '', department: '', year: '', email: '' });
      loadStats();
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setAddLoading(false);
    }
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBatches(history.map((h) => h.id));
    } else {
      setSelectedBatches([]);
    }
  };

  const handleSelectBatch = (id: string) => {
    setSelectedBatches((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedBatches.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/import-history/bulk-delete', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchIds: selectedBatches })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      toast.success(`Successfully deleted ${data.deletedBatches} batch(es) and ${data.deletedStudents} student record(s).`);
      setSelectedBatches([]);
      setShowBulkDeleteModal(false);
      loadStats();
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || 'Bulk delete failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk Modify
  const handleBulkModify = async () => {
    if (selectedBatches.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/import-history/bulk-modify', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchIds: selectedBatches,
          year: bulkModifyForm.year,
          section: bulkModifyForm.section,
          branch: bulkModifyForm.branch
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Modify failed');

      toast.success(`Successfully updated ${data.updatedCount} student record(s) across selected batch(es).`);
      setSelectedBatches([]);
      setShowBulkModifyModal(false);
      setBulkModifyForm({ year: 'KEEP_EXISTING', section: 'KEEP_EXISTING', branch: 'KEEP_EXISTING' });
      loadStats();
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || 'Bulk modify failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon"><ChevronLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import / Export Management System</h1>
            <p className="text-muted-foreground text-sm">Monitor student imports, view statistics analytics, manage import batches & bulk operations</p>
          </div>
        </div>

        {error ? <Card className="p-4 border-red-200 text-red-600 bg-red-50">{error}</Card> : null}

        {/* 1. IMPORT STATISTICS DASHBOARD */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-blue-600 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Total Registered</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-foreground">{stats.totalRegistered.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">All college students</p>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-emerald-500 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Total Imported</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.totalImported.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Via CSV/Excel/PDF</p>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-purple-500 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Manual Added</span>
              <UserPlus className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-600">{stats.manualAdded.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Single additions</p>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-teal-500 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Today's Registrations</span>
              <Calendar className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-black text-teal-600">{stats.todayRegistrations.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{stats.todayImports.toLocaleString()} imported today</p>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-amber-500 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">This Month</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.thisMonthRegistrations.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{stats.thisMonthImports.toLocaleString()} imported this month</p>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-rose-500 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Failed Records</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600">{stats.failedImports.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Errors/bypassed</p>
          </Card>
        </div>

        {/* 2. ADVANCED FILTERS */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Filter className="w-4 h-4 text-primary" /> Advanced Data Filters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Month</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            <div className="flex items-end gap-2 md:col-span-2">
              <Button size="sm" onClick={handleApplyFilters} className="h-9 text-xs flex-1">
                <Filter className="w-3.5 h-3.5 mr-1" /> Apply Filter
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetFilters} className="h-9 text-xs flex-1">
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* 3. DAILY REGISTRATION GRAPH */}
        <Card className="p-6">
          <ImportAnalyticsChart data={stats.dailyRegistrations} />
        </Card>

        {/* FILE UPLOAD & QUICK ACTIONS */}
        <Card className="p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">Import & Export Operations</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" />Download Template</Button>
              <Button variant="outline" size="sm" onClick={exportStudents}><FileSpreadsheet className="w-4 h-4 mr-2" />Export All Students</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4 mr-2" />Add Student</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <Button variant="default" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Import File
              </Button>
            </div>
          </div>

          <div
            className={`rounded-xl border border-dashed p-6 text-sm transition text-center flex flex-col items-center justify-center min-h-[160px] ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFile(e.dataTransfer.files?.[0] || null);
            }}
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="font-medium text-sm mb-1">Drop student files here or browse manually</p>
            <p className="text-xs text-muted-foreground mb-3">Supports CSV, Excel (.xlsx/.xls) and structured PDF files.</p>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Browse Files
            </Button>
          </div>
        </Card>

        {/* FLOATING BULK ACTION TOOLBAR */}
        {selectedBatches.length > 0 && (
          <div className="sticky top-20 z-30 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-center gap-3 font-semibold text-sm pl-2">
              <span className="bg-primary/20 text-teal-400 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                {selectedBatches.length} Selected
              </span>
              <span className="text-slate-300 text-xs hidden sm:inline">Import batches ready for bulk operation</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowBulkDeleteModal(true)}
                className="h-8 text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Bulk Delete
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowBulkModifyModal(true)}
                className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-3.5 h-3.5 mr-1" /> Bulk Modify
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedBatches([])}
                className="h-8 text-xs text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* 4. IMPORT HISTORY TABLE */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Import History & Batch Logs</h2>
              <p className="text-xs text-muted-foreground">Every file import creates a unique Batch ID stored in database</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Batch ID, file name..."
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {historyLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading import history...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center border rounded-xl bg-muted/10">
              No import history found matching the selected filters.
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBatches.length === history.length && history.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </TableHead>
                    <TableHead className="font-bold">Batch ID</TableHead>
                    <TableHead className="font-bold">File Name</TableHead>
                    <TableHead className="font-bold">Imported By</TableHead>
                    <TableHead className="font-bold">Date & Time</TableHead>
                    <TableHead className="font-bold text-center">Total</TableHead>
                    <TableHead className="font-bold text-center">Imported</TableHead>
                    <TableHead className="font-bold text-center">Failed</TableHead>
                    <TableHead className="font-bold text-center">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((batch) => {
                    const isSelected = selectedBatches.includes(batch.id);
                    return (
                      <TableRow key={batch.id} className={isSelected ? 'bg-primary/5' : ''}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectBatch(batch.id)}
                            className="rounded border-slate-300"
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-primary">{batch.id}</TableCell>
                        <TableCell className="font-medium text-xs">{batch.fileName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{batch.importedBy}</TableCell>
                        <TableCell className="text-xs font-mono">{batch.createdAt}</TableCell>
                        <TableCell className="text-center text-xs font-semibold">{batch.totalRecords}</TableCell>
                        <TableCell className="text-center text-xs font-semibold text-emerald-600">{batch.importedCount}</TableCell>
                        <TableCell className="text-center text-xs font-semibold text-rose-600">{batch.failedCount}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              batch.status === 'Completed'
                                ? 'default'
                                : batch.status === 'Partial'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {batch.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewBatch(batch)}
                              title="View Details"
                              className="h-8 w-8"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedBatches([batch.id]);
                                setShowBulkModifyModal(true);
                              }}
                              title="Modify Batch"
                              className="h-8 w-8 text-blue-600"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedBatches([batch.id]);
                                setShowBulkDeleteModal(true);
                              }}
                              title="Delete Batch"
                              className="h-8 w-8 text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* 5. IMPORT DETAILS POPUP MODAL */}
        <Dialog open={!!viewBatch} onOpenChange={(open) => !open && setViewBatch(null)}>
          <DialogContent className="max-w-xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <FileUp className="w-5 h-5 text-primary" /> Import Batch Details
              </DialogTitle>
              <DialogDescription>Detailed summary for batch {viewBatch?.id}</DialogDescription>
            </DialogHeader>

            {viewBatch && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-4 rounded-xl border">
                  <div>
                    <span className="text-muted-foreground block">Batch ID</span>
                    <span className="font-mono font-bold text-sm text-primary">{viewBatch.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">File Name</span>
                    <span className="font-semibold text-foreground">{viewBatch.fileName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Imported By</span>
                    <span className="font-medium text-foreground">{viewBatch.importedBy}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Import Date & Time</span>
                    <span className="font-mono text-foreground">{viewBatch.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Import Duration</span>
                    <span className="font-mono text-foreground">{viewBatch.durationMs} ms</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Import Status</span>
                    <Badge variant={viewBatch.status === 'Completed' ? 'default' : 'secondary'} className="mt-0.5">
                      {viewBatch.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-2">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Total</span>
                    <span className="text-lg font-bold">{viewBatch.totalRecords}</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 p-3 rounded-xl">
                    <span className="text-[10px] block font-bold uppercase">Imported</span>
                    <span className="text-lg font-bold">{viewBatch.importedCount}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 p-3 rounded-xl">
                    <span className="text-[10px] block font-bold uppercase">Updated</span>
                    <span className="text-lg font-bold">{viewBatch.updatedCount}</span>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 p-3 rounded-xl">
                    <span className="text-[10px] block font-bold uppercase">Failed</span>
                    <span className="text-lg font-bold">{viewBatch.failedCount}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewBatch(null)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 8. BULK DELETE CONFIRMATION DIALOG */}
        <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Delete Selected Import Batch(es)?
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                You are about to permanently delete:
              </DialogDescription>
            </DialogHeader>

            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3.5 rounded-xl text-xs space-y-1 text-rose-900 dark:text-rose-200 my-2">
              <p className="font-semibold">• {selectedBatches.length} Selected Import History Batch(es)</p>
              <p className="font-semibold">• All Imported Student Records belonging to the selected batch(es)</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 pt-1 font-bold">This action cannot be undone.</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)} disabled={bulkActionLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkActionLoading}>
                {bulkActionLoading ? 'Deleting...' : 'Delete Batches & Records'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 9. BULK MODIFY MODAL */}
        <Dialog open={showBulkModifyModal} onOpenChange={setShowBulkModifyModal}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" /> Bulk Modify Imported Students
              </DialogTitle>
              <DialogDescription className="text-xs">
                Simultaneously update student fields across {selectedBatches.length} selected batch(es).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Branch / Department</label>
                <select
                  value={bulkModifyForm.branch}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, branch: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="KEEP_EXISTING">Keep Existing</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="AIML">AIML</option>
                  <option value="EEE">EEE</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="MECH">MECH</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Academic Year</label>
                <select
                  value={bulkModifyForm.year}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, year: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="KEEP_EXISTING">Keep Existing</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="Final">Final Year</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Section</label>
                <select
                  value={bulkModifyForm.section}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, section: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="KEEP_EXISTING">Keep Existing</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                  <option value="E">Section E</option>
                  <option value="F">Section F</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setShowBulkModifyModal(false)} disabled={bulkActionLoading}>
                Cancel
              </Button>
              <Button onClick={handleBulkModify} disabled={bulkActionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {bulkActionLoading ? 'Updating...' : 'Update Selected Students'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* FILE IMPORT PREVIEW DIALOG */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Preview Student Import</DialogTitle>
              <DialogDescription>Confirm records before database insertion takes effect.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{row.rollNumber}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.yearLabel || '-'}</TableCell>
                      <TableCell>{row.branch}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell><Badge variant={row.valid ? 'default' : 'secondary'}>{row.status}</Badge></TableCell>
                      <TableCell>{row.errors.join(', ') || 'None'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button onClick={confirmImport} disabled={importing}>{importing ? 'Importing...' : 'Confirm Import'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ADD SINGLE STUDENT MODAL */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md w-full p-6">
            <DialogHeader>
              <DialogTitle>Add Student Manually</DialogTitle>
              <DialogDescription>
                Fill in details to add a single student record.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Roll Number *</label>
                <Input
                  required
                  value={addForm.rollNumber}
                  onChange={(e) => setAddForm({ ...addForm, rollNumber: e.target.value })}
                  placeholder="e.g. 24B81A05Q5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Student Name *</label>
                <Input
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. NALLA NEELIMA"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Department *</label>
                <Input
                  required
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  placeholder="e.g. CSE"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Year *</label>
                <select
                  required
                  value={addForm.year}
                  onChange={(e) => setAddForm({ ...addForm, year: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">Final Year</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email (Optional)</label>
                <Input
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="e.g. student@example.com"
                  type="email"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addLoading}>
                  {addLoading ? 'Saving...' : 'Add Student'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
