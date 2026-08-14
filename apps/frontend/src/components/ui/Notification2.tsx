'use client';

import React, { useState, useEffect } from 'react';
import {
  RiBellFill,
  RiCheckDoubleFill,
  RiCircleFill,
} from 'react-icons/ri';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  RealNotificationItem,
} from '@/services/notification.service';

export type UpdateType = 'pull_request' | 'alert' | 'team' | 'deploy' | 'doc' | 'assignment' | 'assessment';
export type UpdatePriority = 'urgent' | 'normal' | 'low';
export type UpdateTab = 'all' | 'unread' | 'mentions';

export interface UpdateAuthor {
  name: string;
  initials: string;
  avatar?: string;
}

export interface TeamUpdate {
  id: string;
  type: UpdateType;
  priority: UpdatePriority;
  author: UpdateAuthor;
  project: string;
  message: string;
  detail?: string;
  timestamp: string;
  isUnread: boolean;
  isMention: boolean;
}

export interface Notification2Props {
  heading?: string;
  updates?: TeamUpdate[];
  className?: string;
  onMarkAllRead?: () => void;
}

const TypeLabelMap: Record<string, string> = {
  pull_request: 'Assignment',
  alert: 'Urgent',
  team: 'Academic',
  deploy: 'System',
  doc: 'Resources',
  assignment: 'Assignment',
  assessment: 'Evaluation',
};

// High contrast priority badges on white background
const PriorityBadgeMap: Record<UpdatePriority, string> = {
  urgent: 'bg-red-50 text-red-700 border border-red-200',
  normal: 'bg-orange-50 text-orange-800 border border-orange-200',
  low: 'bg-slate-100 text-slate-700 border border-slate-200',
};

// Real VidyaAI Academic System Notifications
export const defaultUpdates: TeamUpdate[] = [
  {
    id: '1',
    type: 'alert',
    priority: 'urgent',
    author: {
      name: 'System Monitor',
      initials: 'SM',
    },
    project: 'Academic Portal',
    message: 'Attendance submission pending for Computer Networks (Section A)',
    detail: 'Today\'s lecture attendance must be submitted by 5:00 PM for accreditation sync.',
    timestamp: '5m ago',
    isUnread: true,
    isMention: false,
  },
  {
    id: '2',
    type: 'assignment',
    priority: 'normal',
    author: {
      name: 'Dr. Arul Thalan',
      initials: 'AT',
    },
    project: 'Question Bank',
    message: 'Generated Mid-Term Assessment Paper for Data Structures',
    timestamp: '25m ago',
    isUnread: true,
    isMention: true,
  },
  {
    id: '3',
    type: 'doc',
    priority: 'normal',
    author: {
      name: 'Library Admin',
      initials: 'LA',
    },
    project: 'Resource Center',
    message: 'New textbook PDF indexed & embedded into RAG Knowledge Base',
    detail: '1,240 document chunks processed with PGVector hybrid search GIN index.',
    timestamp: '1h ago',
    isUnread: true,
    isMention: false,
  },
  {
    id: '4',
    type: 'team',
    priority: 'low',
    author: {
      name: 'Priya Sharma',
      initials: 'PS',
    },
    project: 'Course Committee',
    message: 'Approved CO-PO Outcome Mapping weightages for Semester 4',
    timestamp: '3h ago',
    isUnread: false,
    isMention: false,
  },
  {
    id: '5',
    type: 'deploy',
    priority: 'low',
    author: {
      name: 'VidyaAI Platform',
      initials: 'VA',
    },
    project: 'Platform Update',
    message: 'AI Tutor & Automated Grader v2.4 successfully updated',
    timestamp: 'Yesterday',
    isUnread: false,
    isMention: true,
  },
];

// Helper Avatar component with dark text fallback on solid white background
function SimpleAvatar({ author }: { author: UpdateAuthor }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-slate-100 items-center justify-center text-slate-800 font-bold">
      {author.avatar && !hasError ? (
        <img
          src={author.avatar}
          alt={author.name}
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-xs font-extrabold text-slate-800">
          {author.initials}
        </span>
      )}
    </div>
  );
}

