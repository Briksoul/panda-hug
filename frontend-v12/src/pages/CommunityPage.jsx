import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../hooks/useUser'
import { Heart, MessageCircle, UserPlus, Send, X, Plus, Award, Search, ChevronDown } from 'lucide-react'

const API_BASE = '/pandahug/api'

const BADGES = [
  { id: 'light', name: '同行微光', desc: '5篇经验贴', emoji: '✨', threshold: 5 },
  { id: 'speaker', name: '倾诉旅人', desc: '5篇求助贴', emoji: '🎤', threshold: 5 },
  { id: 'helper', name: '渡己渡人', desc: '10篇求助贴+10篇经验贴', emoji: '🌉', threshold: 20 },
  { id: 'solver', name: '解忧同窗', desc: '10篇经验贴', emoji: '💡', threshold: 10 },
]

export default function CommunityPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('all')
  const [showCompose, setShowCompose] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'experience' })
  const [posts, setPosts] = useState([])
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [showBadges, setShowBadges] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedPost, setExpandedPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  // ─── 加载帖子 ────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, size: 20 })
      if (activeTab !== 'all') params.set('type', activeTab)
      if (searchQuery) params.set('q', searchQuery)

      const res = await fetch(`${API_BASE}/community/posts?${params}`)
      if (!res.ok) throw new Error('Failed to load posts')
      const data = await res.json()

      setPosts(prev => append ? [...prev, ...data.posts] : data.posts)
      setTotal(data.total)
      setPage(p)
    } catch (err) {
      console.error('Load posts error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  // ─── 点赞 ────────────────────────────────────────────────────────
  const toggleLike = async (postId) => {
    const userId = user.id || 'anonymous_' + (localStorage.getItem('ph_uid') || (() => {
      const id = 'u_' + Date.now()
      localStorage.setItem('ph_uid', id)
      return id
    })())

    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!res.ok) throw new Error('Like failed')
      const data = await res.json()

      setLikedPosts(prev => {
        const next = new Set(prev)
        if (data.liked) next.add(postId)
        else next.delete(postId)
        return next
      })
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes: data.likes } : p
      ))
    } catch (err) {
      console.error('Like error:', err)
    }
  }

  // ─── 发帖 ────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!newPost.title || !newPost.content) return
    try {
      const res = await fetch(`${API_BASE}/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: user.name || '匿名',
          avatar: '🐼',
          culture_tag: user.cultureTag || 'unknown',
          type: newPost.type,
          title: newPost.title,
          content: newPost.content,
        }),
      })
      if (!res.ok) throw new Error('Post failed')
      const post = await res.json()

      setPosts(prev => [post, ...prev])
      setTotal(prev => prev + 1)
      setNewPost({ title: '', content: '', type: 'experience' })
      setShowCompose(false)
    } catch (err) {
      console.error('Post error:', err)
    }
  }

  // ─── 加载评论 ────────────────────────────────────────────────────
  const loadComments = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
      return
    }
    setExpandedPost(postId)
    setCommentLoading(true)
    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}`)
      if (!res.ok) throw new Error('Failed to load post')
      const data = await res.json()
      setComments(data.comment_list || [])
    } catch (err) {
      console.error('Load comments error:', err)
      setComments([])
    } finally {
      setCommentLoading(false)
    }
  }

  // ─── 发评论 ────────────────────────────────────────────────────────
  const handleComment = async (postId) => {
    if (!newComment.trim()) return
    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: user.name || '匿名',
          content: newComment.trim(),
        }),
      })
      if (!res.ok) throw new Error('Comment failed')
      const comment = await res.json()

      setComments(prev => [...prev, {
        id: comment.id,
        author: comment.author,
        content: comment.content,
        time: comment.time,
      }])
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comments: comment.comment_count } : p
      ))
      setNewComment('')
    } catch (err) {
      console.error('Comment error:', err)
    }
  }

  const cultureLabel = (tag) => {
    if (tag === 'china_in_us') return '🇨🇳'
    if (tag === 'us_in_china') return '🇺🇸'
    return '🌍'
  }

  // ─── 搜索防抖 ────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  return (
    <div className="h-full flex flex-col pb-20">
      {/* ─── Header ─── */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">互助社区</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBadges(!showBadges)}
              className="p-2 rounded-full bg-yellow-50"
            >
              <Award size={18} className="text-yellow-500" />
            </button>
            <button
              onClick={() => setShowCompose(true)}
              className="p-2 rounded-full bg-panda-primary text-white"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="px-6 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="搜索帖子..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-panda-primary"
          />
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="px-6 flex gap-2 mb-3">
        {[
          { id: 'all', label: '全部' },
          { id: 'experience', label: '经验贴 ✨' },
          { id: 'help', label: '求助贴 🆘' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm transition ${
              activeTab === tab.id ? 'bg-panda-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Badges ─── */}
      <AnimatePresence>
        {showBadges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 mb-3 overflow-hidden"
          >
            <div className="card">
              <h3 className="font-bold text-sm mb-3">🏅 徽章激励</h3>
              <div className="grid grid-cols-2 gap-2">
                {BADGES.map(badge => (
                  <div key={badge.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <span className="text-2xl">{badge.emoji}</span>
                    <div>
                      <p className="text-xs font-medium">{badge.name}</p>
                      <p className="text-xs text-gray-400">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Posts ─── */}
      <div className="flex-1 overflow-y-auto px-6 space-y-3">
        {posts.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🐼</p>
            <p className="text-sm">还没有帖子，来发第一条吧！</p>
          </div>
        )}

        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{post.avatar}</span>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">{post.author}</span>
                  <span className="text-xs">{cultureLabel(post.culture_tag)}</span>
                </div>
                <span className="text-xs text-gray-400">{post.time}</span>
              </div>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                post.type === 'experience' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {post.type === 'experience' ? '经验' : '求助'}
              </span>
            </div>
            <h3 className="font-bold text-sm mb-1">{post.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.content}</p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1 text-sm ${
                  likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                <Heart size={16} fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                {post.likes}
              </button>
              <button
                onClick={() => loadComments(post.id)}
                className={`flex items-center gap-1 text-sm ${
                  expandedPost === post.id ? 'text-panda-primary' : 'text-gray-400'
                }`}
              >
                <MessageCircle size={16} />
                {post.comments}
              </button>
              <button className="flex items-center gap-1 text-sm text-gray-400 ml-auto">
                <UserPlus size={16} />
                关注
              </button>
            </div>

            {/* ─── Comments Section ─── */}
            <AnimatePresence>
              {expandedPost === post.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {commentLoading ? (
                      <p className="text-xs text-gray-400 py-2">加载中...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">暂无评论，来说两句吧 💬</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {comments.map(c => (
                          <div key={c.id} className="flex gap-2">
                            <span className="text-xs text-gray-400 mt-0.5">💬</span>
                            <div>
                              <span className="text-xs font-medium text-gray-700">{c.author}</span>
                              <span className="text-xs text-gray-400 ml-2">{c.time}</span>
                              <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment input */}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={expandedPost === post.id ? newComment : ''}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                        placeholder="写评论..."
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-panda-primary"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!newComment.trim()}
                        className="px-3 py-2 rounded-lg bg-panda-primary text-white text-xs disabled:opacity-40"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Load more */}
        {posts.length < total && (
          <button
            onClick={() => fetchPosts(page + 1, true)}
            disabled={loading}
            className="w-full py-3 text-sm text-gray-400 hover:text-panda-primary transition"
          >
            {loading ? '加载中...' : '加载更多 ↓'}
          </button>
        )}
      </div>

      {/* ─── Compose Modal ─── */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowCompose(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[430px] bg-white rounded-t-3xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">发布帖子</h3>
                <button onClick={() => setShowCompose(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                {['experience', 'help'].map(type => (
                  <button
                    key={type}
                    onClick={() => setNewPost(p => ({ ...p, type }))}
                    className={`px-4 py-2 rounded-full text-sm ${
                      newPost.type === type
                        ? type === 'experience' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    {type === 'experience' ? '经验贴 ✨' : '求助贴 🆘'}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="标题"
                value={newPost.title}
                onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                className="w-full p-3 rounded-xl border border-gray-200 mb-3 text-sm focus:outline-none focus:border-panda-primary"
              />

              <textarea
                placeholder="分享你的故事..."
                value={newPost.content}
                onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                rows={5}
                className="w-full p-3 rounded-xl border border-gray-200 mb-4 text-sm resize-none focus:outline-none focus:border-panda-primary"
              />

              <button
                onClick={handlePost}
                disabled={!newPost.title || !newPost.content}
                className="w-full py-3 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={18} /> 发布
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
