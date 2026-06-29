'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api.client';
import { MessageSquare, Heart, Plus, Users, Search, Lightbulb, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  useEffect(() => {
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
        setStudyGroups(groupsRes.data.data.slice(0, 3)); // Just show a few study groups
      } catch (err) {
        console.error('Error fetching community data:', err);
      } finally {
        setLoading(false);
      }
    };

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
    <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'var(--font-sans)', color: '#0F172A' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: 4 }}>Community Space</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Collaborate, share knowledge, and grow together.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => router.push('/dashboard/student/community/discussions?filter=mine')}
            style={{ padding: '10px 20px', borderRadius: 24, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            My Discussions
          </button>
          <button 
            onClick={() => router.push('/dashboard/student/community/discussions')}
            style={{ padding: '10px 20px', borderRadius: 24, border: 'none', background: '#0F172A', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} /> New Post
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Announcements Card */}
          <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-label="announcement">📢</span> Announcements
              </h2>
              <button style={{ background: 'none', border: 'none', color: '#D97706', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>View all</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {announcements.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No recent announcements</div>
              ) : (
                announcements.map((ann, idx) => (
                  <div key={ann.id} style={{ display: 'flex', background: '#F8FAFC', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ width: 4, background: idx === 0 ? '#D97706' : '#475569' }} />
                    <div style={{ padding: '16px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: idx === 0 ? '#D97706' : '#475569', letterSpacing: '0.05em' }}>
                          {ann.title?.toUpperCase() || 'GENERAL'}
                        </span>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{formatDistanceToNow(new Date(ann.createdAt), {addSuffix: true})}</span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{ann.content.split('\n')[0]}</h3>
                      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
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
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Recent Discussions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {discussions.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: '#FFFFFF', borderRadius: 24, color: '#94A3B8', fontSize: 14 }}>
                  No discussions found. Be the first to start one!
                </div>
              ) : (
                discussions.map(post => (
                  <div key={post.id} style={{ background: '#FFFFFF', borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E2E8F0', overflow: 'hidden' }}>
                        {post.author.avatar ? (
                          <img src={post.author.avatar} alt={post.author.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748B' }}>
                            {post.author.firstName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{post.author.firstName} {post.author.lastName}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          Mathematics Dept. • {formatDistanceToNow(new Date(post.createdAt), {addSuffix: true})}
                        </div>
                      </div>
                    </div>
                    
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: '#0F172A' }}>{post.title || post.content.split('\n')[0]}</h3>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
                      {post.title ? post.content : post.content.split('\n').slice(1).join(' ')}
                    </p>

                    {post.imageUrl && (
                      <div style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', height: 200 }}>
                        <img src={post.imageUrl} alt="Post Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', gap: 20 }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <MessageSquare size={16} /> {post.commentsCount} Replies
                        </button>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <Heart size={16} /> {post.likesCount} Likes
                        </button>
                      </div>
                      
                      {post.commentsCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                           {/* Decorative avatars for repliers */}
                           <div style={{ display: 'flex' }}>
                             {[1,2,3].slice(0, Math.min(3, post.commentsCount)).map(i => (
                               <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: '#CBD5E1', border: '2px solid #FFF', marginLeft: i > 1 ? -8 : 0, zIndex: 4-i }} />
                             ))}
                           </div>
                           {post.commentsCount > 3 && (
                             <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8, fontWeight: 600 }}>+{post.commentsCount - 3}</span>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Top Contributors */}
          <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={20} color="#D97706" /> Top Contributors
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              {topContributors.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No contributors yet.</div>
              ) : (
                topContributors.map((user, idx) => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E2E8F0', overflow: 'hidden' }}>
                           {user.avatar ? (
                             <img src={user.avatar} alt={user.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : (
                             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748B' }}>
                               {user.firstName[0]}
                             </div>
                           )}
                        </div>
                        <div style={{ position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : '#B45309', color: '#FFF', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF' }}>
                          {idx + 1}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{user.firstName} {user.lastName}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{user.karma} Karma • {user.subject}</div>
                      </div>
                    </div>
                    {idx === 0 && <span style={{ color: '#F59E0B' }}>↗</span>}
                  </div>
                ))
              )}
            </div>

            <button style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#F1F5F9', border: 'none', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              See Full Leaderboard
            </button>
          </div>

          {/* Study Groups */}
          <div style={{ background: '#1E1E1E', borderRadius: 24, padding: 24, color: '#FFFFFF' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="#F97316" /> Study Groups
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {studyGroups.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No active groups.</div>
              ) : (
                studyGroups.map((group, idx) => (
                  <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: idx === 0 ? 'linear-gradient(135deg, #4B5563, #1F2937)' : 'linear-gradient(135deg, #475569, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lightbulb size={20} color="#FFF" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{group.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{group.memberCount} Active Members</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Search size={16} /> Discover More
            </button>
          </div>

          {/* Suggestion Box */}
          <div style={{ border: '2px dashed #E2E8F0', borderRadius: 24, padding: 24, textAlign: 'center', background: '#F8FAFC' }}>
            <div style={{ width: 40, height: 40, background: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Lightbulb size={20} color="#D97706" />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#475569', marginBottom: 8 }}>Vidya AI Suggestion</h3>
            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
              Sharing your resource lists can boost your karma score by 50 points this week!
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
