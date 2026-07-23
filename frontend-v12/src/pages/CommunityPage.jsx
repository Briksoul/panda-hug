import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { Award, Heart, Mail, MessageCircle, Plus, Search, Send, UserPlus, X } from 'lucide-react'
import { apiFetch } from '../utils/api'

const BADGES = [
  {
    id: 'light',
    name: { zh: '同行微光', en: 'Guiding Light' },
    desc: { zh: '5篇经验贴', en: '5 experience posts' },
    emoji: '✨',
    threshold: 5,
  },
  {
    id: 'speaker',
    name: { zh: '倾诉旅人', en: 'Open-Hearted Traveler' },
    desc: { zh: '5篇求助贴', en: '5 help posts' },
    emoji: '🎤',
    threshold: 5,
  },
  {
    id: 'helper',
    name: { zh: '渡己渡人', en: 'Bridge Builder' },
    desc: { zh: '10篇求助贴+10篇经验贴', en: '10 help posts + 10 experience posts' },
    emoji: '🌉',
    threshold: 20,
  },
  {
    id: 'solver',
    name: { zh: '解忧同窗', en: 'Problem-Solving Peer' },
    desc: { zh: '10篇经验贴', en: '10 experience posts' },
    emoji: '💡',
    threshold: 10,
  },
]

const TRANSLATIONS = {
  zh: {
    title: '互助社区',
    badgesButton: '查看徽章',
    createPostButton: '发布帖子',
    searchPlaceholder: '搜索帖子...',
    all: '全部',
    experiencePost: '经验贴 ✨',
    helpPost: '求助贴 🆘',
    badgeIncentives: '🏅 徽章激励',
    emptyPosts: '还没有帖子，来发第一条吧！',
    experience: '经验',
    help: '求助',
    likePost: '点赞',
    viewComments: '查看评论',
    following: '已关注',
    follow: '关注',
    privateMessage: '私信',
    loading: '加载中...',
    emptyComments: '暂无评论，来说两句吧 💬',
    commentPlaceholder: '写评论...',
    sendComment: '发送评论',
    loadMore: '加载更多 ↓',
    close: '关闭',
    postTitlePlaceholder: '标题',
    postContentPlaceholder: '分享你的故事...',
    publish: '发布',
    messageHeading: (name) => `与 ${name} 私信`,
    emptyMessages: '还没有私信记录。',
    messagePlaceholder: '输入私信...',
    sendMessage: '发送私信',
  },
  en: {
    title: 'Support Community',
    badgesButton: 'View badges',
    createPostButton: 'Create post',
    searchPlaceholder: 'Search posts...',
    all: 'All',
    experiencePost: 'Experience ✨',
    helpPost: 'Help 🆘',
    badgeIncentives: '🏅 Badge Rewards',
    emptyPosts: 'No posts yet. Be the first to share!',
    experience: 'Experience',
    help: 'Help',
    likePost: 'Like post',
    viewComments: 'View comments',
    following: 'Following',
    follow: 'Follow',
    privateMessage: 'Message',
    loading: 'Loading...',
    emptyComments: 'No comments yet. Start the conversation 💬',
    commentPlaceholder: 'Write a comment...',
    sendComment: 'Send comment',
    loadMore: 'Load more ↓',
    close: 'Close',
    postTitlePlaceholder: 'Title',
    postContentPlaceholder: 'Share your story...',
    publish: 'Publish',
    messageHeading: (name) => `Message ${name}`,
    emptyMessages: 'No messages yet.',
    messagePlaceholder: 'Write a message...',
    sendMessage: 'Send message',
  },
}

