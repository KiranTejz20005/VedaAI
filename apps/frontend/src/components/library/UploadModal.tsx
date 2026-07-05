'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, AlertCircle } from 'lucide-react';
import { LibraryService } from '@/services/library.service';
import { Button } from '@/components/ui/button';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RESOURCE_TYPES = ['Document', 'PDF', 'Video', 'Presentation', 'Image', 'Archive', 'Other'];
const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Computer Science', 'Art', 'General'];
const CLASSES = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'General'];

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('Document');
  const [subject, setSubject] = useState('General');
  const [className, setClassName] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        // Auto-fill title from filename without extension
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!title) {
        setTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please provide a file and a title');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('resourceType', resourceType);
      formData.append('subject', subject);
      formData.append('className', className);

      await LibraryService.uploadResource(formData);
      onSuccess();
      onClose();
      // Reset
      setFile(null);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Upload Resource</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Drag & Drop Area */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
                ${file ? 'border-primary/50 bg-primary/5' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <File size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 cursor-pointer">
                  <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF, DOCX, PPTX, MP4 or standard files (max. 50MB)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="E.g., Chapter 4 Physics Notes"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Resource Type</label>
                <select 
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {RESOURCE_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Class/Group</label>
                <select 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Briefly describe what this resource is about..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="upload-form" disabled={loading || !file || !title}>
            {loading ? 'Uploading...' : 'Upload Resource'}
          </Button>
        </div>
      </div>
    </div>
  );
}
