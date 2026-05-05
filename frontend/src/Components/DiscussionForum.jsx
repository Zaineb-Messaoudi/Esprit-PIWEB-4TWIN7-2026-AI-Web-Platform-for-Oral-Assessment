import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, ThumbsUp, Flag, Reply, Trash2, Send,
  AlertTriangle, ChevronDown, ChevronUp, Plus, X,
  Search, Tag, Shield,
  CheckCircle, XCircle, Eye, BarChart2, RefreshCw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const API_BASE = 'http://localhost:3000/forum-posts';

const CATEGORIES = ['General', 'Questions', 'Announcements', 'Resources', 'Off-topic'];

const severityColor = {
  high:   { bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-300',    border: 'border-red-300 dark:border-red-700'   },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  low:    { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300',  border: 'border-blue-300 dark:border-blue-700'  },
  none:   { bg: '',                                  text: '',                                  border: ''                                     },
};

/* ─── Helpers ─────────────────────────────────────────────── */
const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const authorName = (post) => {
  if (!post.authorId) return 'Unknown';
  if (typeof post.authorId === 'object') return post.authorId.name || post.authorId.email || 'User';
  return 'User';
};


/* ─── Avatar ──────────────────────────────────────────────── */
const Avatar = ({ name, size = 36, color = 'red' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = {
    red:  'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  };
  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0 ${colors[color]}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials || '?'}
    </div>
  );
};

