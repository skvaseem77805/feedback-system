'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronLeft, Upload, Download, Search, Pencil, Trash2, Eye, FileSpreadsheet, FileText, FileUp } from 'lucide-react';
import Link from 'next/link';

interface StudentRow {
  id: string;
  userId: string;
  name: string;
  registrationNo: string;
  year: number;
  academicYear: string;
  department: string;
  email: string;
  mobileNo: string;
  createdAt?: string;
}

interface PreviewRow {
  rowNumber: number;
  rollNumber: string;
  name: string;
  year: number | null;
  yearLabel: string;
  branch: string;
  email: string;
  phone: string;
  status: 'new' | 'update' | 'invalid';
  existing: boolean;
  errors: string[];
  valid: boolean;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', mobileNo: '', department: '', year: '' });

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
      const headers = {
        'x-admin-auth': 'true',
        'x-admin-email': localStorage.getItem('adminEmail') || '',
        'x-admin-id': localStorage.getItem('adminId') || '',
      };
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search, sortField, sortDirection });
      if (yearFilter) params.set('year', yearFilter);
      if (branchFilter) params.set('branch', branchFilter);
      const url = `/api/admin/students?${params.toString()}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load students');
      setStudents(data.students || []);
      setTotalPages(data.totalPages || 1);
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

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    const headers = {
      'x-admin-auth': 'true',
      'x-admin-email': localStorage.getItem('adminEmail') || '',
      'x-admin-id': localStorage.getItem('adminId') || '',
    };
    const res = await fetch('/api/admin/students/import', { method: 'POST', body: formData, headers });
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
    const headers = {
      'x-admin-auth': 'true',
      'x-admin-email': localStorage.getItem('adminEmail') || '',
      'x-admin-id': localStorage.getItem('adminId') || '',
    };
    const res = await fetch('/api/admin/students/import', { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Import failed');
      setImporting(false);
      return;
    }
    setReport(data);
    setShowPreview(false);
    await loadStudents();
    setImporting(false);
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
      const headers = {
        'x-admin-auth': 'true',
        'x-admin-email': localStorage.getItem('adminEmail') || '',
        'x-admin-id': localStorage.getItem('adminId') || '',
      };
      const params = new URLSearchParams({ page: '1', pageSize: '100000', search, sortField, sortDirection });
      if (yearFilter) params.set('year', yearFilter);
      if (branchFilter) params.set('branch', branchFilter);
      const res = await fetch(`/api/admin/students?${params.toString()}`, { headers });
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

  const startEdit = (student: StudentRow) => {
    setEditStudent(student);
    setEditForm({ name: student.name, email: student.email, mobileNo: student.mobileNo, department: student.department, year: String(student.year) });
  };

  const saveEdit = async () => {
    if (!editStudent) return;
    const headers = {
      'x-admin-auth': 'true',
      'x-admin-email': localStorage.getItem('adminEmail') || '',
      'x-admin-id': localStorage.getItem('adminId') || '',
    };
    const res = await fetch(`/api/admin/students/${encodeURIComponent(editStudent.id)}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        email: editForm.email,
        mobileNo: editForm.mobileNo,
        department: editForm.department,
        year: editForm.year,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Update failed');
      return;
    }
    setEditStudent(null);
    await loadStudents();
  };

  const deleteStudent = async (studentId: string) => {
    const headers = {
      'x-admin-auth': 'true',
      'x-admin-email': localStorage.getItem('adminEmail') || '',
      'x-admin-id': localStorage.getItem('adminId') || '',
    };
    const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}`, { method: 'DELETE', headers });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Delete failed');
      return;
    }
    await loadStudents();
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon"><ChevronLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Student Management</h1>
            <p className="text-muted-foreground">Import, review, manage, and export college students</p>
          </div>
        </div>

        {error ? <Card className="p-4 mb-4 border-red-200 text-red-600">{error}</Card> : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" />Download Template</Button>
                <Button variant="outline" onClick={exportStudents}><FileSpreadsheet className="w-4 h-4 mr-2" />Export Students</Button>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
                <Button variant="default"><Upload className="w-4 h-4 mr-2" />Import Students</Button>
              </label>
            </div>
            <div
              className={`mb-4 rounded-xl border border-dashed p-4 text-sm transition ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                const file = event.dataTransfer.files?.[0] || null;
                handleFile(file);
              }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Drop student files here or browse manually</p>
                  <p className="text-muted-foreground">Supports CSV, Excel and structured PDF files.</p>
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
                  <Button variant="outline"><Upload className="w-4 h-4 mr-2" />Browse Files</Button>
                </label>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, roll, email" className="pl-10" />
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">Final Year</option>
              </select>
              <Input value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }} placeholder="Filter by branch" />
              <select value={`${sortField}:${sortDirection}`} onChange={(e) => { const [field, direction] = e.target.value.split(':'); setSortField(field); setSortDirection(direction); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="name:ASC">Name (A-Z)</option>
                <option value="name:DESC">Name (Z-A)</option>
                <option value="year:ASC">Year (Low-High)</option>
                <option value="year:DESC">Year (High-Low)</option>
                <option value="department:ASC">Branch (A-Z)</option>
              </select>
            </div>
            {loading ? <div className="text-sm text-muted-foreground">Loading students...</div> : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.academicYear}</TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(student)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteStudent(student.id)}><Trash2 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/student/${encodeURIComponent(student.id)}`)}><Eye className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-between mt-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2"><FileUp className="w-5 h-5" /> <h2 className="text-xl font-semibold">Import Report</h2></div>
            {report ? (
              <div className="space-y-2 text-sm">
                <div>Total Records: <strong>{report.totalRecords}</strong></div>
                <div>Imported: <strong>{report.imported}</strong></div>
                <div>Updated: <strong>{report.updated}</strong></div>
                <div>Skipped: <strong>{report.skipped}</strong></div>
                <div>Errors: <strong>{report.errors}</strong></div>
                <div>Time Taken: <strong>{report.timeTakenMs} ms</strong></div>
              </div>
            ) : <p className="text-sm text-muted-foreground">No import yet. Upload a file to preview and import students.</p>}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Upload Requirements</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Excel (.xlsx/.xls), CSV, or structured PDF</li>
                <li>• Drag and drop or browse files</li>
                <li>• Validations run before insert</li>
              </ul>
            </div>
          </Card>
        </div>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Preview Student Import</DialogTitle>
              <DialogDescription>Confirm the records before database changes take effect.</DialogDescription>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button onClick={confirmImport} disabled={importing}>{importing ? 'Importing...' : 'Confirm Import'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editStudent} onOpenChange={(open) => !open && setEditStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
              <Input value={editForm.mobileNo} onChange={(e) => setEditForm({ ...editForm, mobileNo: e.target.value })} placeholder="Phone" />
              <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} placeholder="Branch" />
              <Input value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} placeholder="Year" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
