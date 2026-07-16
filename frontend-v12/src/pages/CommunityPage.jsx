import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../hooks/useUser'
import { Heart, MessageCircle, UserPlus, Send, X, Plus, Award, Clock, Search } from 'lucide-react'

const MOCK_POSTS = [
  {
    id: 1,
    author: '小林',
    avatar: '🧑‍🎓',
    cultureTag: 'china_in_us',
    type: 'experience',
    title: '如何在美国大学交到真正的朋友',
    content: '来美国第一年真的很孤独，后来我加入了学校的国际学生俱乐部，认识了很多和我有同样经历的朋友。分享三个我觉得最有用的方法...',
    likes: 42,
    comments: 15,
    time: '2小时前',
    tags: ['社交', '经验'],
  },
  {
    id: 2,
    author: 'Sarah',
    avatar: '👩‍🎓',
    cultureTag: 'us_in_china',
    type: 'help',
    title: 'Language barrier in daily life - 日常生活中的语言障碍',
    content: 'I\'ve been in Shanghai for 3 months now. Sometimes I feel frustrated because I can\'t express myself well in Chinese. Does anyone have tips for managing this frustration?',
    likes: 28,
    comments: 23,
    time: '5小时前',
    tags: ['语言', '求助'],
  },
  {
    id: 3,
    author: '阿杰',
    avatar: '👨‍💻',
    cultureTag: 'china_in_us',
    type: 'experience',
    title: '期末考试压力大？试试这个方法',
    content: '美国大学的考试方式和国内很不一样，我一开始也很不适应。后来我找到了一套适合自己的学习方法，GPA从2.8提升到了3.5...',
    likes: 56,
    comments: 31,
    time: '1天前',
    tags: ['学业', '经验'],
  },
  {
    id: 4,
    author: 'Emily',
    avatar: '👩‍🔬',
    cultureTag: 'us_in_china',
    type: 'help',
    title: 'Feeling homesick during holidays',
    content: '春节快到了，看到同学们都回家团聚，我一个人在宿舍真的很想家。在美国的时候从来没有这么强烈的感觉...',
    likes: 35,
    comments: 18,
    time: '2天前',
    tags: ['思乡', '求助'],
  },
  {
    id: 5,
    author: '小王',
    avatar: '🧑‍🎨',
    cultureTag: 'china_in_us',
    type: 'experience',
    title: '我是如何克服文化冲击的',
    content: '刚来美国的时候，我觉得什么都格格不入。但慢慢地，我学会了在两种文化之间找到平衡。关键是要保持开放的心态...',
    likes: 67,
    comments: 42,
    time: '3天前',
    tags: ['文化适应', '经验'],
  },
]

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
  const [posts, setPosts] = useState(MOCK_POSTS)
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [showBadges, setShowBadges] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isWednesday = new Date().getDay() === 3

  const filteredPosts = posts.filter(p => {
    if (activeTab !== 'all' && p.type !== activeTab) return false
    if (searchQuery && !p.title.includes(searchQuery) && !p.content.includes(searchQuery)) return false
    return true
  })

  const toggleLike = (postId) => {
    setLikedPosts(prev => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
    setPosts(prev => prev.map(p => {
      if (p.id === postId) return { ...p, likes: p.likes + (likedPosts.has(postId) ? -1 : 1) }
      return p
    }))
  }

  const handlePost = () => {
    if (!newPost.title || !newPost.content) return
    const post = {
      id: Date.now(),
      author: user.name || '匿名',
      avatar: '🐼',
      cultureTag: user.cultureTag,
      type: newPost.type,
      title: newPost.title,
      content: newPost.content,
      likes: 0,
      comments: 0,
      time: '刚刚',
      tags: [newPost.type === 'experience' ? '经验' : '求助'],
    }
    setPosts(prev => [post, ...prev])
    setNewPost({ title: '', content: '', type: 'experience' })
    setShowCompose(false)
  }

  const cultureLabel = (tag) => {
    if (tag === 'china_in_us') return '🇨🇳'
    if (tag === 'us_in_china') return '🇺🇸'
    return '🌍'
  }

  return (
    <div className="h-full flex flex-col pb-20">
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
        {!isWednesday && (
          <div className="bg-orange-50 rounded-xl p-3 flex items-center gap-2 mb-3">
            <Clock size={16} className="text-orange-500" />
            <p className="text-xs text-orange-700">社区每周三 00:00-24:00 开放</p>
          </div>
        )}
      </div>

      <div className="px-6 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索帖子..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-panda-primary"
          />
        </div>
      </div>

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

      <div className="flex-1 overflow-y-auto px-6 space-y-3">
        {filteredPosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{post.avatar}</span>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">{post.author}</span>
                  <span className="text-xs">{cultureLabel(post.cultureTag)}</span>
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
              <button className="flex items-center gap-1 text-sm text-gray-400">
                <MessageCircle size={16} />
                {post.comments}
              </button>
              <button className="flex items-center gap-1 text-sm text-gray-400 ml-auto">
                <UserPlus size={16} />
                关注
              </button>
            </div>
          </motion.div>
        ))}
      </div>

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
