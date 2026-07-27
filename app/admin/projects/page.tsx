'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  ChevronLeft,
  Search,
  Pencil,
  Trash2,
  Eye,
  Star,
  Download,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  X,
  ExternalLink,
  Github,
  Calendar,
  Heart,
  TrendingUp,
  FolderGit2,
  ShieldAlert,
  History
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { loadPageState, savePageState, saveScrollPosition, restoreScrollPosition } from '@/lib/state-preservation';
import { Toaster } from '@/components/ui/sonner';

interface AdminProjectRow {
  id: string;
  studentId: string;
  title: string;
  description: string;
  category: string;
  uploadedAt: string;
  likes: number;
  views: number;
  thumbnailUrl?: string;
  fileName?: string;
  githubLink?: string;
  demoLink?: string;
  techStack?: string;
  isFeatured: number | boolean;
  status: string;
  visibility: string;
  studentName: string;
  registrationNo: string;
  studentDepartment: string;
  studentYear: number | string;
  studentEmail?: string;
}

interface ProjectStats {
  totalProjects: number;
  publishedProjects: number;
  featuredProjects: number;
  hiddenProjects: number;
  totalViews: number;
  totalLikes: number;
  todayUploads: number;
  thisMonthUploads: number;
  dailyUploads: { date: string; count: number }[];
  topViewed: { id: string; title: string; category: string; views: number; likes: number; studentName: string; regNo: string }[];
  topLiked: { id: string; title: string; category: string; views: number; likes: number; studentName: string; regNo: string }[];
}