export function Notification2({
  heading = 'Notifications',
  updates = defaultUpdates,
  className,
  onMarkAllRead,
}: Notification2Props) {
  const [items, setItems] = useState<TeamUpdate[]>(updates);
  const [activeTab, setActiveTab] = useState<UpdateTab>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real notifications from backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadRealNotifications() {
      setIsLoading(true);
      try {
        const realNotifs: RealNotificationItem[] = await fetchNotifications();
        if (isMounted && Array.isArray(realNotifs)) {
          const mapped: TeamUpdate[] = realNotifs.map((n, idx) => ({
            id: n.id || String(idx + 1),
            type: (n.type as UpdateType) || 'alert',
            priority: n.isRead ? 'low' : 'normal',
            author: {
              name: n.title || 'VidyaAI System',
              initials: (n.title || 'VidyaAI').substring(0, 2).toUpperCase(),
            },
            project: n.metadata?.project || 'VidyaAI Portal',
            message: n.message,
            timestamp: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            isUnread: !n.isRead,
            isMention: false,
          }));
          setItems(mapped);
        }
      } catch (err) {
        // Fallback handled inside notification.service.ts
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRealNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((u) => ({ ...u, isUnread: false })));
    await markAllNotificationsAsRead();
    if (onMarkAllRead) onMarkAllRead();
  };

  const handleItemClick = async (id: string) => {
    setItems((prev) => prev.map((u) => (u.id === id ? { ...u, isUnread: false } : u)));
    await markNotificationAsRead(id);
  };

  const unreadCount = items.filter((u) => u.isUnread).length;
  const mentionCount = items.filter((u) => u.isMention).length;

  const filteredUpdates = items.filter((u) => {
    if (activeTab === 'unread') return u.isUnread;
    if (activeTab === 'mentions') return u.isMention;
    return true;
  });

  return (
    <section className={cn('bg-white text-slate-900 rounded-2xl shadow-2xl flex items-center justify-center p-0.5 border border-slate-200', className)}>
      <Card className="w-full max-w-sm gap-1 overflow-hidden rounded-2xl p-2 bg-white text-slate-900 border-none shadow-none">
        <CardHeader className="p-2 pb-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-600 flex h-9 w-9 items-center justify-center rounded-xl font-bold">
                <RiBellFill className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-slate-900 text-base font-extrabold tracking-tight">
                  {heading}
                </h2>
                <p className="text-slate-500 text-xs font-semibold">
                  {unreadCount} unread · {items.length} total
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 gap-1 rounded-lg text-xs font-bold h-8 px-2.5"
              >
                <RiCheckDoubleFill className="h-4 w-4" />
                Mark all read
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="w-full bg-white">
          <div className="px-2 mb-3">
            <div className="bg-slate-100 flex h-9 items-center gap-1 rounded-full p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-full px-3 py-1 text-xs transition-all',
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 font-extrabold shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                )}
              >
                All
                <span className="ml-1 rounded-full bg-slate-200 text-slate-800 px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
                  {items.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-full px-3 py-1 text-xs transition-all',
                  activeTab === 'unread'
                    ? 'bg-white text-slate-900 font-extrabold shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                )}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-orange-500 text-white px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mentions')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-full px-3 py-1 text-xs transition-all',
                  activeTab === 'mentions'
                    ? 'bg-white text-slate-900 font-extrabold shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                )}
              >
                Mentions
                {mentionCount > 0 && (
                  <span className="ml-1 rounded-full bg-slate-200 text-slate-800 px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
                    {mentionCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <CardContent className="p-0 bg-white">
            <div className="max-h-[340px] overflow-y-auto w-full pr-0.5 divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <div className="p-6 text-center text-slate-500 text-xs font-semibold">
                  Loading notifications...
                </div>
              ) : (
                <UpdateList updates={filteredUpdates} onItemClick={handleItemClick} />
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </section>
  );
}

function UpdateList({ updates, onItemClick }: { updates: TeamUpdate[]; onItemClick: (id: string) => void }) {
  if (updates.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-2 p-4 text-center bg-white">
        <div className="bg-slate-100 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">
          <RiBellFill className="text-slate-400 h-5 w-5" />
        </div>
        <p className="text-slate-600 text-xs font-bold">
          No notifications found
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 bg-white">
      {updates.map((update) => (
        <UpdateRow key={update.id} update={update} onClick={() => onItemClick(update.id)} />
      ))}
    </div>
  );
}

function UpdateRow({ update, onClick }: { update: TeamUpdate; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex gap-3 px-4 py-3.5 transition-colors duration-150 cursor-pointer bg-white',
        update.isUnread ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-slate-50',
      )}
    >
      <div className="relative flex-shrink-0 pt-0.5">
        <SimpleAvatar author={update.author} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-slate-900 truncate text-xs font-extrabold">
              {update.author.name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'h-4 shrink-0 rounded-full px-1.5 text-[9px] font-bold',
                PriorityBadgeMap[update.priority],
              )}
            >
              {TypeLabelMap[update.type] || update.type}
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-slate-500 text-[10px] font-bold tabular-nums">
              {update.timestamp}
            </span>
            {update.isUnread && (
              <RiCircleFill className="text-orange-500 h-2.5 w-2.5 animate-pulse" />
            )}
          </div>
        </div>

        <span className="text-slate-600 text-[11px] font-bold">
          {update.project}
        </span>

        <p className="text-slate-800 mt-0.5 text-xs leading-snug font-medium">
          {update.message}
        </p>
        {update.detail && (
          <div className="border border-slate-200 bg-slate-50 group-hover:bg-slate-100 mt-1.5 rounded-lg p-2 transition-colors">
            <p className="text-slate-700 text-[11px] leading-relaxed font-normal">
              {update.detail}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notification2;