function formatRelativeTime(timestamp, language) {
  if (!timestamp) return ''
  const difference = Math.max(0, Date.now() / 1000 - timestamp)
  if (difference < 60) return language === 'en' ? 'Just now' : '刚刚'
  if (difference < 3600) {
    const minutes = Math.floor(difference / 60)
    return language === 'en' ? `${minutes} min ago` : `${minutes}分钟前`
  }
  if (difference < 86400) {
    const hours = Math.floor(difference / 3600)
    return language === 'en' ? `${hours} hr ago` : `${hours}小时前`
  }
  const days = Math.floor(difference / 86400)
  return language === 'en' ? `${days} days ago` : `${days}天前`
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useUser()
  const language = user?.language === 'en' ? 'en' : 'zh'
  const text = TRANSLATIONS[language]
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
  const [badgeProgress, setBadgeProgress] = useState([])
  const [messageTarget, setMessageTarget] = useState(null)
  const [privateMessages, setPrivateMessages] = useState([])
  const [privateInput, setPrivateInput] = useState('')

  // Load posts
  const fetchPosts = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, size: 20 })
      if (activeTab !== 'all') params.set('type', activeTab)
      if (searchQuery) params.set('q', searchQuery)

      const res = await apiFetch(`/community/posts?${params}`)
      if (!res.ok) throw new Error('Failed to load posts')
      const data = await res.json()

      setPosts(prev => append ? [...prev, ...data.posts] : data.posts)
      setLikedPosts((previous) => {
        const next = append ? new Set(previous) : new Set()
        data.posts.forEach((post) => {
          if (post.is_liked) next.add(post.id)
        })
        return next
      })
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

  useEffect(() => {
    if (!showBadges || !isAuthenticated) return
    apiFetch('/community/me/badges')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setBadgeProgress(data.badges || []))
      .catch((error) => console.error('Failed to load badges:', error))
  }, [showBadges, isAuthenticated])

  const toggleFollow = async (post) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!post.author_id) return
    const response = await apiFetch(`/community/users/${post.author_id}/follow`, {
      method: 'POST',
    })
    if (!response.ok) return
    const data = await response.json()
    setPosts((current) => current.map((item) => (
      item.author_id === post.author_id
        ? { ...item, is_following: data.following }
        : item
    )))
  }

  const openMessages = async (post) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!post.is_following || !post.author_id) return
    const response = await apiFetch(`/community/messages/${post.author_id}`)
    if (!response.ok) return
    const data = await response.json()
    setMessageTarget({ id: post.author_id, name: post.author })
    setPrivateMessages(data.messages || [])
  }

  const sendPrivateMessage = async () => {
    if (!privateInput.trim() || !messageTarget) return
    const response = await apiFetch(`/community/messages/${messageTarget.id}`, {
      method: 'POST',
      body: JSON.stringify({ content: privateInput.trim() }),
    })
    if (!response.ok) return
    const message = await response.json()
    setPrivateMessages((current) => [...current, message])
    setPrivateInput('')
  }

  // Toggle post like
  const toggleLike = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      const res = await apiFetch(`/community/posts/${postId}/like`, {
        method: 'POST',
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

  // Create a post
  const handlePost = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!newPost.title || !newPost.content) return
    try {
      const res = await apiFetch('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
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

  // Load comments
  const loadComments = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
      return
    }
    setExpandedPost(postId)
    setCommentLoading(true)
    try {
      const res = await apiFetch(`/community/posts/${postId}`)
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

  // Create a comment
  const handleComment = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!newComment.trim()) return
    try {
      const res = await apiFetch(`/community/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
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
        created_at: comment.created_at,
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
    if (tag === 'china_in_us' || tag === 'chinese_in_us') return '🇨🇳'
    if (tag === 'us_in_china' || tag === 'american_in_china') return '🇺🇸'
    return '🌍'
  }

  // Debounce search input
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
          <h1 className="text-xl font-bold">{text.title}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBadges(!showBadges)}
              aria-label={text.badgesButton}
              title={text.badgesButton}
              className="p-2 rounded-full bg-yellow-50"
            >
              <Award size={18} className="text-yellow-500" />
            </button>
            <button
              onClick={() => isAuthenticated ? setShowCompose(true) : navigate('/login')}
              aria-label={text.createPostButton}
              title={text.createPostButton}
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
            placeholder={text.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-panda-primary"
          />
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="px-6 flex gap-2 mb-3">
        {[
          { id: 'all', label: text.all },
          { id: 'experience', label: text.experiencePost },
          { id: 'help', label: text.helpPost },
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
              <h3 className="font-bold text-sm mb-3">{text.badgeIncentives}</h3>
              <div className="grid grid-cols-2 gap-2">
                {BADGES.map(badge => (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      badgeProgress.find((item) => item.id === badge.id)?.unlocked
                        ? 'bg-yellow-50'
                        : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <span className="text-2xl">{badge.emoji}</span>
                    <div>
                      <p className="text-xs font-medium">{badge.name[language]}</p>
                      <p className="text-xs text-gray-400">{badge.desc[language]}</p>
                      {isAuthenticated && (
                        <p className="text-xs text-panda-primary">
                          {badgeProgress.find((item) => item.id === badge.id)?.progress || 0}
                          /{badge.threshold}
                        </p>
                      )}
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
            <p className="text-sm">{text.emptyPosts}</p>
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
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(post.created_at, language)}
                </span>
              </div>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                post.type === 'experience' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {post.type === 'experience' ? text.experience : text.help}
              </span>
            </div>
            <h3 className="font-bold text-sm mb-1">{post.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.content}</p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleLike(post.id)}
                aria-label={text.likePost}
                className={`flex items-center gap-1 text-sm ${
                  likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                <Heart size={16} fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                {post.likes}
              </button>
              <button
                onClick={() => loadComments(post.id)}
                aria-label={text.viewComments}
                className={`flex items-center gap-1 text-sm ${
                  expandedPost === post.id ? 'text-panda-primary' : 'text-gray-400'
                }`}
              >
                <MessageCircle size={16} />
                {post.comments}
              </button>
              {post.author_id && post.author_id !== user?.id && (
                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={() => toggleFollow(post)}
                    className={`flex items-center gap-1 text-sm ${
                      post.is_following ? 'text-panda-primary' : 'text-gray-400'
                    }`}
                  >
                    <UserPlus size={16} />
                    {post.is_following ? text.following : text.follow}
                  </button>
                  {post.is_following && (
                    <button
                      onClick={() => openMessages(post)}
                      className="flex items-center gap-1 text-sm text-gray-400"
                    >
                      <Mail size={16} />
                      {text.privateMessage}
                    </button>
                  )}
                </div>
              )}
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
                      <p className="text-xs text-gray-400 py-2">{text.loading}</p>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">{text.emptyComments}</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {comments.map(c => (
                          <div key={c.id} className="flex gap-2">
                            <span className="text-xs text-gray-400 mt-0.5">💬</span>
                            <div>
                              <span className="text-xs font-medium text-gray-700">{c.author}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                {formatRelativeTime(c.created_at, language)}
                              </span>
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
                        placeholder={text.commentPlaceholder}
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-panda-primary"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!newComment.trim()}
                        aria-label={text.sendComment}
                        title={text.sendComment}
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
            {loading ? text.loading : text.loadMore}
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
                <h3 className="font-bold text-lg">{text.createPostButton}</h3>
                <button
                  onClick={() => setShowCompose(false)}
                  aria-label={text.close}
                  title={text.close}
                >
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
                    {type === 'experience' ? text.experiencePost : text.helpPost}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder={text.postTitlePlaceholder}
                value={newPost.title}
                onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                className="w-full p-3 rounded-xl border border-gray-200 mb-3 text-sm focus:outline-none focus:border-panda-primary"
              />

              <textarea
                placeholder={text.postContentPlaceholder}
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
                <Send size={18} /> {text.publish}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {messageTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setMessageTarget(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[75dvh] w-full max-w-[430px] flex-col rounded-t-3xl bg-white p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">{text.messageHeading(messageTarget.name)}</h3>
                <button
                  onClick={() => setMessageTarget(null)}
                  aria-label={text.close}
                  title={text.close}
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="min-h-40 flex-1 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
                {privateMessages.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">{text.emptyMessages}</p>
                )}
                {privateMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <p className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      message.sender_id === user.id
                        ? 'bg-panda-primary text-white'
                        : 'bg-white text-gray-700'
                    }`}>
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={privateInput}
                  onChange={(event) => setPrivateInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && sendPrivateMessage()}
                  placeholder={text.messagePlaceholder}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-panda-primary focus:outline-none"
                />
                <button
                  onClick={sendPrivateMessage}
                  disabled={!privateInput.trim()}
                  aria-label={text.sendMessage}
                  title={text.sendMessage}
                  className="rounded-xl bg-panda-primary px-4 text-white disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
