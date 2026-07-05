import React from 'react';
import { LibraryResource, LibraryService } from '@/services/library.service';
import { FileText, Download, Edit, Trash2, Clock, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ResourceTableProps {
  resources: LibraryResource[];
  onRefresh: () => void;
  onEdit: (resource: LibraryResource) => void;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return 'Unknown';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ResourceTable({ resources, onRefresh, onEdit }: ResourceTableProps) {
  
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      try {
        await LibraryService.deleteResource(id);
        onRefresh();
      } catch (err) {
        alert('Failed to delete resource');
      }
    }
  };

  const handleDownload = (resource: LibraryResource) => {
    LibraryService.downloadResource(resource);
  };

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-gray-50 border-gray-200">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-500">
          <FileText size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No resources found</h3>
        <p className="text-gray-500 mt-1 max-w-md">Get started by uploading your first resource. You can upload documents, presentations, videos, and more.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <th className="px-6 py-4">Resource Name</th>
              <th className="px-6 py-4">Subject & Class</th>
              <th className="px-6 py-4">Type & Size</th>
              <th className="px-6 py-4">Uploaded</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <File size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 line-clamp-1">{resource.title}</h4>
                      {resource.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{resource.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-900">{resource.subject || 'No Subject'}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 w-fit">
                      {resource.className || 'General'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-900">{resource.resourceType}</span>
                    <span className="text-xs text-gray-500">{formatBytes(resource.fileSize)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-900 flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      {format(new Date(resource.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs text-gray-500">
                      By {resource.uploadedBy?.firstName} {resource.uploadedBy?.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => handleDownload(resource)} title="Open / Download">
                      <Download size={16} />
                    </Button>
                    {resource.resourceType !== 'Assignment' && resource.resourceType !== 'Document' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => onEdit(resource)} title="Edit Metadata">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(resource.id)} title="Delete Resource">
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
