'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Edit2,
  Sparkles,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface MessageProps {
  children: React.ReactNode;
  from: 'user' | 'assistant';
  className?: string;
}

export function Message({
  children,
  from,
  className = '',
}: MessageProps) {
  const isUser = from === 'user';

  return (
    <div
      className={`flex w-full gap-3 ${
        isUser ? 'justify-end' : 'justify-start'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export interface MessageAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  isAssistant?: boolean;
  className?: string;
}

export function MessageAvatar({
  src,
  alt = '',
  fallback,
  isAssistant = false,
  className = '',
}: MessageAvatarProps) {
  return (
    <div
      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-2xs border ${
        isAssistant
          ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-orange-400/40'
          : 'bg-neutral-100 text-neutral-800 border-neutral-200'
      } ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full rounded-xl object-cover" />
      ) : isAssistant ? (
        <Sparkles className="w-4 h-4" />
      ) : (
        fallback || <User className="w-4 h-4" />
      )}
    </div>
  );
}

export function MessageStack({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] ${className}`}>
      {children}
    </div>
  );
}

export interface MessageContentProps {
  children: React.ReactNode;
  from?: 'user' | 'assistant';
  className?: string;
}

export function MessageContent({
  children,
  from,
  className = '',
}: MessageContentProps) {
  const isUser = from === 'user';

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
        isUser
          ? 'bg-[#e05934] text-white rounded-br-xs'
          : 'bg-white text-neutral-900 border border-neutral-200/80 rounded-bl-xs'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function MessageMarkdown({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (typeof children !== 'string') {
    return <div className={`space-y-2 ${className}`}>{children}</div>;
  }

  // Basic formatting for code blocks, bold, line breaks
  return (
    <div
      className={`font-sans whitespace-pre-wrap leading-relaxed space-y-2 ${className}`}
    >
      {children}
    </div>
  );
}

export function MessageActions({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 mt-0.5 px-1 ${className}`}>
      {children}
    </div>
  );
}

export function MessageActionGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center gap-0.5 ${className}`}>{children}</div>;
}

export interface MessageActionProps {
  children?: React.ReactNode;
  tooltip?: string | { content: string; shortcut?: string; side?: string };
  onClick?: () => void;
  icon?: 'copy' | 'like' | 'dislike' | 'regenerate' | 'edit';
  className?: string;
  active?: boolean;
}

export function MessageAction({
  children,
  tooltip,
  onClick,
  icon,
  className = '',
  active = false,
}: MessageActionProps) {
  const [copied, setCopied] = useState(false);

  const title =
    typeof tooltip === 'object' && tooltip !== null
      ? `${tooltip.content}${tooltip.shortcut ? ` (${tooltip.shortcut})` : ''}`
      : tooltip || '';

  const handleClick = () => {
    if (icon === 'copy') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    }
    onClick?.();
  };

  const renderIcon = () => {
    if (icon === 'copy') {
      return copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      );
    }
    if (icon === 'like') return <ThumbsUp className="w-3.5 h-3.5" />;
    if (icon === 'dislike') return <ThumbsDown className="w-3.5 h-3.5" />;
    if (icon === 'regenerate') return <RotateCcw className="w-3.5 h-3.5" />;
    if (icon === 'edit') return <Edit2 className="w-3.5 h-3.5" />;
    return children;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={`p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer active:scale-95 ${
        active ? 'text-[#e05934] bg-orange-50' : ''
      } ${className}`}
    >
      {renderIcon()}
    </button>
  );
}
