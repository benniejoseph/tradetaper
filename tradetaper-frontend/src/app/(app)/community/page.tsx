"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { communityService } from '@/services/communityService';
import {
  CommunityPost,
  CommunityPerson,
  CommunitySettings,
  LeaderboardEntry,
  CommunityReply,
} from '@/types/community';
import { AssetType } from '@/types/trade';
import { Timeframe } from '@/types/enums';
import { strategiesService } from '@/services/strategiesService';
import { Strategy } from '@/types/strategy';
import ReactMarkdown from 'react-markdown';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Modal from '@/components/ui/Modal';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Sparkles,
  Trophy,
  Users,
  Send,
  Smile,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

const ACCOUNT_BANDS = [
  { key: '', label: 'All Sizes' },
  { key: 'micro', label: '<$5k' },
  { key: 'small', label: '$5k-$25k' },
  { key: 'growth', label: '$25k-$50k' },
  { key: 'mid', label: '$50k-$100k' },
  { key: 'large', label: '$100k-$250k' },
  { key: 'pro', label: '$250k-$500k' },
  { key: 'institutional', label: '$500k+' },
];

const POST_TYPE_META: Record<string, { label: string; tone: string }> = {
  idea: {
    label: 'Trade Idea',
    tone: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  },
  reflection: {
    label: 'Post-Trade Reflection',
    tone: 'bg-teal-500/10 text-teal-700 border-teal-200',
  },
  rule_breakdown: {
    label: 'Rule Breakdown',
    tone: 'bg-amber-500/10 text-amber-700 border-amber-200',
  },
  chart: {
    label: 'Chart Snapshot',
    tone: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  },
};

const EMOJI_OPTIONS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃',
  '😉', '😍', '😘', '😗', '😙', '😚', '😋', '😜', '🤪', '😎', '🤓', '🧐',
  '😤', '😡', '😱', '🤯', '😴', '🤠', '🥳', '🤝', '👏', '🙌', '🙏', '💪',
  '🧠', '🫶', '💥', '🔥', '⚡', '💡', '✅', '❌', '🎯', '🏆', '📌', '🧭',
  '📈', '📉', '📊', '💹', '💰', '💵', '💸', '🪙', '🏦', '🧮', '🧪', '📝',
  '✍️', '📓', '📒', '📕', '📗', '📘', '📙', '📚', '🗂️', '🗒️', '🔍', '🔔',
  '📣', '🎧', '🎙️', '🎥', '🖥️', '📱', '⌨️', '🖱️', '🧰', '🛠️', '⚙️', '🧩',
  '🌍', '🌎', '🌏', '🛰️', '☀️', '🌤️', '⛅', '🌙', '⭐', '✨', '🌊', '🌲',
  '🍀', '🌻', '🍎', '☕', '🍵', '🍪', '🎮', '🎲', '🎨', '🧿', '🎵', '🚀',
  '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💞', '💫', '💬',
  '😐', '😶', '😬', '😮', '😯', '😢', '😭', '🥹', '😌', '🤔', '🤗', '😇',
  '😷', '🤒', '🤕', '🥶', '🥵', '🤢', '🤮', '😵‍💫',
  '🧱', '🧲', '🧯', '🛡️', '🪄', '🔒', '🔓', '🔑', '🗝️', '📍', '🗓️',
  '⏱️', '⏰', '🕒', '📎', '🧷', '🧾', '🗳️', '🧫',
];

const COMMUNITY_GUIDELINES = [
  'Focus on process: share the setup, rule followed, and risk decisions.',
  'Keep it constructive: critique ideas, not people.',
  'Respect privacy: never post personal data or account credentials.',
  'No hype or signals-only posts. Explain the thinking.',
  'Tag responsibly: mention people only when relevant.',
  'Chart images should be your own work or properly credited.',
];

