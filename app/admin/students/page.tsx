'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronLeft, Search, Pencil, Trash2, Eye, X, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

interface StudentRow {
  id: string;
  userId: string;
  name: string;
  registrationNo: string;
  year: number;
  academicYear: string;
  department: string;
  section?: string;
  email: string;
  mobileNo: string;
  createdAt?: string;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('ASC');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [error, setError] = useState('');

  // Bulk Selection
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Single Edit
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '', year: '' });

  // Bulk Delete Modal
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk Modify Modal
  const [showBulkModifyModal, setShowBulkModifyModal] = useState(false);
  const [bulkModifyForm, setBulkModifyForm] = useState({
    branch: 'KEEP_EXISTING',
    year: 'KEEP_EXISTING',
    section: 'KEEP_EXISTING'
  });

  const getAdminHeaders = () => {
    return {
      'x-admin-auth': 'true',
      'x-admin-email': localStorage.getItem('adminEmail') || '',
      'x-admin-id': localStorage.getItem('adminId') || '',
    };
  };

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
      router.push('/auth');
      return;
    }

    setAuthorized(true);
    loadStudents();
  }, [router]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        sortField,
        sortDirection
      });
      if (yearFilter) params.set('year', yearFilter);
      if (branchFilter) params.set('branch', branchFilter);

      const url = `/api/admin/students?${params.toString()}`;
      const res = await fetch(url, { headers: getAdminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load students');

      setStudents(data.students || []);
      setTotalPages(data.totalPages || 1);
      setTotalStudents(data.total || data.students?.length || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    const handler = window.setTimeout(() => loadStudents(), 250);
    return () => window.clearTimeout(handler);
  }, [search, yearFilter, branchFilter, sortField, sortDirection, page, authorized]);

  const filteredStudents = useMemo(() => students, [students]);

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = filteredStudents.map((s) => s.id);
      setSelectedStudents((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudents((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single Edit
  const startEdit = (student: StudentRow) => {
    setEditStudent(student);
    setEditForm({ name: student.name, email: student.email, department: student.department, year: String(student.year) });
  };

  const saveEdit = async () => {
    if (!editStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${encodeURIComponent(editStudent.id)}`, {
        method: 'PATCH',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      toast.success('Student updated successfully.');
      setEditStudent(null);
      await loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  // Single Delete
  const deleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      toast.success('Student deleted successfully.');
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
      await loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/students/bulk-delete', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedStudents })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk delete failed');

      toast.success(`Successfully deleted ${data.deletedCount} student account(s).`);
      setSelectedStudents([]);
      setShowBulkDeleteModal(false);
      await loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'Bulk delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Modify
  const handleBulkModify = async () => {
    if (selectedStudents.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/students/bulk-modify', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudents,
          branch: bulkModifyForm.branch,
          year: bulkModifyForm.year,
          section: bulkModifyForm.section
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk modify failed');

      toast.success(`Successfully updated ${data.updatedCount} student record(s).`);
      setSelectedStudents([]);
      setShowBulkModifyModal(false);
      setBulkModifyForm({ branch: 'KEEP_EXISTING', year: 'KEEP_EXISTING', section: 'KEEP_EXISTING' });
      await loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'Bulk modify failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!authorized) return null;

  const allOnPageSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents.includes(s.id));

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <Toaster />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon"><ChevronLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Student Management</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Review, manage, and view college students</p>
          </div>
        </div>

        {error ? <Card className="p-4 mb-4 border-red-200 text-red-600 text-xs sm:text-sm">{error}</Card> : null}

        {/* FLOATING BULK ACTION TOOLBAR */}
        {selectedStudents.length > 0 && (
          <div className="sticky top-20 z-30 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700 animate-in fade-in">
            <div className="flex items-center gap-3 font-semibold text-sm pl-2">
              <span className="bg-primary/20 text-teal-400 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                {selectedStudents.length} Students Selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="destructive" onClick={() => setShowBulkDeleteModal(true)} className="h-8 text-xs font-semibold">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Selected
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowBulkModifyModal(true)} className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Bulk Modify
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedStudents([])} className="h-8 text-xs text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5 mr-1" /> Cancel Selection
              </Button>
            </div>
          </div>
        )}

        <Card className="p-4 sm:p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, roll, email" className="pl-10 text-xs sm:text-sm h-10" />
          </div>

          {/* Filters & Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-xs sm:text-sm">
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">Final Year</option>
            </select>
            <Input value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }} placeholder="Filter by branch" className="text-xs sm:text-sm h-10" />
            <select value={`${sortField}:${sortDirection}`} onChange={(e) => { const [field, direction] = e.target.value.split(':'); setSortField(field); setSortDirection(direction); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-xs sm:text-sm">
              <option value="name:ASC">Name (A-Z)</option>
              <option value="name:DESC">Name (Z-A)</option>
              <option value="year:ASC">Year (Low-High)</option>
              <option value="year:DESC">Year (High-Low)</option>
              <option value="department:ASC">Branch (A-Z)</option>
            </select>
          </div>

          {/* Students Table */}
          {loading ? <div className="text-sm text-muted-foreground py-8 text-center">Loading students...</div> : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300"
                        title="Select all currently listed students"
                      />
                    </TableHead>
                    <TableHead className="font-bold">Roll No</TableHead>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Year</TableHead>
                    <TableHead className="font-bold">Branch</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                        No students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = selectedStudents.includes(student.id);

                      return (
                        <TableRow key={student.id} className={isSelected ? 'bg-primary/5' : ''}>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectStudent(student.id)}
                              className="rounded border-slate-300"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-xs font-mono">{student.id}</TableCell>
                          <TableCell className="text-xs font-semibold">{student.name}</TableCell>
                          <TableCell className="text-xs">{student.academicYear}</TableCell>
                          <TableCell className="text-xs">{student.department}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{student.email}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEdit(student)} title="Edit Student" className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteStudent(student.id)} title="Delete Student" className="h-8 w-8 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => router.push(`/student/${encodeURIComponent(student.id)}`)} title="View Student" className="h-8 w-8 text-blue-600"><Eye className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 pt-2 border-t">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-xs text-muted-foreground font-medium">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </Card>

        {/* MODAL 1: SINGLE EDIT DIALOG */}
        <Dialog open={!!editStudent} onOpenChange={(open) => !open && setEditStudent(null)}>
          <DialogContent className="max-w-md w-[95vw] rounded-2xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Edit Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Email</label>
                <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Branch</label>
                <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} placeholder="Branch" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Year</label>
                <Input value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} placeholder="Year" className="h-9 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL 2: BULK DELETE CONFIRMATION */}
        <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Delete Selected Students?
              </DialogTitle>
              <DialogDescription className="text-xs">
                You are about to permanently delete {selectedStudents.length} selected student account(s).
              </DialogDescription>
            </DialogHeader>

            <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-900 font-semibold my-2">
              This action cannot be undone. All selected student accounts, profile data, project references, and permissions will be permanently removed.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)} disabled={actionLoading}>Cancel</Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete Students'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL 3: BULK MODIFY */}
        <Dialog open={showBulkModifyModal} onOpenChange={setShowBulkModifyModal}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" /> Bulk Modify Students
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update attributes for {selectedStudents.length} selected student(s).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground block">Branch</label>
                <select
                  value={bulkModifyForm.branch}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, branch: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="KEEP_EXISTING">Keep Existing</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="AIML">AIML</option>
                  <option value="CSM">CSM</option>
                  <option value="CSD">CSD</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground block">Year</label>
                <select
                  value={bulkModifyForm.year}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, year: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="KEEP_EXISTING">Keep Existing</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="Final">Final Year</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground block">Section</label>
                <select
                  value={bulkModifyForm.section}
                  onChange={(e) => setBulkModifyForm({ ...bulkModifyForm, section: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
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
              <Button variant="outline" onClick={() => setShowBulkModifyModal(false)} disabled={actionLoading}>Cancel</Button>
              <Button onClick={handleBulkModify} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {actionLoading ? 'Updating...' : 'Update Selected Students'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