interface ActivityLog {
  id: number;
  projectId: string;
  projectTitle: string;
  adminEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const savedState = loadPageState('admin_projects', {
    search: '',
    fromDate: '',
    toDate: '',
    deptFilter: '',
    sectionFilter: '',
    page: 1,
  });

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    publishedProjects: 0,
    featuredProjects: 0,
    hiddenProjects: 0,
    totalViews: 0,
    totalLikes: 0,
    todayUploads: 0,
    thisMonthUploads: 0,
    dailyUploads: [],
    topViewed: [],
    topLiked: []
  });

  // Table Data & Pagination
  const [projects, setProjects] = useState<AdminProjectRow[]>([]);
  const [page, setPage] = useState(savedState.page);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selection
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Filters & Search
  const [search, setSearch] = useState(savedState.search);
  const [fromDate, setFromDate] = useState(savedState.fromDate);
  const [toDate, setToDate] = useState(savedState.toDate);
  const [deptFilter, setDeptFilter] = useState(savedState.deptFilter);
  const [sectionFilter, setSectionFilter] = useState(savedState.sectionFilter);

  useEffect(() => {
    savePageState('admin_projects', { search, fromDate, toDate, deptFilter, sectionFilter, page });
  }, [search, fromDate, toDate, deptFilter, sectionFilter, page]);

  // Dynamic Filter Options from Database
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);

  // Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Modals
  const [viewProject, setViewProject] = useState<AdminProjectRow | null>(null);
  const [editProject, setEditProject] = useState<AdminProjectRow | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    department: '',
    githubLink: '',
    demoLink: '',
    status: 'published',
    visibility: 'public',
    isFeatured: false
  });

  const [deleteProjectTarget, setDeleteProjectTarget] = useState<AdminProjectRow | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkModifyModal, setShowBulkModifyModal] = useState(false);
  const [bulkModifyForm, setBulkModifyForm] = useState({
    department: 'KEEP_EXISTING',
    category: 'KEEP_EXISTING',
    status: 'KEEP_EXISTING',
    visibility: 'KEEP_EXISTING',
    isFeatured: 'KEEP_EXISTING'
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const getAdminHeaders = useCallback(() => {
    return {
      'x-admin-auth': 'true',
      'x-admin-email': localStorage.getItem('adminEmail') || '',
      'x-admin-id': localStorage.getItem('adminId') || '',
    };
  }, []);

  // Fetch Dynamic Filter Options from Database
  const loadFilterOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/projects/filter-options', { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBranchOptions(data.branches || []);
        setSectionOptions(data.sections || []);
      }
    } catch (err) {
      console.warn('Failed to load project filter options', err);
    }
  }, [getAdminHeaders]);

  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (deptFilter) params.set('department', deptFilter);
      if (sectionFilter) params.set('section', sectionFilter);

      const res = await fetch(`/api/admin/projects/stats?${params.toString()}`, { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to load project stats', err);
    }
  }, [fromDate, toDate, deptFilter, sectionFilter, getAdminHeaders]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        saveScrollPosition('admin_projects');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (deptFilter) params.set('department', deptFilter);
      if (sectionFilter) params.set('section', sectionFilter);

      const res = await fetch(`/api/admin/projects?${params.toString()}`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load projects');

      setProjects(data.projects || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
      restoreScrollPosition('admin_projects');
    }
  }, [page, pageSize, search, fromDate, toDate, deptFilter, sectionFilter, getAdminHeaders]);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/projects/logs', { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load project logs', err);
    }
  }, [getAdminHeaders]);

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
    loadFilterOptions();
    loadStats();
    loadProjects();
    loadLogs();
  }, [authorized, loadFilterOptions, loadStats, loadProjects, loadLogs]);

  const handleApplyFilters = () => {
    setPage(1);
    loadStats();
    loadProjects();
    toast.success('Filters applied successfully.');
  };

  const handleResetFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setDeptFilter('');
    setSectionFilter('');
    setPage(1);
    toast.info('Filters reset.');
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProjects(projects.map((p) => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Featured toggle
  const toggleFeatured = async (project: AdminProjectRow) => {
    const newFeatured = !(Number(project.isFeatured) === 1);
    try {
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(project.id)}`, {
        method: 'PATCH',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newFeatured })
      });
      if (!res.ok) throw new Error('Failed to toggle featured state');

      toast.success(`Project ${newFeatured ? 'marked as Featured' : 'removed from Featured'}.`);
      loadStats();
      loadProjects();
      loadLogs();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  // Edit Project submit
  const startEdit = (project: AdminProjectRow) => {
    setEditProject(project);
    setEditForm({
      title: project.title,
      description: project.description || '',
      category: project.category || 'General',
      department: project.studentDepartment || '',
      githubLink: project.githubLink || '',
      demoLink: project.demoLink || '',
      status: project.status || 'published',
      visibility: project.visibility || 'public',
      isFeatured: Number(project.isFeatured) === 1
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(editProject.id)}`, {
        method: 'PATCH',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update project');

      toast.success('Project details updated successfully.');
      setEditProject(null);
      loadStats();
      loadProjects();
      loadLogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project');
    } finally {
      setActionLoading(false);
    }
  };

  // Single Delete
  const handleDeleteSingle = async () => {
    if (!deleteProjectTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(deleteProjectTarget.id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete project');

      toast.success('Project permanently deleted.');
      setDeleteProjectTarget(null);
      loadStats();
      loadProjects();
      loadLogs();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/projects/bulk-delete', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: selectedProjects })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk delete failed');

      toast.success(`Successfully deleted ${data.deletedCount} project(s).`);
      setSelectedProjects([]);
      setShowBulkDeleteModal(false);
      loadStats();
      loadProjects();
      loadLogs();
    } catch (err: any) {
      toast.error(err.message || 'Bulk delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Modify
  const handleBulkModify = async () => {
    if (selectedProjects.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/projects/bulk-modify', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectIds: selectedProjects,
          ...bulkModifyForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk modify failed');

      toast.success(`Successfully modified ${data.updatedCount} project(s).`);
      setSelectedProjects([]);
      setShowBulkModifyModal(false);
      setBulkModifyForm({
        department: 'KEEP_EXISTING',
        category: 'KEEP_EXISTING',
        status: 'KEEP_EXISTING',
        visibility: 'KEEP_EXISTING',
        isFeatured: 'KEEP_EXISTING'
      });
      loadStats();
      loadProjects();
      loadLogs();
    } catch (err: any) {
      toast.error(err.message || 'Bulk modify failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Export Projects
  const exportProjectsList = (format: 'csv' | 'excel') => {
    if (projects.length === 0) {
      toast.error('No projects to export');
      return;
    }

    const headers = [
      'Project ID', 'Project Title', 'Student Name', 'Registration No',
      'Department', 'Category', 'Views', 'Likes', 'Status', 'Visibility', 'Featured', 'Upload Date'
    ];

    const rows = projects.map((p) => [
      p.id,
      p.title,
      p.studentName,
      p.registrationNo,
      p.studentDepartment,
      p.category,
      p.views,
      p.likes,
      p.status,
      p.visibility,
      Number(p.isFeatured) === 1 ? 'Yes' : 'No',
      p.uploadedAt ? new Date(p.uploadedAt).toISOString() : ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projects-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Project list exported as ${format.toUpperCase()}.`);
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8 space-y-6 sm:space-y-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon"><ChevronLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects Management System</h1>
              <p className="text-muted-foreground text-sm">Review, feature, audit, and manage university student projects</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportProjectsList('csv')}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportProjectsList('excel')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
            </Button>
          </div>
        </div>

        {error ? <Card className="p-4 border-red-200 text-red-600 bg-red-50">{error}</Card> : null}

        {/* 1. PROJECT STATISTICS DASHBOARD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="p-3.5 border-l-4 border-l-blue-600">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Total Projects</span>
            <span className="text-xl font-black text-foreground">{stats.totalProjects}</span>
          </Card>

          <Card className="p-3.5 border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Published</span>
            <span className="text-xl font-black text-emerald-600">{stats.publishedProjects}</span>
          </Card>

          <Card className="p-3.5 border-l-4 border-l-amber-500">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Featured</span>
            <span className="text-xl font-black text-amber-600">{stats.featuredProjects}</span>
          </Card>

          <Card className="p-3.5 border-l-4 border-l-slate-400">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Hidden</span>
            <span className="text-xl font-black text-slate-600">{stats.hiddenProjects}</span>
          </Card>

          <Card className="p-3.5 border-l-4 border-l-cyan-500">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Total Views</span>
            <span className="text-xl font-black text-cyan-600">{stats.totalViews.toLocaleString()}</span>
          </Card>

          <Card className="p-3.5 border-l-4 border-l-rose-500">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Total Likes</span>
            <span className="text-xl font-black text-rose-600">{stats.totalLikes.toLocaleString()}</span>
          </Card>

          <Card className="p-3.5 border-l-4 border-l-teal-500">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Today Uploads</span>
            <span className="text-xl font-black text-teal-600">{stats.todayUploads}</span>
          </Card>

          <Card className="p-3.5 border-l-4 border-l-purple-500">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">This Month</span>
            <span className="text-xl font-black text-purple-600">{stats.thisMonthUploads}</span>
          </Card>
        </div>

        {/* 2 & 3. SEARCH & ADVANCED FILTERS (Order: Search, From Date, To Date, Branch, Section, Apply, Reset) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Filter className="w-4 h-4 text-primary" /> Search & Advanced Filters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. Search */}
            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Project name, student name, reg no..."
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            {/* 2. From Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">From Date</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 text-xs" />
            </div>

            {/* 3. To Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">To Date</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 text-xs" />
            </div>

            {/* 4. Branch (Dynamic from DB) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Branch</label>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs">
                <option value="">All Branches</option>
                {branchOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* 5. Section (Dynamic from DB) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Section</label>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs">
                <option value="">All Sections</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>

            {/* 6 & 7. Apply & Reset Buttons */}
            <div className="flex items-end gap-1.5 pt-1">
              <Button size="sm" onClick={handleApplyFilters} className="h-9 text-xs flex-1">
                Apply
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetFilters} className="h-9 text-xs flex-1">
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* FLOATING BULK ACTION TOOLBAR */}
        {selectedProjects.length > 0 && (
          <div className="sticky top-20 z-30 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700 animate-in fade-in">
            <div className="flex items-center gap-3 font-semibold text-sm pl-2">
              <span className="bg-primary/20 text-teal-400 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                {selectedProjects.length} Projects Selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="destructive" onClick={() => setShowBulkDeleteModal(true)} className="h-8 text-xs font-semibold">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Bulk Delete
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowBulkModifyModal(true)} className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Bulk Modify
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedProjects([])} className="h-8 text-xs text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* 4. MAIN PROJECT TABLE */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Projects Directory ({totalItems})</h2>
            <span className="text-xs text-muted-foreground">Showing page {page} of {totalPages}</span>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center border rounded-xl bg-muted/10">
              No projects found matching the selected criteria.
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProjects.length === projects.length && projects.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </TableHead>
                    <TableHead className="font-bold">Project</TableHead>
                    <TableHead className="font-bold">Student</TableHead>
                    <TableHead className="font-bold">Branch</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold text-center">Views</TableHead>
                    <TableHead className="font-bold text-center">Likes</TableHead>
                    <TableHead className="font-bold text-center">Status</TableHead>
                    <TableHead className="font-bold text-center">Featured</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const isSelected = selectedProjects.includes(project.id);
                    const isFeatured = Number(project.isFeatured) === 1;

                    return (
                      <TableRow key={project.id} className={isSelected ? 'bg-primary/5' : ''}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectProject(project.id)}
                            className="rounded border-slate-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border">
                              {project.thumbnailUrl ? (
                                <Image src={project.thumbnailUrl} alt={project.title} width={40} height={40} className="object-cover w-full h-full" />
                              ) : (
                                <FolderGit2 className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-foreground line-clamp-1">{project.title}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">ID: {project.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold">{project.studentName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{project.registrationNo}</div>
                        </TableCell>
                        <TableCell className="text-xs">{project.studentDepartment || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{project.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono font-semibold">{project.views}</TableCell>
                        <TableCell className="text-center text-xs font-mono font-semibold text-rose-500">{project.likes}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={project.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                            {project.status || 'published'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => toggleFeatured(project)}
                            className={`p-1.5 rounded-full transition-colors ${isFeatured ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-slate-300 hover:text-amber-400'}`}
                            title={isFeatured ? 'Featured (Click to unfeature)' : 'Mark as Featured'}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewProject(project)} title="View Details" className="h-8 w-8">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => startEdit(project)} title="Edit Project" className="h-8 w-8 text-blue-600">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteProjectTarget(project)} title="Delete Project" className="h-8 w-8 text-rose-600">
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

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-xs text-muted-foreground font-medium">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </Card>

        {/* MOST VIEWED & MOST LIKED SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b pb-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" /> Top 10 Most Viewed Projects
            </div>
            <div className="space-y-2">
              {stats.topViewed.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-muted-foreground w-4 text-center">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-foreground line-clamp-1">{p.title}</div>
                      <div className="text-[10px] text-muted-foreground">{p.studentName} ({p.regNo})</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-cyan-600 border-cyan-200">{p.views} views</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b pb-2">
              <Heart className="w-4 h-4 text-rose-500" /> Top 10 Most Liked Projects
            </div>
            <div className="space-y-2">
              {stats.topLiked.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-muted-foreground w-4 text-center">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-foreground line-clamp-1">{p.title}</div>
                      <div className="text-[10px] text-muted-foreground">{p.studentName} ({p.regNo})</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-rose-600 border-rose-200">{p.likes} likes</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* PROJECT ACTIVITY LOG SECTION */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-foreground">
            <History className="w-5 h-5 text-primary" /> Admin Project Audit & Activity Log
          </div>

          <div className="rounded-xl border overflow-x-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Date & Time</TableHead>
                  <TableHead className="font-bold">Admin</TableHead>
                  <TableHead className="font-bold">Action</TableHead>
                  <TableHead className="font-bold">Project Title / ID</TableHead>
                  <TableHead className="font-bold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">No activity logs recorded yet.</TableCell>
                  </TableRow>
                ) : (
                  activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono">{log.createdAt}</TableCell>
                      <TableCell className="text-xs font-semibold">{log.adminEmail}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{log.projectTitle || log.projectId || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{log.details || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* MODAL 1: VIEW PROJECT DETAILS */}
        <Dialog open={!!viewProject} onOpenChange={(open) => !open && setViewProject(null)}>
          <DialogContent className="max-w-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-primary" /> Project Information
              </DialogTitle>
              <DialogDescription>Full details for project {viewProject?.id}</DialogDescription>
            </DialogHeader>

            {viewProject && (
              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border">
                  <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {viewProject.thumbnailUrl ? (
                      <Image src={viewProject.thumbnailUrl} alt={viewProject.title} width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <FolderGit2 className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">{viewProject.title}</h3>
                    <div className="flex flex-wrap gap-2 text-muted-foreground">
                      <span>By <strong>{viewProject.studentName}</strong> ({viewProject.registrationNo})</span>
                      <span>• {viewProject.studentDepartment} ({viewProject.studentYear})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Description</span>
                  <p className="p-3 bg-muted/20 rounded-xl text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {viewProject.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Category</span>
                    <span className="font-semibold text-foreground">{viewProject.category}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Views</span>
                    <span className="font-semibold text-cyan-600 font-mono">{viewProject.views}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Likes</span>
                    <span className="font-semibold text-rose-500 font-mono">{viewProject.likes}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Status</span>
                    <Badge variant="outline" className="mt-0.5">{viewProject.status}</Badge>
                  </div>
                </div>

                {(viewProject.githubLink || viewProject.demoLink) && (
                  <div className="flex gap-3 pt-2">
                    {viewProject.githubLink && (
                      <a href={viewProject.githubLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold">
                        <Github className="w-4 h-4" /> GitHub Repository
                      </a>
                    )}
                    {viewProject.demoLink && (
                      <a href={viewProject.demoLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline font-semibold">
                        <ExternalLink className="w-4 h-4" /> Live Demo
                      </a>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t">
                  <Button variant="outline" onClick={() => setViewProject(null)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL 2: EDIT PROJECT */}
        <Dialog open={!!editProject} onOpenChange={(open) => !open && setEditProject(null)}>
          <DialogContent className="max-w-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" /> Edit Project Details
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Project Title *</label>
                <Input
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-md border border-input bg-background text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="AI/ML">AI / ML</option>
                    <option value="Cloud/DevOps">Cloud / DevOps</option>
                    <option value="IoT">IoT</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Blockchain">Blockchain</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">GitHub Link</label>
                  <Input
                    value={editForm.githubLink}
                    onChange={(e) => setEditForm({ ...editForm, githubLink: e.target.value })}
                    placeholder="https://github.com/..."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Live Demo Link</label>
                  <Input
                    value={editForm.demoLink}
                    onChange={(e) => setEditForm({ ...editForm, demoLink: e.target.value })}
                    placeholder="https://..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editFeatured"
                  checked={editForm.isFeatured}
                  onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <label htmlFor="editFeatured" className="font-semibold text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> Mark as Featured Project
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setEditProject(null)}>Cancel</Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL 3: DELETE SINGLE PROJECT CONFIRMATION */}
        <Dialog open={!!deleteProjectTarget} onOpenChange={(open) => !open && setDeleteProjectTarget(null)}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Delete Project?
              </DialogTitle>
              <DialogDescription className="text-xs">
                You are about to permanently delete project <strong>"{deleteProjectTarget?.title}"</strong>.
              </DialogDescription>
            </DialogHeader>

            <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-900 font-semibold my-2">
              This action cannot be undone. All project files, likes, and saves will be deleted.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setDeleteProjectTarget(null)} disabled={actionLoading}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteSingle} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL 4: BULK DELETE CONFIRMATION */}
        <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Delete Selected Projects?
              </DialogTitle>
              <DialogDescription className="text-xs">
                You are about to permanently delete {selectedProjects.length} selected project(s).
              </DialogDescription>
            </DialogHeader>

            <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-900 font-semibold my-2">
              This action cannot be undone. All selected project records, likes, and saves will be permanently removed.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)} disabled={actionLoading}>Cancel</Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete Projects'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL 5: BULK MODIFY */}
        <Dialog open={showBulkModifyModal} onOpenChange={setShowBulkModifyModal}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" /> Bulk Modify Projects
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update attributes for {selectedProjects.length} selected project(s).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground block">Category</label>
                <select
                  value={bulkModifyForm.category}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, category: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="KEEP_EXISTING">Keep Existing</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="AI/ML">AI / ML</option>
                  <option value="Cloud/DevOps">Cloud / DevOps</option>
                  <option value="IoT">IoT</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Blockchain">Blockchain</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground block">Status</label>
                <select
                  value={bulkModifyForm.status}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, status: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="KEEP_EXISTING">Keep Existing</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground block">Featured Status</label>
                <select
                  value={bulkModifyForm.isFeatured}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, isFeatured: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="KEEP_EXISTING">Keep Existing</option>
                  <option value="1">Mark as Featured</option>
                  <option value="0">Remove Featured</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setShowBulkModifyModal(false)} disabled={actionLoading}>Cancel</Button>
              <Button onClick={handleBulkModify} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {actionLoading ? 'Updating...' : 'Update Selected Projects'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