type TabKey = 'feed' | 'leaderboard' | 'people';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-600 hover:text-emerald-500 underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-200">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-200">{children}</ol>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-emerald-400 pl-3 italic text-sm text-gray-600 dark:text-gray-300">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
    inline ? (
      <code className="px-1 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-200">
        {children}
      </code>
    ) : (
      <pre className="rounded-xl bg-gray-900 text-gray-100 text-xs p-3 overflow-x-auto">
        <code>{children}</code>
      </pre>
    ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img
      src={src || ''}
      alt={alt || 'community image'}
      className="w-full max-h-80 object-cover rounded-2xl border border-gray-200/60 dark:border-zinc-800"
      loading="lazy"
    />
  ),
};

export default function CommunityPage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<TabKey>('feed');

  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [settings, setSettings] = useState<CommunitySettings | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionAnchor, setMentionAnchor] = useState<number | null>(null);
  const [mentionResults, setMentionResults] = useState<
    { id: string; username: string; displayName: string }[]
  >([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const debouncedMention = useDebounce(mentionQuery, 250);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [repliesByPost, setRepliesByPost] = useState<Record<string, CommunityReply[]>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});
  const [replyPosting, setReplyPosting] = useState<Record<string, boolean>>({});

  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [filters, setFilters] = useState({
    accountSize: '',
    assetType: '',
    timeframe: '',
    strategyId: '',
    period: '3m',
  });

  const [newPost, setNewPost] = useState({
    type: 'idea',
    title: '',
    content: '',
    symbol: '',
    tags: '',
    assetType: '',
    timeframe: '',
    imageUrl: '',
  });

  const canPost = isAuthenticated && settings?.publicProfile;

  const assetTypeOptions = useMemo(() => Object.values(AssetType), []);
  const timeframeOptions = useMemo(() => Object.values(Timeframe), []);

  useEffect(() => {
    if (!isAuthenticated) return;
    communityService
      .getSettings()
      .then(setSettings)
      .catch(() => setSettings(null));

    communityService
      .getFollowing()
      .then((response) => {
        const nextMap: Record<string, boolean> = {};
        response.items.forEach((id) => {
          nextMap[id] = true;
        });
        setFollowing(nextMap);
      })
      .catch(() => setFollowing({}));

    strategiesService
      .getStrategies()
      .then(setStrategies)
      .catch(() => setStrategies([]));
  }, [isAuthenticated]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const response = await communityService.getFeed();
      setFeed(response.items);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await communityService.getLeaderboard({
        period: filters.period,
        accountSize: filters.accountSize || undefined,
        assetType: filters.assetType || undefined,
        timeframe: filters.timeframe || undefined,
        strategyId: filters.strategyId || undefined,
      });
      setLeaderboard(response.items);
    } finally {
      setLoading(false);
    }
  };

  const loadPeople = async () => {
    setLoading(true);
    try {
      const response = await communityService.getPeople({
        accountSize: filters.accountSize || undefined,
        assetType: filters.assetType || undefined,
        timeframe: filters.timeframe || undefined,
        strategyId: filters.strategyId || undefined,
      });
      setPeople(response.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed') loadFeed();
    if (activeTab === 'leaderboard') loadLeaderboard();
    if (activeTab === 'people') loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'leaderboard') loadLeaderboard();
    if (activeTab === 'people') loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.accountSize, filters.assetType, filters.timeframe, filters.strategyId, filters.period]);

  useEffect(() => {
    if (!canPost) return;
    if (!debouncedMention || debouncedMention.length < 2) {
      setMentionResults([]);
      return;
    }
    setMentionLoading(true);
    communityService
      .searchUsers(debouncedMention)
      .then((response) => setMentionResults(response.items || []))
      .catch(() => setMentionResults([]))
      .finally(() => setMentionLoading(false));
  }, [debouncedMention, canPost]);

  const insertAtCursor = (text: string) => {
    if (!canPost) return;
    const el = contentRef.current;
    setNewPost((prev) => {
      const value = el?.value ?? prev.content;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? value.length;
      const next = value.slice(0, start) + text + value.slice(end);
      requestAnimationFrame(() => {
        if (el) {
          const cursor = start + text.length;
          el.focus();
          el.selectionStart = cursor;
          el.selectionEnd = cursor;
        }
      });
      return { ...prev, content: next };
    });
    setMentionQuery('');
    setMentionResults([]);
    setMentionAnchor(null);
  };

  const wrapSelection = (prefix: string, suffix = prefix) => {
    if (!canPost) return;
    const el = contentRef.current;
    const value = el?.value ?? newPost.content;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || 'text';
    const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    setNewPost((prev) => ({ ...prev, content: next }));
    requestAnimationFrame(() => {
      if (el) {
        const cursor = start + prefix.length + selected.length + suffix.length;
        el.focus();
        el.selectionStart = cursor;
        el.selectionEnd = cursor;
      }
    });
    setMentionQuery('');
    setMentionResults([]);
    setMentionAnchor(null);
  };

  const updateMentionState = (value: string, cursor: number | null) => {
    if (cursor === null) {
      setMentionQuery('');
      setMentionAnchor(null);
      return;
    }
    const prefix = value.slice(0, cursor);
    const match = prefix.match(/(^|\\s)@([a-z0-9_]{1,20})$/i);
    if (match) {
      setMentionQuery(match[2]);
      setMentionAnchor(prefix.lastIndexOf('@'));
      if (match[2].length < 2) {
        setMentionResults([]);
      }
    } else {
      setMentionQuery('');
      setMentionAnchor(null);
    }
  };

  const handleContentChange = (value: string, cursor: number | null) => {
    setNewPost((prev) => ({ ...prev, content: value }));
    updateMentionState(value, cursor);
  };

  const insertMention = (username: string) => {
    const el = contentRef.current;
    const value = el?.value ?? newPost.content;
    const cursor = el?.selectionStart ?? value.length;
    const anchor = mentionAnchor ?? value.lastIndexOf('@');
    if (anchor < 0) return;
    const next = `${value.slice(0, anchor)}@${username} ${value.slice(cursor)}`;
    setNewPost((prev) => ({ ...prev, content: next }));
    setMentionQuery('');
    setMentionResults([]);
    setMentionAnchor(null);
    requestAnimationFrame(() => {
      if (el) {
        const newCursor = anchor + username.length + 2;
        el.focus();
        el.selectionStart = newCursor;
        el.selectionEnd = newCursor;
      }
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!canPost) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setImageError('Please upload PNG, JPG, GIF, or WEBP images.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image is too large (max 5MB).');
      return;
    }
    setImageError(null);
    setImageUploading(true);
    try {
      const result = await communityService.uploadImage(file);
      setNewPost((prev) => ({
        ...prev,
        imageUrl: prev.imageUrl || result.url,
      }));
    } catch (error: any) {
      setImageError(error?.response?.data?.message || 'Upload failed.');
    } finally {
      setImageUploading(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!canPost || !newPost.content.trim()) return;
    await communityService.createPost({
      type: newPost.type,
      title: newPost.title || undefined,
      content: newPost.content,
      symbol: newPost.symbol || undefined,
      tags: newPost.tags
        ? newPost.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : undefined,
      assetType: newPost.assetType || undefined,
      timeframe: newPost.timeframe || undefined,
      imageUrl: newPost.imageUrl || undefined,
    });
    setNewPost({
      type: 'idea',
      title: '',
      content: '',
      symbol: '',
      tags: '',
      assetType: '',
      timeframe: '',
      imageUrl: '',
    });
    setPreview(false);
    setEmojiOpen(false);
    setImageError(null);
    setMentionQuery('');
    setMentionResults([]);
    setMentionAnchor(null);
    setShowPostModal(false);
    loadFeed();
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setEmojiOpen(false);
    setPreview(false);
    setMentionQuery('');
    setMentionResults([]);
    setMentionAnchor(null);
    setImageError(null);
  };

  const toggleFollow = async (userId: string) => {
    if (!isAuthenticated) return;
    const isFollowing = !!following[userId];
    if (isFollowing) {
      await communityService.unfollow(userId);
    } else {
      await communityService.follow(userId);
    }
    setFollowing((prev) => ({ ...prev, [userId]: !isFollowing }));
  };

  const loadReplies = async (postId: string) => {
    setReplyLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const response = await communityService.getReplies(postId);
      setRepliesByPost((prev) => ({ ...prev, [postId]: response.items || [] }));
    } finally {
      setReplyLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const toggleReplies = async (postId: string) => {
    const isOpen = !!openReplies[postId];
    setOpenReplies((prev) => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !repliesByPost[postId]) {
      await loadReplies(postId);
    }
  };

  const handleReplySubmit = async (postId: string) => {
    const draft = replyDrafts[postId]?.trim();
    if (!draft) return;
    setReplyPosting((prev) => ({ ...prev, [postId]: true }));
    try {
      const created = await communityService.createReply(postId, { content: draft });
      setRepliesByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }));
      setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
      setFeed((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, replyCount: (post.replyCount || 0) + 1 }
            : post,
        ),
      );
    } finally {
      setReplyPosting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
  const selectClass = inputClass;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_55%)]" />
      <div className="w-full max-w-none mx-auto space-y-6 px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100/60 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-emerald-900/20 p-6 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_55%)]" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr,0.85fr] items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/80 dark:bg-zinc-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Discipline-first network
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Public read-only • Members-only actions</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                  Community
                </h1>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                  Share disciplined trade execution, learn from peer performance, and benchmark your consistency with traders
                  who care about process over hype.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-emerald-200/70 bg-white/80 dark:bg-zinc-900/60 px-4 py-3 shadow-sm">
                  <p className="text-[11px] uppercase text-emerald-600 dark:text-emerald-300 font-semibold tracking-widest">Focus</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Consistency • Risk • Discipline</p>
                </div>
                <div className="rounded-2xl border border-emerald-200/70 bg-white/80 dark:bg-zinc-900/60 px-4 py-3 shadow-sm">
                  <p className="text-[11px] uppercase text-emerald-600 dark:text-emerald-300 font-semibold tracking-widest">Culture</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Constructive • Data-backed • Calm</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowGuidelinesModal(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/80 dark:bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                >
                  <BookOpen className="h-4 w-4" />
                  Guidelines
                </button>
                <button
                  onClick={() => setShowPostModal(true)}
                  disabled={!canPost}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Post
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 bg-white/80 dark:bg-zinc-950/60 p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300 font-semibold">Community pulse</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Today</span>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-emerald-100/80 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/20 px-4 py-3">
                    <p className="text-[11px] uppercase text-emerald-600 dark:text-emerald-300 font-semibold tracking-widest">Focus</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Consistency, Risk, Discipline</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100/80 dark:border-emerald-900/40 bg-white/70 dark:bg-zinc-900/50 px-4 py-3">
                    <p className="text-[11px] uppercase text-emerald-600 dark:text-emerald-300 font-semibold tracking-widest">Culture</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Constructive, data-backed, calm</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="rounded-2xl border border-gray-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 px-3 py-2">
                    <p className="text-[11px] uppercase text-gray-400">Visibility</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Public</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 px-3 py-2">
                    <p className="text-[11px] uppercase text-gray-400">Participation</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Members-only</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <AnimatedCard animate={false} variant="default" className="border-emerald-100/50 bg-white/80 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Community is public read-only. Sign in to post, follow, or appear on leaderboards.
            </p>
          </AnimatedCard>
        )}

        <div className="flex flex-wrap gap-2">
          {([
            { key: 'feed', label: 'Feed', icon: Send },
            { key: 'leaderboard', label: 'Leaderboards', icon: Trophy },
            { key: 'people', label: 'People', icon: Users },
          ] as { key: TabKey; label: string; icon: React.ElementType }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white/80 dark:bg-zinc-900/70 text-gray-600 dark:text-gray-300 border border-gray-200/70 dark:border-zinc-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'feed' && (
          <div className="space-y-4">
            {loading && <p className="text-sm text-gray-500">Loading feed...</p>}
            {!loading && feed.length === 0 && (
              <p className="text-sm text-gray-500">No community posts yet.</p>
            )}

            {feed.map((post) => {
              const meta = POST_TYPE_META[post.type] || POST_TYPE_META.idea;
              const initials = post.user.displayName?.charAt(0)?.toUpperCase() || 'T';
              const showCover = post.imageUrl && !post.content.includes(post.imageUrl);
              const isRepliesOpen = !!openReplies[post.id];
              const replies = repliesByPost[post.id] || [];

              return (
                <div
                  key={post.id}
                  className="rounded-3xl border border-gray-200/70 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {post.user.displayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {post.user.username ? `@${post.user.username}` : 'Trader'} | {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full border ${meta.tone}`}>
                      {meta.label}
                    </span>
                  </div>

                  {post.title && (
                    <div className="text-base font-semibold text-gray-900 dark:text-white">{post.title}</div>
                  )}

                  <ReactMarkdown components={markdownComponents}>{post.content}</ReactMarkdown>

                  {showCover && post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title || 'Trade idea'}
                      className="w-full max-h-80 object-cover rounded-2xl border border-gray-200/60 dark:border-zinc-800"
                      loading="lazy"
                    />
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {post.symbol && (
                      <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700">#{post.symbol}</span>
                    )}
                    {post.tags?.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300">
                        #{tag}
                      </span>
                    ))}
                    {post.assetType && (
                      <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">{post.assetType}</span>
                    )}
                    {post.timeframe && (
                      <span className="px-2 py-1 rounded-full bg-teal-500/10 text-teal-600">{post.timeframe}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <button
                      onClick={() => toggleReplies(post.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200/70 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.replyCount ? `${post.replyCount} replies` : 'Reply'}
                    </button>
                  </div>

                  {isRepliesOpen && (
                    <div className="space-y-3 border-t border-gray-100 dark:border-zinc-800 pt-4">
                      {replyLoading[post.id] && (
                        <p className="text-xs text-gray-500">Loading replies...</p>
                      )}
                      {!replyLoading[post.id] && replies.length === 0 && (
                        <p className="text-xs text-gray-500">No replies yet. Start the conversation.</p>
                      )}

                      <div className="space-y-3">
                        {replies.map((reply) => (
                          <div key={reply.id} className="rounded-2xl bg-gray-50 dark:bg-zinc-900/70 p-3">
                            <div className="text-xs text-gray-500 mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {reply.user?.displayName || 'Trader'}
                              </span>{' '}
                              <span>{reply.user?.username ? `@${reply.user.username}` : ''}</span> | {formatDate(reply.createdAt)}
                            </div>
                            <ReactMarkdown components={markdownComponents}>{reply.content}</ReactMarkdown>
                          </div>
                        ))}
                      </div>

                      {isAuthenticated && (
                        <div className="space-y-2">
                          <textarea
                            value={replyDrafts[post.id] || ''}
                            onChange={(event) =>
                              setReplyDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))
                            }
                            placeholder="Write a reply and tag others with @username..."
                            className="min-h-[80px] w-full rounded-2xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleReplySubmit(post.id)}
                              disabled={!replyDrafts[post.id]?.trim() || replyPosting[post.id]}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(activeTab === 'leaderboard' || activeTab === 'people') && (
          <div className="rounded-3xl border border-gray-200/70 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 p-5 shadow-sm space-y-4">
            <div className="grid md:grid-cols-4 gap-3">
              <select
                value={filters.accountSize}
                onChange={(e) => setFilters({ ...filters, accountSize: e.target.value })}
                className={selectClass}
              >
                {ACCOUNT_BANDS.map((band) => (
                  <option key={band.key} value={band.key}>
                    {band.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.assetType}
                onChange={(e) => setFilters({ ...filters, assetType: e.target.value })}
                className={selectClass}
              >
                <option value="">All Assets</option>
                {assetTypeOptions.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
              <select
                value={filters.timeframe}
                onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
                className={selectClass}
              >
                <option value="">All Timeframes</option>
                {timeframeOptions.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
              <select
                value={filters.strategyId}
                onChange={(e) => setFilters({ ...filters, strategyId: e.target.value })}
                className={selectClass}
                disabled={!isAuthenticated}
              >
                <option value="">All Strategies</option>
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'leaderboard' && (
              <select
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                className={selectClass}
              >
                <option value="1m">1M</option>
                <option value="3m">3M</option>
                <option value="1y">1Y</option>
                <option value="all">All</option>
              </select>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {loading && <p className="text-sm text-gray-500">Loading leaderboards...</p>}
            {!loading && leaderboard.length === 0 && (
              <p className="text-sm text-gray-500">No eligible traders in this cohort yet.</p>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className="rounded-3xl border border-gray-200/70 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
                        #{entry.rank}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{entry.displayName}</div>
                        <div className="text-xs text-gray-500">
                          {entry.username ? `@${entry.username}` : 'Trader'} | {entry.accountSizeBand?.label || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase text-gray-400">Score</div>
                      <div className="text-2xl font-black text-emerald-600">{entry.score.toFixed(0)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                    <div>
                      <div className="text-gray-400">Return</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{entry.returnPct.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Drawdown</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{entry.drawdownPct.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Trades</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{entry.tradeCount}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700">
                      {entry.confidence} confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="grid lg:grid-cols-2 gap-4">
            {loading && <p className="text-sm text-gray-500">Loading traders...</p>}
            {!loading && people.length === 0 && (
              <p className="text-sm text-gray-500">No public profiles available yet.</p>
            )}
            {people.map((person) => (
              <div
                key={person.userId}
                className="rounded-3xl border border-gray-200/70 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{person.displayName}</div>
                    <div className="text-xs text-gray-500">
                      {person.username ? `@${person.username}` : 'Trader'} | {person.accountSizeBand?.label || '-'}
                    </div>
                  </div>
                  {isAuthenticated && user?.id !== person.userId && (
                    <button
                      onClick={() => toggleFollow(person.userId)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        following[person.userId]
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {following[person.userId] ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                  <div>
                    <div className="text-gray-400">Return</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {person.metricsHidden ? 'Private' : `${person.returnPct.toFixed(1)}%`}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Drawdown</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {person.metricsHidden ? 'Private' : `${person.drawdownPct.toFixed(1)}%`}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Score</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {person.metricsHidden ? 'Private' : person.score.toFixed(0)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{person.confidence} confidence</div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={showPostModal}
          onClose={closePostModal}
          title="Create a Post"
          description="Share insights, charts, and disciplined reflections."
          size="xl"
        >
          <div className="space-y-4">
            {!canPost && (
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/70 p-3 text-xs text-amber-700">
                Enable your public profile to post in Community.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={newPost.type}
                onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
                className={selectClass}
                disabled={!canPost}
              >
                <option value="idea">Trade Idea</option>
                <option value="reflection">Post-Trade Reflection</option>
                <option value="rule_breakdown">Rule Breakdown</option>
                <option value="chart">Chart Snapshot</option>
              </select>
              <input
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Title (optional)"
                className={inputClass}
                disabled={!canPost}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => wrapSelection('**')}
                disabled={!canPost}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => wrapSelection('*')}
                disabled={!canPost}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertAtCursor('\n- List item')}
                disabled={!canPost}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertAtCursor('\n1. List item')}
                disabled={!canPost}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertAtCursor('\n> ')}
                disabled={!canPost}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => wrapSelection('`')}
                disabled={!canPost}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <Code className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertAtCursor('[text](https://)')}
                disabled={!canPost}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setEmojiOpen((prev) => !prev)}
                disabled={!canPost}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!canPost || imageUploading}
                className="rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 disabled:opacity-50"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPreview((prev) => !prev)}
                disabled={!canPost}
                className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-700"
              >
                {preview ? 'Hide Preview' : 'Preview'}
              </button>
            </div>

            {emojiOpen && (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200/70 bg-white/90 p-3">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      insertAtCursor(emoji);
                      setEmojiOpen(false);
                    }}
                    className="text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div className={`grid gap-3 ${preview ? 'lg:grid-cols-2' : ''}`}>
              <div className="space-y-2">
                <textarea
                  ref={contentRef}
                  value={newPost.content}
                  onChange={(event) => handleContentChange(event.target.value, event.target.selectionStart)}
                  placeholder="Share the setup, the rule you followed, or the lesson learned..."
                  className="min-h-[180px] w-full rounded-2xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  disabled={!canPost}
                />
                {mentionQuery && (
                  <div className="rounded-2xl border border-gray-200/70 bg-white p-3 text-xs text-gray-600 shadow-sm">
                    {mentionLoading && <p>Searching...</p>}
                    {!mentionLoading && mentionResults.length === 0 && (
                      <p>No matching usernames.</p>
                    )}
                    {!mentionLoading && mentionResults.length > 0 && (
                      <div className="space-y-2">
                        {mentionResults.map((userOption) => (
                          <button
                            key={userOption.id}
                            onClick={() => insertMention(userOption.username)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-emerald-50"
                          >
                            <span className="font-semibold text-gray-900">{userOption.displayName}</span>
                            <span className="text-emerald-600">@{userOption.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {preview && (
                <div className="min-h-[180px] rounded-2xl border border-emerald-100/70 bg-emerald-50/50 p-4">
                  {newPost.content.trim() ? (
                    <ReactMarkdown components={markdownComponents}>{newPost.content}</ReactMarkdown>
                  ) : (
                    <p className="text-sm text-gray-500">Preview your post here.</p>
                  )}
                  {newPost.imageUrl && (
                    <div className="mt-3 rounded-2xl border border-emerald-100/70 bg-white/80 p-2">
                      <img
                        src={newPost.imageUrl}
                        alt="Attached preview"
                        className="w-full max-h-64 object-cover rounded-xl"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <input
                value={newPost.symbol}
                onChange={(e) => setNewPost({ ...newPost, symbol: e.target.value })}
                placeholder="Symbol"
                className={inputClass}
                disabled={!canPost}
              />
              <input
                value={newPost.tags}
                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                placeholder="Tags (comma separated)"
                className={inputClass}
                disabled={!canPost}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={newPost.assetType}
                onChange={(e) => setNewPost({ ...newPost, assetType: e.target.value })}
                className={selectClass}
                disabled={!canPost}
              >
                <option value="">Asset Type</option>
                {assetTypeOptions.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
              <select
                value={newPost.timeframe}
                onChange={(e) => setNewPost({ ...newPost, timeframe: e.target.value })}
                className={selectClass}
                disabled={!canPost}
              >
                <option value="">Timeframe</option>
                {timeframeOptions.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>

            {newPost.imageUrl && (
              <div className="rounded-2xl border border-emerald-100/70 bg-emerald-50/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-700">
                  <span>Image attached</span>
                  <button
                    type="button"
                    onClick={() => setNewPost((prev) => ({ ...prev, imageUrl: '' }))}
                    className="rounded-full border border-emerald-200/70 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Remove
                  </button>
                </div>
                <img
                  src={newPost.imageUrl}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
            )}

            {imageUploading && <p className="text-xs text-gray-500">Uploading image...</p>}
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
                event.target.value = '';
              }}
            />

            <button
              onClick={handlePostSubmit}
              disabled={!canPost || !newPost.content.trim() || imageUploading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Post Insight
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={showGuidelinesModal}
          onClose={() => setShowGuidelinesModal(false)}
          title="Community Guidelines"
          description="Keep the space disciplined, constructive, and useful."
          size="md"
        >
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            {COMMUNITY_GUIDELINES.map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Modal>
      </div>
    </div>
  );
}
