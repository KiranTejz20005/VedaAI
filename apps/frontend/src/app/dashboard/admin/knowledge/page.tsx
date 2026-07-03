'use client';

import { useRouter } from 'next/navigation';import { useState, useEffect, useCallback } from 'react';
import { 
  Search,
  BookOpen,
  PlayCircle,
  MoreHorizontal,
  ChevronRight,
  Plus,
  FileText,
  Video,
  Code,
  Network,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { adminService } from '@/services/admin.service';
import { format } from 'date-fns';

interface KnowledgeStats {
  totalArticles: number;
  trainingVideos: number;
  categories: { name: string; count: number }[];
  activities: {
    id: string;
    resourceName: string;
    category: string;
    type: string;
    organization: string;
    lastModified: string;
  }[];
}

export default function KnowledgePage() {
  const [data, setData] = useState<KnowledgeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All Resources');
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminService.getKnowledgeStats();
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load knowledge base stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (isLoading && !data) return <LoadingState lines={8} />;
  if (error && !data) return <ErrorState message={error} onRetry={fetchStats} />;

  const { totalArticles, trainingVideos, categories, activities } = data || {
    totalArticles: 1482,
    trainingVideos: 124,
    categories: [],
    activities: []
  };

  const getCategoryIcon = (name: string) => {
    if (name.includes('Architecture')) return <div style={{ width: 36, height: 36, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Network size={18} color="#4B5563" /></div>;
    if (name.includes('Security')) return <div style={{ width: 36, height: 36, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={18} color="#4B5563" /></div>;
    if (name.includes('API')) return <div style={{ width: 36, height: 36, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Code size={18} color="#4B5563" /></div>;
    return <div style={{ width: 36, height: 36, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={18} color="#4B5563" /></div>;
  };

  const getTypeStyle = (type: string) => {
    if (type === 'DOCUMENT') return { bg: '#EFF6FF', color: '#3B82F6' };
    if (type === 'MEDIA') return { bg: '#FFF7ED', color: '#EA580C' };
    if (type === 'CODE') return { bg: '#ECFDF5', color: '#10B981' };
    return { bg: '#F3F4F6', color: '#6B7280' };
  };

  const getTypeIcon = (type: string) => {
    if (type === 'DOCUMENT') return <FileText size={20} color="#6B7280" />;
    if (type === 'MEDIA') return <Video size={20} color="#EA580C" />;
    if (type === 'CODE') return <Code size={20} color="#10B981" />;
    return <FileText size={20} color="#6B7280" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%', paddingBottom: 48 }}>
      <PageHeader
        title="Knowledge Base"
        subtitle="Centralized repository for system documentation, training materials, and support articles. Manage global resources shared across organizations."
      />

      {/* Search and Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 99, padding: '4px 4px 4px 16px' }}>
          <Search size={18} color="#9CA3AF" />
          <input 
            type="text" 
            placeholder="Search documentation, articles, or training modules..." 
            style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 12px', fontSize: 14, color: '#111827' }}
          />
          <button style={{ background: '#000000', color: '#FFFFFF', border: 'none', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Search
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {['All Resources', 'System Admin', 'User Training', 'API Reference', 'Organization Onboarding', 'Security Docs'].map((pill, i) => {
            const isActive = activeCategory === pill;
            return (
            <button 
              key={i} 
              onClick={() => setActiveCategory(pill)}
              style={{ 
              whiteSpace: 'nowrap',
              padding: '8px 16px', 
              borderRadius: 99, 
              fontSize: 13, 
              fontWeight: 600,
              cursor: 'pointer',
              border: isActive ? 'none' : '1px solid #E5E7EB',
              background: isActive ? '#000000' : '#FFFFFF',
              color: isActive ? '#FFFFFF' : '#4B5563',
            }}>
              {pill}
            </button>
          )})}
        </div>
      </div>

      {/* Top Grid: Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="#374151" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '4px 10px', borderRadius: 99 }}>
              +12 Today
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Total Articles</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#111827' }}>
            {totalArticles.toLocaleString()}
          </div>
        </Card>

        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlayCircle size={20} color="#D97706" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
              85% Completion
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Training Videos</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#111827' }}>
            {trainingVideos.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Browse Categories Sidebar */}
        <Card padding="24px" style={{ background: '#FFFFFF', borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>Browse Categories</h3>
            <MoreHorizontal size={20} color="#9CA3AF" cursor="pointer" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {categories.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={18} color="#4B5563" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{cat.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{cat.count} Articles</div>
                  </div>
                </div>
                <ChevronRight size={18} color="#D1D5DB" />
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsCategoriesModalOpen(true)}
            style={{ width: '100%', padding: '12px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            View All Categories
          </button>
        </Card>

        {/* Recent Repository Activity */}
        <Card padding="0" style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#4B5563' }}>Recent Repository Activity</h3>
            <button 
              onClick={() => setIsAddResourceModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#000000', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} /> Add Resource
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>RESOURCE NAME</th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>TYPE</th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>ORGANIZATION</th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>LAST MODIFIED</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredActivities = activities.filter((act: any) => {
                  if (activeCategory === 'All Resources') return true;
                  
                  const cat = act.category || '';
                  if (activeCategory === 'System Admin') return cat.includes('Technical') || cat.includes('System');
                  if (activeCategory === 'User Training') return cat.includes('User');
                  if (activeCategory === 'API Reference') return cat.includes('API') || act.resourceName?.includes('API');
                  if (activeCategory === 'Organization Onboarding') return cat.includes('Legal') || cat.includes('Org');
                  if (activeCategory === 'Security Docs') return cat.includes('Security') || act.resourceName?.includes('Security');
                  
                  return cat === activeCategory;
                });

                if (filteredActivities.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} style={{ padding: '32px 24px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                        No recent activity found for this category.
                      </td>
                    </tr>
                  );
                }

                return filteredActivities.map((act, idx) => {
                  const style = getTypeStyle(act.type);
                  return (
                    <tr key={act.id} style={{ borderBottom: idx === filteredActivities.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          {getTypeIcon(act.type)}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{act.resourceName}</div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>{act.category}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: style.bg,
                          color: style.color,
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.05em'
                        }}>
                          {act.type}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: 13, color: '#4B5563' }}>
                        {act.organization}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 2 }}>
                          {format(new Date(act.lastModified), 'dd MMM yyyy')}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #F3F4F6', background: '#F9FAFB' }}>
            <button 
              onClick={() => router.push('/dashboard/admin/system-health')}
              style={{ background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer' }}>
              See full activity log
            </button>
          </div>
        </Card>
      </div>

      {/* View All Categories Modal */}
      {isCategoriesModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8, color: '#111827' }}>All Categories</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Browse all available knowledge base categories.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
              {categories.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #F3F4F6', borderRadius: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{cat.count} Articles</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button 
                onClick={() => setIsCategoriesModalOpen(false)}
                style={{ padding: '10px 16px', background: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#FFF', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {isAddResourceModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8, color: '#111827' }}>Add New Resource</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Upload a new document or link a training material.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Resource Title</label>
                <input type="text" placeholder="e.g. Q3 Architecture Review" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
                <select style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', backgroundColor: '#FFF' }}>
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>File or Link URL</label>
                <input type="text" placeholder="https://..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button 
                onClick={() => setIsAddResourceModalOpen(false)}
                style={{ padding: '10px 16px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={() => setIsAddResourceModalOpen(false)}
                style={{ padding: '10px 16px', background: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#FFF', cursor: 'pointer' }}>
                Save Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
