import { apiClient } from './api.client';

export interface LibraryResource {
  id: string;
  title: string;
  description?: string;
  resourceType: string;
  subject?: string;
  className?: string;
  fileUrl: string;
  fileSize?: number;
  uploadedById: string;
  uploadedBy?: { firstName: string; lastName: string };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const LibraryService = {
  uploadResource: async (formData: FormData): Promise<LibraryResource> => {
    // Note: apiClient uses axios, so we can post FormData directly
    // Also, normally you might have a different header for multipart/form-data
    // but axios sets it automatically when passing FormData
    const response = await apiClient.post<{ success: boolean; data: LibraryResource }>('/library', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  getResources: async (params?: { subject?: string; className?: string; resourceType?: string; search?: string }): Promise<LibraryResource[]> => {
    const response = await apiClient.get<{ success: boolean; data: LibraryResource[] }>('/library', { params });
    return response.data.data;
  },

  updateResource: async (id: string, data: Partial<LibraryResource>): Promise<LibraryResource> => {
    const response = await apiClient.put<{ success: boolean; data: LibraryResource }>(`/library/${id}`, data);
    return response.data.data;
  },

  deleteResource: async (id: string): Promise<void> => {
    await apiClient.delete(`/library/${id}`);
  },

  downloadResource: (resource: LibraryResource) => {
    // If it's an Assignment or a Knowledge Document, their fileUrl is already directly accessible 
    if (resource.resourceType === 'Assignment' || resource.resourceType === 'Document') {
      window.open(resource.fileUrl, '_blank');
    } else {
      // Navigate to the download URL which prompts the browser to download for standard LibraryResources
      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/library/${resource.id}/download`, '_blank');
    }
  },
};
