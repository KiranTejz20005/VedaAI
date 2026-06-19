'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  GraduationCap, Plus, Search, Edit3, Trash2, Power, Key, Upload,
  Mail, Users, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/PageHeader';
import { DataTable } from '@/design-system/DataTable';
import { Badge } from '@/design-system/Badge';
import { Dialog } from '@/design-system/Dialog';
import { Button } from '@/design-system/Button';
import { Input } from '@/design-system/Input';
import { Select } from '@/design-system/Select';
import { LoadingState } from '@/design-system/LoadingState';
import { EmptyState } from '@/design-system/EmptyState';

interface FacultyRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: { id: string; name: string } | null;
  departmentId?: string | null;
  designation: string;
  subjects: string[];
  classes: Array<{ id: string; grade: string; section: string }>;
  status: string;
}

interface Department {
  id: string;
  name: string;
}

export default function FacultyManagement() {
  const [list, setList] = useState<FacultyRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRecord | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [subjects, setSubjects] = useState('');
  const [sendInvite, setSendInvite] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facRes, deptRes] = await Promise.all([
        api.get('/admin/users?role=FACULTY'),
        api.get('/admin/departments'),
      ]);
      if (facRes.data?.success) setList(facRes.data.data);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
    } catch {
      toast.error('Failed to load faculty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedFaculty(null);
    setFirstName(''); setLastName(''); setEmail('');
    setDepartmentId(''); setDesignation(''); setSubjects(''); setSendInvite(false);
    setShowModal(true);
  };

  const handleOpenEdit = (f: FacultyRecord) => {
    setModalType('edit');
    setSelectedFaculty(f);
    setFirstName(f.firstName);
    setLastName(f.lastName);
    setEmail(f.email);
    setDepartmentId(f.departmentId || '');
    setDesignation(f.designation || '');
    setSubjects((f.subjects || []).join(', '));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error('First Name, Last Name, and Email are required.');
      return;
    }
    const payload = {
      firstName, lastName, email,
      role: 'FACULTY',
      departmentId: departmentId || undefined,
      designation,
      subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (modalType === 'create') {
        const endpoint = sendInvite ? '/admin/users/invite' : '/admin/users';
        const res = await api.post(endpoint, payload);
        if (res.data?.success) {
          toast.success(sendInvite ? 'Invitation sent!' : 'Faculty created successfully!');
          setShowModal(false); loadData();
        }
      } else if (selectedFaculty) {
        const res = await api.put(`/admin/users/${selectedFaculty.id}`, payload);
        if (res.data?.success) {
          toast.success('Faculty updated successfully!');
          setShowModal(false); loadData();
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleToggleSuspend = async (f: FacultyRecord) => {
    const isSuspended = f.status === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} this faculty?`)) return;
    try {
      const res = await api.put(`/admin/users/${f.id}/suspend`, { suspend: !isSuspended });
      if (res.data?.success) {
        toast.success(`Faculty ${isSuspended ? 'activated' : 'suspended'}.`);
        loadData();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Toggle suspend failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data?.success) { toast.success('Faculty deleted.'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Deletion failed'); }
  };

  const handleResetPassword = async (f: FacultyRecord) => {
    const newPass = prompt(`Enter new password for ${f.firstName}:`, 'TempPassword@123');
    if (!newPass || newPass.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    try {
      const res = await api.post(`/admin/users/${f.id}/reset-password`, { newPassword: newPass });
      if (res.data?.success) { toast.success('Password reset successfully.'); loadData(); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Reset failed'); }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) { toast.error('Please select a CSV file.'); return; }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const res = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        toast.success('Faculty imported successfully!');
        setShowImportModal(false); setCsvFile(null); loadData();
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Import failed'); }
  };

  const filteredList = list.filter(f =>
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader
          title="Faculty Management"
          subtitle="Manage teachers, designations, and department assignments."
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => setShowImportModal(true)}>
            Import CSV
          </Button>
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleOpenCreate}>
            Invite Faculty
          </Button>
        </div>
      </div>

      <Input
        icon={<Search size={16} />}
        placeholder="Search faculty by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 400 }}
      />

      {loading ? (
        <LoadingState lines={5} />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={32} />}
          title="No faculty members found"
          description="Try adjusting your search or invite new faculty."
          action={search ? undefined : handleOpenCreate}
          actionLabel={search ? undefined : 'Invite Faculty'}
        />
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (_: any, row: FacultyRecord) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--text-primary)' }}>
                <GraduationCap size={14} color="var(--brand)" />
                {row.firstName} {row.lastName}
              </div>
            )},
            { key: 'email', header: 'Email', render: (value: string) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                <Mail size={10} /> {value}
              </span>
            )},
            { key: 'department', header: 'Department', render: (_: any, row: FacultyRecord) => row.department?.name || '\u2014' },
            { key: 'designation', header: 'Designation' },
            { key: 'subjects', header: 'Subjects', render: (value: string[]) => (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {value.slice(0, 2).map((s, i) => (
                  <span key={i} style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>{s}</span>
                ))}
                {value.length > 2 && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>+{value.length - 2}</span>}
              </div>
            )},
            { key: 'classes', header: 'Classes', align: 'center', render: (_: any, row: FacultyRecord) => (
              <Badge variant="info">{(row.classes || []).length}</Badge>
            )},
            { key: 'status', header: 'Status', align: 'center', render: (value: string) => (
              <Badge variant={value === 'ACTIVE' ? 'success' : 'error'}>{value || 'ACTIVE'}</Badge>
            )},
            { key: 'id', header: 'Actions', align: 'right', render: (_: any, row: FacultyRecord) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="ghost" size="sm" icon={<Edit3 size={14} />} onClick={() => handleOpenEdit(row)} />
                <Button variant="ghost" size="sm" icon={<Key size={14} />} onClick={() => handleResetPassword(row)} />
                <Button variant="ghost" size="sm" icon={<Power size={14} />} onClick={() => handleToggleSuspend(row)} />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(row.id)} />
              </div>
            )},
          ]}
          data={filteredList}
        />
      )}

      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === 'create' ? 'Invite / Create Faculty' : 'Edit Faculty'}
        size="md"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="First Name *" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
            <Input label="Last Name *" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
          </div>
          <Input label="Email *" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@school.edu" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={[
                { value: '', label: 'Select Department' },
                ...departments.map(d => ({ value: d.id, label: d.name })),
              ]}
            />
            <Input label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Professor" />
          </div>
          <Input label="Subjects (comma separated)" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Math, Physics, Chemistry" />
          {modalType === 'create' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} style={{ borderRadius: '4px' }} />
              Send invitation email
            </label>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }} type="button">Cancel</Button>
            <Button variant="primary" style={{ flex: 1 }} type="submit">
              {modalType === 'create' ? (sendInvite ? 'Send Invitation' : 'Create Faculty') : 'Update Faculty'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={showImportModal}
        onClose={() => { setShowImportModal(false); setCsvFile(null); }}
        title="Import Faculty CSV"
        size="sm"
      >
        <form onSubmit={handleImportCsv} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
              background: 'var(--bg-input)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
          >
            <input
              type="file"
              accept=".csv"
              required
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
            <Upload size={32} color="var(--brand)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {csvFile ? csvFile.name : 'Select CSV file'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
              CSV with columns: firstName, lastName, email, department, designation, subjects
            </div>
          </div>
          <Button variant="primary" type="submit" disabled={!csvFile}>
            Import Faculty
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