/* ─── Flag badge ──────────────────────────────────────────── */
const FlagBadge = ({ reasons = [], severity = 'none' }) => {
  if (!reasons.length) return null;
  const s = severityColor[severity] || severityColor.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${s.bg} ${s.text} ${s.border}`}>
      <AlertTriangle size={10} />
      {reasons.join(', ')}
    </span>
  );
};

/* ─── New Post Modal ──────────────────────────────────────── */
const NewPostModal = ({ onClose, onSubmit, currentUserId, isDark }) => {
  const [form, setForm] = useState({ title: '', content: '', category: 'General' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setLoading(true);
    await onSubmit({ ...form, authorId: currentUserId });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white'}`}>
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>New Post</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <input
            type="text"
            placeholder="Post title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400'
            }`}
          />
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            placeholder="Write your post..."
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={5}
            className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500/50'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400'
            }`}
          />
        </div>
        <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title.trim() || !form.content.trim()}
            className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            Publish
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Reply Box ───────────────────────────────────────────── */
const ReplyBox = ({ postId, currentUserId, onReplyAdded, isDark }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUserId, content }),
      });
      const updated = await res.json();
      onReplyAdded(updated);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mt-3 flex gap-2 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        className={`flex-1 text-sm bg-transparent outline-none resize-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
      />
      <button
        onClick={submit}
        disabled={loading || !content.trim()}
        className="self-end px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
      >
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
        Reply
      </button>
    </div>
  );
};

/* ─── Post Card ───────────────────────────────────────────── */
const PostCard = ({ post, currentUserId, role, onUpvote, onDelete, onFlagReply, onDeleteReply, onPostUpdated, isDark }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReply, setShowReply] = useState(false);
  // Optimistic upvote state only — all other data comes from the post prop
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(null);
  const [optimisticUpvotedBy, setOptimisticUpvotedBy] = useState(null);

  const upvotes = optimisticUpvotes ?? post.upvotes ?? 0;
  const upvotedBy = optimisticUpvotedBy ?? post.upvotedBy ?? [];

  const hasUpvoted = upvotedBy.some(id =>
    typeof id === 'object' ? id._id === currentUserId || id.toString() === currentUserId : id === currentUserId
  );

  const handleUpvote = async () => {
    // Optimistic update
    if (hasUpvoted) {
      setOptimisticUpvotes(upvotes - 1);
      setOptimisticUpvotedBy(upvotedBy.filter(id =>
        typeof id === 'object' ? id._id !== currentUserId && id.toString() !== currentUserId : id !== currentUserId
      ));
    } else {
      setOptimisticUpvotes(upvotes + 1);
      setOptimisticUpvotedBy([...upvotedBy, currentUserId]);
    }
    const updated = await onUpvote(post._id, currentUserId);
    if (updated) {
      // Sync with server truth
      setOptimisticUpvotes(updated.upvotes ?? 0);
      setOptimisticUpvotedBy(updated.upvotedBy ?? []);
    }
  };

  const handleReplyAdded = (updated) => {
    // Reset optimistic state and let parent re-fetch
    setOptimisticUpvotes(null);
    setOptimisticUpvotedBy(null);
    onPostUpdated(updated);
  };

  const isAdmin = role === 'admin';
  const canInteract = role === 'student' || role === 'instructor';

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      post.isFlagged
        ? isDark ? 'border-red-500/30 bg-red-900/10' : 'border-red-200 bg-red-50/50'
        : isDark ? 'border-white/10 bg-white/5 hover:bg-white/8' : 'border-gray-200 bg-white hover:shadow-md'
    }`}>

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar name={authorName(post)} size={38} color="red" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {authorName(post)}
                </span>
                {post.category && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Tag size={9} />
                    {post.category}
                  </span>
                )}
                {isAdmin && <FlagBadge reasons={post.flagReasons} severity={post.flagSeverity} />}
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {timeAgo(post.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canInteract && (
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  hasUpvoted
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <ThumbsUp size={13} fill={hasUpvoted ? 'currentColor' : 'none'} />
                {upvotes}
              </button>
            )}
            {!canInteract && (
              <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <ThumbsUp size={12} /> {upvotes}
              </span>
            )}
          </div>
        </div>

        <h3 className={`mt-2 text-base font-semibold leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {post.title}
        </h3>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className={`text-sm leading-relaxed ${
          expanded ? '' : 'line-clamp-3'
        } ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {post.content}
        </p>
        {post.content?.length > 200 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className={`mt-1 text-xs flex items-center gap-1 transition-colors ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
          >
            {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(e => !e)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <MessageSquare size={13} />
            {post.replies?.length || 0} replies
          </button>
          {canInteract && (
            <button
              onClick={() => { setExpanded(true); setShowReply(r => !r); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Reply size={13} />
              Reply
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              onClick={() => onDelete(post._id)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
              title="Delete post"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {expanded && (
        <div className={`px-4 pb-4 space-y-2 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="pt-3 space-y-2">
            {post.replies?.map((reply, idx) => (
              <div key={idx} className={`flex gap-2.5 p-3 rounded-xl ${isDark ? 'bg-white/3' : 'bg-gray-50'}`}>
                <Avatar name={reply.authorId?.name || 'User'} size={28} color="gray" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {reply.authorId?.name || 'User'}
                      </span>
                      {reply.isAutoFlagged && isAdmin && (
                        <FlagBadge reasons={reply.flagReasons || ['flagged']} severity="low" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {timeAgo(reply.createdAt)}
                      </span>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onFlagReply(post._id, idx)}
                            className={`p-1 rounded transition-colors ${isDark ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-300 hover:text-yellow-600'}`}
                            title="Flag reply"
                          >
                            <Flag size={11} />
                          </button>
                          <button
                            onClick={() => onDeleteReply(post._id, idx)}
                            className={`p-1 rounded transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}
                            title="Delete reply"
                          >
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className={`mt-0.5 text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {reply.content}
                  </p>
                </div>
              </div>
            ))}

            {post.replies?.length === 0 && (
              <p className={`text-sm text-center py-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                No replies yet
              </p>
            )}
          </div>

          {canInteract && showReply && (
            <ReplyBox
              postId={post._id}
              currentUserId={currentUserId}
              onReplyAdded={handleReplyAdded}
              isDark={isDark}
            />
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Admin Stats Panel ───────────────────────────────────── */
const AdminStatsPanel = ({ stats, isDark }) => {
  if (!stats) return null;
  return (
    <div className={`rounded-2xl border p-4 space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
      <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <BarChart2 size={15} className={isDark ? 'text-red-400' : 'text-red-600'} />
        Moderation Stats
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Total Posts',  value: stats.total,    color: isDark ? 'text-white' : 'text-gray-900' },
          { label: 'Flagged',      value: stats.flagged,  color: 'text-red-500' },
          { label: 'Approved',     value: stats.approved, color: 'text-green-500' },
          { label: 'Pending',      value: stats.pending,  color: 'text-yellow-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</p>
          </div>
        ))}
      </div>
      {stats.bySeverity && (
        <div className="space-y-1.5">
          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>By severity</p>
          {Object.entries(stats.bySeverity).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{k}</span>
              <span className={`text-xs font-medium ${severityColor[k]?.text || ''}`}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Forum Component ────────────────────────────────── */
const DiscussionForum = ({ role = 'student', currentUserId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [posts, setPosts]         = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showFlagged, setShowFlagged] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [sortBy, setSortBy]       = useState('newest');

  const isAdmin    = role === 'admin';
  const canPost    = role === 'student' || role === 'instructor';

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const url = isAdmin
        ? (showFlagged ? `${API_BASE}/admin/flagged` : `${API_BASE}/admin/all`)
        : API_BASE;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load posts');
      setPosts(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showFlagged]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stats`);
      if (res.ok) setStats(await res.json());
    } catch (_) {
      // stats are non-critical — silently ignore fetch errors
    }
  }, [isAdmin]);

  useEffect(() => { fetchPosts(); fetchStats(); }, [fetchPosts, fetchStats]);

  const handleCreatePost = async (dto) => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    fetchPosts();
  };

  const handleUpvote = async (postId, userId) => {
    const res = await fetch(`${API_BASE}/${postId}/upvote`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.ok ? res.json() : null;
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    await fetch(`${API_BASE}/${postId}`, { method: 'DELETE' });
    fetchPosts();
  };

  const handleApprove = async (postId) => {
    await fetch(`${API_BASE}/${postId}/approve`, { method: 'PATCH' });
    fetchPosts(); fetchStats();
  };

  const handleFlag = async (postId) => {
    await fetch(`${API_BASE}/${postId}/flag`, { method: 'PATCH' });
    fetchPosts(); fetchStats();
  };

  const handleUnflag = async (postId) => {
    await fetch(`${API_BASE}/${postId}/unflag`, { method: 'PATCH' });
    fetchPosts(); fetchStats();
  };

  const handleFlagReply = async (postId, idx) => {
    await fetch(`${API_BASE}/${postId}/replies/${idx}/flag`, { method: 'PATCH' });
    fetchPosts();
  };

  const handleDeleteReply = async (postId, idx) => {
    if (!window.confirm('Delete this reply?')) return;
    await fetch(`${API_BASE}/${postId}/replies/${idx}`, { method: 'DELETE' });
    fetchPosts();
  };

  /* Filter & sort */
  const filtered = posts
    .filter(p => {
      const matchSearch = !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.content?.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'All' || p.category === filterCat;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'newest')  return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'popular') return (b.upvotes || 0) - (a.upvotes || 0);
      if (sortBy === 'replies') return (b.replies?.length || 0) - (a.replies?.length || 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="text-center mb-6">
        <h2 className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text mb-3 ${
          isDark
            ? 'bg-gradient-to-r from-red-400 to-gray-400'
            : 'bg-gradient-to-r from-red-600 to-gray-700'
        }`}>
          Discussion Forum
        </h2>
        <p className={`text-base max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {isAdmin ? 'Moderate posts and manage community content' : 'Ask questions, share ideas, and connect with classmates'}
        </p>
      </div>

      <div className={`flex gap-6 ${isAdmin ? 'flex-row' : ''}`}>
        {/* Sidebar for admin stats */}
        {isAdmin && (
          <div className="w-56 flex-shrink-0 space-y-4">
            <AdminStatsPanel stats={stats} isDark={isDark} />
            <div className={`rounded-2xl border p-4 space-y-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filter</h3>
              <button
                onClick={() => { setShowFlagged(false); fetchPosts(); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  !showFlagged
                    ? 'bg-red-600 text-white'
                    : isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye size={13} /> All Posts
              </button>
              <button
                onClick={() => { setShowFlagged(true); fetchPosts(); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  showFlagged
                    ? 'bg-red-600 text-white'
                    : isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Flag size={13} /> Flagged Only
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3">
            <div className={`flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            }`}>
              <Search size={15} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`flex-1 text-sm bg-transparent outline-none ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-sm outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-sm outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most upvoted</option>
              <option value="replies">Most replies</option>
            </select>
            {canPost && (
              <button
                onClick={() => setShowNewPost(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Plus size={15} />
                New Post
              </button>
            )}
            <button
              onClick={fetchPosts}
              className={`p-2 rounded-xl border transition-colors ${isDark ? 'border-white/10 text-gray-400 hover:bg-white/10' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Posts list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-32 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
              ))}
            </div>
          ) : error ? (
            <div className={`p-6 rounded-2xl border text-center ${isDark ? 'border-red-500/30 bg-red-900/10 text-red-400' : 'border-red-200 bg-red-50 text-red-600'}`}>
              <AlertTriangle size={24} className="mx-auto mb-2" />
              <p className="text-sm">{error}</p>
              <button onClick={fetchPosts} className="mt-2 text-xs underline">Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`p-12 rounded-2xl border text-center ${isDark ? 'border-white/10 bg-white/3' : 'border-gray-200 bg-gray-50'}`}>
              <MessageSquare size={32} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {search || filterCat !== 'All' ? 'No posts match your filters' : 'No posts yet — be the first!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(post => (
                <div key={post._id}>
                  {/* Admin action bar */}
                  {isAdmin && (post.isFlagged || post.isAutoFlagged) && (
                    <div className={`flex items-center justify-between px-4 py-2 rounded-t-xl border border-b-0 text-xs ${
                      isDark ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Shield size={12} />
                        Auto-flagged · {post.flagSeverity} severity
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFlag(post._id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 transition-colors"
                        >
                          <Flag size={11} /> Flag
                        </button>
                        <button
                          onClick={() => handleApprove(post._id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                        >
                          <CheckCircle size={11} /> Approve
                        </button>
                        <button
                          onClick={() => handleDelete(post._id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                        >
                          <XCircle size={11} /> Remove
                        </button>
                        <button
                          onClick={() => handleUnflag(post._id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 transition-colors"
                        >
                          <X size={11} /> Unflag
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={isAdmin && (post.isFlagged || post.isAutoFlagged) ? 'rounded-t-none' : ''}>
                    <PostCard
                      post={post}
                      currentUserId={currentUserId}
                      role={role}
                      onUpvote={handleUpvote}
                      onDelete={handleDelete}
                      onFlagReply={handleFlagReply}
                      onDeleteReply={handleDeleteReply}
                      onPostUpdated={() => fetchPosts()}
                      isDark={isDark}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New post modal */}
      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          onSubmit={handleCreatePost}
          currentUserId={currentUserId}
          isDark={isDark}
        />
      )}
    </div>
  );
};

export default DiscussionForum;