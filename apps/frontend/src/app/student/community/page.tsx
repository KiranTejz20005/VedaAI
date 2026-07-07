'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api.client';
import { MessageSquare, Heart, Plus, Users, Search, Lightbulb, Award, Megaphone, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { NewPostModal } from '@/components/community/NewPostModal';

interface Post {
  id: string;
  title?: string;
  content: string;
  type: string;
  author: { id: string; firstName: string; lastName: string; role: string; avatar?: string };
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  imageUrl?: string;
  attachments?: any[];
}

interface TopUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  subject: string;
  karma: number;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
  type: string;
}

export default function CommunityDashboard() {
  const router = useRouter();
  
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [discussions, setDiscussions] = useState<Post[]>([]);
  const [topContributors, setTopContributors] = useState<TopUser[]>([]);
  const [studyGroups, setStudyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [feedRes, topUsersRes, groupsRes] = await Promise.all([
        apiClient.get<{status:string, data: Post[]}>('/community/posts/feed?limit=20'),
        apiClient.get<{status:string, data: TopUser[]}>('/community/users/top'),
        apiClient.get<{status:string, data: Group[]}>('/community/groups')
      ]);

      const allPosts = feedRes.data.data;
      setAnnouncements(allPosts.filter(p => p.type === 'ANNOUNCEMENT').slice(0, 3));
      setDiscussions(allPosts.filter(p => p.type === 'DISCUSSION').slice(0, 10));
      
      setTopContributors(topUsersRes.data.data);
      setStudyGroups(groupsRes.data.data.slice(0, 3));
    } catch (err) {
      console.error('Error fetching community data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #E2E8F0', borderTopColor: '#0F172A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', background: '#F8FAFC', minHeight: '100%', width: '100%', flex: 1, overflowY: 'auto', fontFamily: 'var(--font-sans)', color: '#0F172A', boxSizing: 'border-box' }}>
      
      <NewPostModal 
        isOpen={isNewPostModalOpen} 
        onClose={() => setIsNewPostModalOpen(false)} 
        onSuccess={fetchDashboardData} 
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', margin: '0 0 4px 0' }}>Community Space</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Collaborate, share knowledge, and grow together.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => router.push('/student/community/discussions?filter=mine')}
            style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#F1F5F9')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            My Discussions
          </button>
          <button 
            onClick={() => setIsNewPostModalOpen(true)}
            style={{ padding: '8px 16px', borderRadius: '9999px', border: 'none', background: '#0F172A', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(15,23,42,0.15)' }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Plus size={16} /> New Post
          </button>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px', alignItems: 'start', paddingBottom: '32px' }}>
        
        {/* Main Column */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Announcements Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <div style={{ padding: '6px', background: '#FEF3C7', borderRadius: '10px', color: '#D97706' }}>
                  <Megaphone size={16} />
                </div>
                Announcements
              </h2>
              <button style={{ background: 'none', border: 'none', color: '#D97706', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>
                View all <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', background: '#F8FAFC', borderRadius: '12px' }}>No recent announcements</div>
              ) : (
                announcements.map((ann, idx) => (
                  <div key={ann.id} style={{ display: 'flex', background: idx === 0 ? '#FFFBEB' : '#F8FAFC', borderRadius: '12px', border: `1px solid ${idx === 0 ? '#FDE68A' : '#E2E8F0'}`, overflow: 'hidden', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseOver={(e) => (e.currentTarget.style.transform = 'translateX(4px)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'translateX(0)')}>
                    <div style={{ width: '3px', background: idx === 0 ? '#D97706' : '#94A3B8' }} />
                    <div style={{ padding: '16px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: idx === 0 ? '#D97706' : '#64748B', letterSpacing: '0.05em' }}>
                          {ann.title?.toUpperCase() || 'GENERAL UPDATE'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{formatDistanceToNow(new Date(ann.createdAt), {addSuffix: true})}</span>
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>{ann.content.split('\n')[0]}</h3>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                        {ann.content.split('\n').slice(1).join(' ').substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Discussions */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: '#0F172A' }}>Recent Discussions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {discussions.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', color: '#94A3B8', fontSize: '13px', border: '1px solid #F1F5F9' }}>
                  No discussions found. Be the first to start one!
                </div>
              ) : (
                discussions.map(post => (
                  <div key={post.id} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)')} onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', overflow: 'hidden', flexShrink: 0 }}>
                        {post.author.avatar ? (
                          <img src={post.author.avatar} alt={post.author.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748B', fontSize: '14px' }}>
                            {post.author.firstName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{post.author.firstName} {post.author.lastName}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                          General • {formatDistanceToNow(new Date(post.createdAt), {addSuffix: true})}
                        </div>
                      </div>
                    </div>
                    
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0', color: '#0F172A', lineHeight: 1.4 }}>{post.title || post.content.split('\n')[0]}</h3>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                      {post.title ? post.content : post.content.split('\n').slice(1).join(' ')}
                    </p>

                    {post.imageUrl && (
                      <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', maxHeight: '250px' }}>
                        <img src={post.imageUrl} alt="Post Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseOver={(e) => (e.currentTarget.style.color = '#0F172A')} onMouseOut={(e) => (e.currentTarget.style.color = '#64748B')}>
                          <MessageSquare size={16} /> {post.commentsCount} Replies
                        </button>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseOver={(e) => (e.currentTarget.style.color = '#E11D48')} onMouseOut={(e) => (e.currentTarget.style.color = '#64748B')}>
                          <Heart size={16} /> {post.likesCount} Likes
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>

        {/* Right Column */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Contributors */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A' }}>
              <div style={{ padding: '6px', background: '#F3E8FF', borderRadius: '10px', color: '#9333EA' }}>
                <Award size={16} />
              </div>
              Top Contributors
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {topContributors.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', padding: '16px 0' }}>No contributors yet.</div>
              ) : (
                topContributors.map((user, idx) => {
                  const colors = ['#F59E0B', '#94A3B8', '#B45309']; // Gold, Silver, Bronze
                  const medalColor = colors[idx] || '#E2E8F0';
                  
                  return (
                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px', borderRadius: '10px', transition: 'background 0.2s ease' }} onMouseOver={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', overflow: 'hidden' }}>
                             {user.avatar ? (
                               <img src={user.avatar} alt={user.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : (
                               <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748B', fontSize: '14px' }}>
                                 {user.firstName[0]}
                               </div>
                             )}
                          </div>
                          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: medalColor, color: '#FFF', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {idx + 1}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{user.firstName} {user.lastName}</div>
                          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{user.karma} Karma points</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}>
              See Full Leaderboard
            </button>
          </div>

          {/* Study Groups */}
          <div style={{ background: '#0F172A', borderRadius: '16px', padding: '24px', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(15,23,42,0.15)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', background: 'rgba(249, 115, 22, 0.2)', borderRadius: '10px', color: '#F97316' }}>
                <Users size={16} />
              </div>
              Study Groups
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {studyGroups.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '16px 0' }}>No active groups.</div>
              ) : (
                studyGroups.map((group, idx) => (
                  <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px', transition: 'background 0.2s ease', cursor: 'pointer' }} onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')} onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: idx === 0 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #475569, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)' }}>
                      <Lightbulb size={20} color="#FFF" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>{group.name}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>{group.memberCount} Active Members</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s ease' }} onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')} onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
              <Search size={16} /> Discover More
            </button>
          </div>

          {/* Suggestion Box */}
          <div style={{ background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', border: '1px solid #BAE6FD', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(14,165,233,0.05)' }}>
            <div style={{ width: '40px', height: '40px', background: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: '#0EA5E9' }}>
              <Lightbulb size={20} />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0369A1', margin: '0 0 8px 0' }}>Vidya AI Suggestion</h3>
            <p style={{ fontSize: '13px', color: '#0284C7', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
              Sharing your study notes can boost your karma score by <strong style={{ color: '#0C4A6E' }}>50 points</strong> this week!
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

