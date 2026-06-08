import homePanda from "../assets/panda-1.png";

// 5个核心功能（严格按设计图）
const features = [
  {
    id: "emotion",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto" fill="none" stroke="#5A4A3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="20" r="10" />
        <path d="M12 17c0 0 1.5 4 4 4s4-4 4-4" />
        <circle cx="34" cy="20" r="10" />
        <path d="M30 22c0 0 1.5-4 4-4s4 4 4 4" />
      </svg>
    ),
    zh: "懂你情绪",
    en: "Emotion Recognition",
  },
  {
    id: "counseling",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto" fill="none" stroke="#5A4A3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="40" height="28" rx="6" />
        <circle cx="18" cy="22" r="2" fill="#5A4A3A" />
        <circle cx="25" cy="22" r="2" fill="#5A4A3A" />
        <circle cx="32" cy="22" r="2" fill="#5A4A3A" />
      </svg>
    ),
    zh: "陪你倾诉",
    en: "AI Counseling",
  },
  {
    id: "insight",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto" fill="none" stroke="#5A4A3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 10 C6 10 6 38 24 38 C42 38 42 10 42 10" />
        <path d="M6 10 C6 10 6 38 24 38" />
        <circle cx="24" cy="22" r="4" />
        <circle cx="24" cy="22" r="1.5" fill="#5A4A3A" />
      </svg>
    ),
    zh: "看见自己",
    en: "Insight Report",
  },
  {
    id: "training",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto" fill="none" stroke="#5A4A3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 8 C20 8 16 12 16 16 C16 20 20 22 24 22 C28 22 32 20 32 16 C32 12 28 8 24 8Z" />
        <path d="M24 22 L24 28" />
        <path d="M18 40 L24 28 L30 40" />
        <circle cx="24" cy="36" r="3" />
      </svg>
    ),
    zh: "一起练习",
    en: "East-West Coaching",
  },
  {
    id: "crisis",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto" fill="none" stroke="#5A4A3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4 L6 14 V28 C6 38 24 44 24 44 C24 44 42 38 42 28 V14 Z" />
        <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#5A4A3A" stroke="none">SOS</text>
      </svg>
    ),
    zh: "及时守护",
    en: "Crisis Referral",
  },
];

