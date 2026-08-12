'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LibraryResource, LibraryService } from '@/services/library.service';
import { UploadModal } from '@/components/library/UploadModal';
import { ResourceTable } from '@/components/library/ResourceTable';
import { PageHeader } from '@/design-system/PageHeader';
import { NativeSelect } from '@/components/ui/native-select';

const SUBJECTS = ['All', 'Math', 'Science', 'English', 'History', 'Computer Science', 'Art', 'General'];
const CLASSES = ['All', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'General'];
const RESOURCE_TYPES = ['All', 'Document', 'PDF', 'Video', 'Presentation', 'Image', 'Archive', 'Other'];

export default function MyLibraryPage() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [className, setClassName] = useState('All');
  const [resourceType, setResourceType] = useState('All');

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await LibraryService.getResources({
        search: search || undefined,
        subject: subject !== 'All' ? subject : undefined,
        className: className !== 'All' ? className : undefined,
        resourceType: resourceType !== 'All' ? resourceType : undefined,
      });
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to fetch library resources', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, subject, className, resourceType]);

  const handleEdit = (resource: LibraryResource) => {
    // In a full implementation, open an edit modal
    alert(`Editing ${resource.title} is not yet implemented in this demo.`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader 
        title="My Library" 
        subtitle="Manage and share your teaching resources and documents."
        actions={
          <Button onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 shrink-0">
            <Upload size={16} /> Upload Resource
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by title, subject, or type..." 
            className="pl-10 bg-gray-50 border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <div className="flex items-center gap-2 shrink-0 border-l pl-4 border-gray-200">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <NativeSelect 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary shrink-0"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
          </NativeSelect>
          <NativeSelect 
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary shrink-0"
          >
            {CLASSES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
          </NativeSelect>
          <NativeSelect 
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary shrink-0"
          >
            {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </NativeSelect>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <ResourceTable 
          resources={resources} 
          onRefresh={fetchResources}
          onEdit={handleEdit}
        />
      )}

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={fetchResources} 
      />
    </div>
  );
}