export default function HomePage({ onStart, onNavigate, language, loading, sessionId }) {
  const isZh = language === "zh";

  return (
    <div className="min-h-[calc(100vh-64px)]" style={{ background: "#F2E6D9" }}>
      {/* Hero 区域 — 云端熊猫 */}
      <section className="relative overflow-hidden pt-8 pb-4">
        {/* 背景云朵装饰 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* 水墨远山 */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 200" fill="none" opacity="0.15">
            <path d="M0 200 Q200 80 400 160 Q600 60 800 140 Q1000 40 1200 120 L1200 200 Z" fill="#8899AA" />
            <path d="M0 200 Q300 120 600 180 Q900 100 1200 160 L1200 200 Z" fill="#AABBCC" opacity="0.5" />
          </svg>
          {/* 云朵 */}
          <div className="absolute top-4 left-[10%] opacity-20">
            <svg width="120" height="60" viewBox="0 0 120 60"><ellipse cx="60" cy="35" rx="50" ry="20" fill="#c8d8e8" /><ellipse cx="40" cy="28" rx="30" ry="18" fill="#d0e0f0" /><ellipse cx="80" cy="28" rx="30" ry="18" fill="#d0e0f0" /></svg>
          </div>
          <div className="absolute top-12 right-[15%] opacity-15">
            <svg width="80" height="40" viewBox="0 0 80 40"><ellipse cx="40" cy="25" rx="35" ry="14" fill="#c8d8e8" /><ellipse cx="25" cy="18" rx="22" ry="12" fill="#d0e0f0" /><ellipse cx="55" cy="18" rx="22" ry="12" fill="#d0e0f0" /></svg>
          </div>
          <div className="absolute top-[40%] left-[5%] opacity-10">
            <svg width="60" height="30" viewBox="0 0 60 30"><ellipse cx="30" cy="18" rx="25" ry="10" fill="#c8d8e8" /></svg>
          </div>
          {/* 小飞机 */}
          <div className="absolute top-8 right-[25%] opacity-20">
            <svg width="60" height="40" viewBox="0 0 60 40">
              <path d="M5 20 L25 18 L35 8 L38 18 L55 20 L38 22 L35 32 L25 22 Z" fill="#8899AA" stroke="#667788" strokeWidth="0.5" />
              <path d="M55 20 Q65 15 70 20" stroke="#667788" strokeWidth="0.5" fill="none" strokeDasharray="2 2" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* 熊猫 + 云朵 */}
          <div className="relative inline-block mb-6">
            {/* 熊猫下方的金色发光云朵 */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-16 opacity-60">
              <svg viewBox="0 0 200 60" fill="none">
                <ellipse cx="100" cy="35" rx="80" ry="20" fill="url(#glow)" />
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#E8C870" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#E8C870" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <img
              src={homePanda}
              alt="Panda"
              className="w-56 h-56 object-contain mx-auto relative z-10"
              style={{ animation: "float 4s ease-in-out infinite" }}
            />
          </div>

          {/* 中英双语介绍 — 左中右布局 */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 max-w-4xl mx-auto mb-6 text-left">
            {/* 中文 */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#5A4A3A] mb-3">
                {isZh ? "你好，我是 Panda！" : "Hi, I'm Panda!"}
              </h2>
              <p className="text-sm text-[#6a5a4a] leading-relaxed">
                {isZh
                  ? "在快节奏的世界里，我们常常忽略自己的情绪。我是你的虚拟心理咨询师，陪伴你梳理内心的困惑，为你提供一个安全、温暖的倾诉空间。在这里，你可以卸下防备，和我聊聊那些让你焦虑、迷茫、难过的事，我会在这里，默默倾听你的每一句话。"
                  : "In a fast-paced world, we often ignore our own emotions. As your virtual counselor, I'm here to accompany you, providing a safe and warm space to pour out your heart."}
              </p>
            </div>
            {/* 英文（中文模式时显示英文，英文模式时显示中文） */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#5A4A3A] mb-3">
                {!isZh ? "你好，我是 Panda！" : "Hi, I'm Panda!"}
              </h2>
              <p className="text-sm text-[#6a5a4a] leading-relaxed">
                {!isZh
                  ? "在快节奏的世界里，我们常常忽略自己的情绪。我是你的虚拟心理咨询师，陪伴你梳理内心的困惑，为你提供一个安全、温暖的倾诉空间。在这里，你可以卸下防备，和我聊聊那些让你焦虑、迷茫、难过的事，我会在这里，默默倾听你的每一句话。"
                  : "In a fast-paced world, we often ignore our own emotions. As your virtual counselor, I'm here to accompany you, providing a safe and warm space to pour out your heart. Here, you can let your guard down and talk about things that make you anxious, confused, or sad. I'll be here, silently listening to every word."}
              </p>
            </div>
          </div>

          <p className="text-sm text-[#b8a090] font-medium mb-6">
            {isZh
              ? "点击下方功能，开启你的心灵治愈之旅"
              : "Start your soul-healing journey by clicking the functions below"}
          </p>
        </div>
      </section>

      {/* 核心功能区 */}
      {sessionId ? (
        <section className="max-w-5xl mx-auto px-4 pb-8">
          {/* 标题 */}
          <div className="flex items-baseline gap-3 mb-4">
            <h3 className="text-xl font-bold text-[#5A4A3A]">
              {isZh ? "核心功能" : "Core Features"}
            </h3>
            <span className="text-sm text-[#998877] uppercase tracking-wider">
              {!isZh ? "核心功能" : "CORE FEATURES"}
            </span>
          </div>
          {/* 功能卡片 — 5个水平排列 */}
          <div
            className="rounded-2xl p-6 border border-[#ddd5c8]"
            style={{ background: "rgba(237,226,212,0.6)" }}
          >
            <div className="grid grid-cols-5 gap-4">
              {features.map((feat) => (
                <button
                  key={feat.id}
                  onClick={() => onNavigate(feat.id)}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl hover:bg-white/40 transition-all group"
                >
                  <div className="text-[#5A4A3A] group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <span className="text-sm font-bold text-[#5A4A3A] text-center">
                    {feat.zh}
                  </span>
                  <span className="text-xs text-[#998877] text-center">
                    {feat.en}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* 未登录 — 语言选择 */
        <section className="max-w-md mx-auto px-4 pb-12 text-center">
          <p className="text-sm text-[#8a7a6a] mb-4">
            {isZh ? "选择语言开始：" : "Select language to start:"}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onStart("zh")}
              disabled={loading}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
            >
              🇨🇳 中文
            </button>
            <button
              onClick={() => onStart("en")}
              disabled={loading}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-400 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
            >
              🇺🇸 English
            </button>
          </div>
        </section>
      )}

      {/* 底部导航 */}
      <footer className="max-w-5xl mx-auto px-4 pb-6">
        <div className="border-t border-[#d8c8b8] pt-4 text-center">
          <p className="text-xs text-[#b8a090] tracking-wider">
            Home &nbsp; Links &nbsp; Blog &nbsp; Contact
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
