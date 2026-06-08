import { useState } from "react";
import homePanda from "../assets/home-panda.png";

// 5个核心功能 — 严格按设计图
const features = [
  {
    id: "emotion",
    zh: "懂你情绪",
    en: "Emotion Recognition",
    icon: (
      <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#5A4A3A" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="20" cy="28" r="12" />
        <path d="M15 25 Q17.5 30 22.5 25" />
        <circle cx="44" cy="28" r="12" />
        <path d="M41 30 Q43.5 25 46.5 30" />
        <path d="M32 48 Q32 42 32 42" strokeWidth="2" />
        <circle cx="32" cy="50" r="1.5" fill="#5A4A3A" />
      </svg>
    ),
  },
  {
    id: "counseling",
    zh: "陪你倾诉",
    en: "AI Counseling",
    icon: (
      <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#5A4A3A" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 14 C8 10 12 6 18 6 H46 C52 6 56 10 56 14 V34 C56 38 52 42 46 42 H26 L16 52 V42 H18 C12 42 8 38 8 34 Z" />
        <circle cx="26" cy="24" r="2.5" fill="#5A4A3A" />
        <circle cx="33" cy="24" r="2.5" fill="#5A4A3A" />
        <circle cx="40" cy="24" r="2.5" fill="#5A4A3A" />
      </svg>
    ),
  },
  {
    id: "insight",
    zh: "看见自己",
    en: "Insight Report",
    icon: (
      <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#5A4A3A" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 8 C10 8 8 56 32 56 C56 56 54 8 54 8" />
        <path d="M10 8 C10 8 8 56 32 56" />
        <path d="M10 8 Q32 14 54 8" />
        <circle cx="32" cy="30" r="8" />
        <circle cx="32" cy="30" r="3" fill="#5A4A3A" />
        <path d="M28 44 Q32 48 36 44" />
      </svg>
    ),
  },
  {
    id: "training",
    zh: "一起练习",
    en: "East-West Coaching",
    icon: (
      <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#5A4A3A" strokeWidth="1.5" strokeLinecap="round">
        {/* 莲花 */}
        <path d="M32 20 C28 14 20 12 16 16 C12 20 16 28 32 32 C48 28 52 20 48 16 C44 12 36 14 32 20Z" />
        <path d="M32 32 C28 28 22 28 20 30" />
        <path d="M32 32 C36 28 42 28 44 30" />
        {/* 打坐人形 */}
        <circle cx="32" cy="42" r="4" />
        <path d="M24 54 L28 48 L32 50 L36 48 L40 54" />
        <path d="M28 48 L24 44" />
        <path d="M36 48 L40 44" />
      </svg>
    ),
  },
  {
    id: "crisis",
    zh: "及时守护",
    en: "Crisis Referral",
    icon: (
      <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none" stroke="#5A4A3A" strokeWidth="1.5" strokeLinecap="round">
        <path d="M32 4 L8 18 V36 C8 50 32 60 32 60 C32 60 56 50 56 36 V18 Z" />
        <text x="32" y="38" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#5A4A3A" stroke="none">SOS</text>
      </svg>
    ),
  },
];

export default function HomePage({ onStart, onNavigate, language, loading, sessionId }) {
  const isZh = language === "zh";
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #F5EDE3 0%, #F2E6D9 40%, #EDE0D0 100%)" }}>
      {/* Hero 区域 */}
      <section className="relative overflow-hidden pt-6 pb-2">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* 水墨远山 */}
          <svg className="absolute bottom-0 left-0 w-full h-48" viewBox="0 0 1440 200" preserveAspectRatio="none" opacity="0.08">
            <path d="M0,200 C240,80 480,160 720,100 C960,40 1200,140 1440,80 L1440,200 Z" fill="#8899AA" />
            <path d="M0,200 C360,140 720,180 1080,120 C1260,90 1380,150 1440,130 L1440,200 Z" fill="#AABBCC" />
          </svg>
          {/* 云朵装饰 */}
          {[
            { left: "5%", top: "8%", scale: 0.7, opacity: 0.12 },
            { left: "75%", top: "5%", scale: 0.5, opacity: 0.1 },
            { left: "85%", top: "25%", scale: 0.4, opacity: 0.08 },
            { left: "10%", top: "35%", scale: 0.3, opacity: 0.06 },
          ].map((c, i) => (
            <div key={i} className="absolute" style={{ left: c.left, top: c.top, opacity: c.opacity, transform: `scale(${c.scale})` }}>
              <svg width="200" height="100" viewBox="0 0 200 100">
                <ellipse cx="100" cy="60" rx="80" ry="30" fill="#c8d8e8" />
                <ellipse cx="65" cy="45" rx="50" ry="28" fill="#d5e5f5" />
                <ellipse cx="135" cy="45" rx="50" ry="28" fill="#d5e5f5" />
              </svg>
            </div>
          ))}
          {/* 小飞机 */}
          <div className="absolute top-6 right-[20%] opacity-15" style={{ animation: "fly 8s linear infinite" }}>
            <svg width="50" height="30" viewBox="0 0 50 30" fill="#8899AA">
              <path d="M2 15 L18 13 L28 4 L30 13 L48 15 L30 17 L28 26 L18 17 Z" />
              <path d="M48 15 Q55 10 58 15" stroke="#8899AA" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          {/* 熊猫 + 光效 */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* 金色光晕 */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-20 rounded-full"
                style={{ background: "radial-gradient(ellipse, rgba(232,200,112,0.3) 0%, transparent 70%)" }} />
              {/* 熊猫 */}
              <img src={homePanda} alt="Panda" className="w-52 h-52 object-contain relative z-10 drop-shadow-lg"
                style={{ animation: "float 4s ease-in-out infinite" }} />
            </div>
          </div>

          {/* 中英双语介绍 — 左右并排 */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 max-w-4xl mx-auto mb-4 text-left">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#4A3A2A] mb-3 tracking-tight">
                {isZh ? "你好，我是 Panda！" : "Hi, I'm Panda!"}
              </h2>
              <p className="text-sm text-[#6B5B4B] leading-[1.9]">
                {isZh
                  ? "在快节奏的世界里，我们常常忽略自己的情绪。我是你的虚拟心理咨询师，陪伴你梳理内心的困惑，为你提供一个安全、温暖的倾诉空间。在这里，你可以卸下防备，和我聊聊那些让你焦虑、迷茫、难过的事，我会在这里，默默倾听你的每一句话。"
                  : "In a fast-paced world, we often ignore our own emotions. As your virtual counselor, I'm here to accompany you, providing a safe and warm space to pour out your heart."}
              </p>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#4A3A2A] mb-3 tracking-tight">
                {!isZh ? "你好，我是 Panda！" : "Hi, I'm Panda!"}
              </h2>
              <p className="text-sm text-[#6B5B4B] leading-[1.9]">
                {!isZh
                  ? "在快节奏的世界里，我们常常忽略自己的情绪。我是你的虚拟心理咨询师，陪伴你梳理内心的困惑，为你提供一个安全、温暖的倾诉空间。在这里，你可以卸下防备，和我聊聊那些让你焦虑、迷茫、难过的事，我会在这里，默默倾听你的每一句话。"
                  : "In a fast-paced world, we often ignore our own emotions. As your virtual counselor, I'm here to accompany you, providing a safe and warm space to pour out your heart. Here, you can let your guard down and talk about things that make you anxious, confused, or sad. I'll be here, silently listening to every word."}
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-[#B8A090] font-medium mb-6">
            {isZh ? "点击下方功能，开启你的心灵治愈之旅" : "Start your soul-healing journey by clicking the functions below"}
          </p>
        </div>
      </section>

      {/* 核心功能区 */}
      {sessionId ? (
        <section className="max-w-4xl mx-auto px-6 pb-12">
          {/* 标题 */}
          <div className="flex items-baseline gap-3 mb-5">
            <h3 className="text-xl font-bold text-[#4A3A2A]">{isZh ? "核心功能" : "Core Features"}</h3>
            <span className="text-xs text-[#A89888] uppercase tracking-[0.2em] font-medium">{!isZh ? "核心功能" : "CORE FEATURES"}</span>
          </div>
          {/* 功能卡片容器 */}
          <div className="rounded-2xl border border-[#D8C8B8]/50 p-8" style={{ background: "rgba(237,226,212,0.5)", backdropFilter: "blur(8px)" }}>
            <div className="grid grid-cols-5 gap-6">
              {features.map((feat) => (
                <button key={feat.id} onClick={() => onNavigate(feat.id)}
                  onMouseEnter={() => setHoveredCard(feat.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="flex flex-col items-center gap-3 py-6 px-3 rounded-xl transition-all duration-300 relative group"
                  style={{
                    background: hoveredCard === feat.id ? "rgba(255,255,255,0.5)" : "transparent",
                    boxShadow: hoveredCard === feat.id ? "0 4px 20px rgba(0,0,0,0.06)" : "none",
                  }}>
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    {feat.icon}
                  </div>
                  <span className="text-sm font-bold text-[#4A3A2A] text-center leading-tight">{feat.zh}</span>
                  <span className="text-[11px] text-[#A89888] text-center">{feat.en}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="max-w-md mx-auto px-6 pb-16 text-center">
          <p className="text-sm text-[#8A7A6A] mb-5">{isZh ? "选择语言开始：" : "Select language to start:"}</p>
          <div className="flex gap-5 justify-center">
            <button onClick={() => onStart("zh")} disabled={loading}
              className="px-10 py-3.5 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #E8B84B, #E8943A)" }}>
              🇨🇳 中文
            </button>
            <button onClick={() => onStart("en")} disabled={loading}
              className="px-10 py-3.5 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #5B8DEF, #7B5BF0)" }}>
              🇺🇸 English
            </button>
          </div>
        </section>
      )}

      {/* 底部导航 */}
      <footer className="max-w-4xl mx-auto px-6 pb-8">
        <div className="border-t border-[#D0C0B0]/60 pt-5 text-center">
          <p className="text-xs text-[#B8A090] tracking-[0.3em] font-medium">
            Home &nbsp;&nbsp; Links &nbsp;&nbsp; Blog &nbsp;&nbsp; Contact
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fly { 0%{transform:translateX(-100px)} 100%{transform:translateX(calc(100vw + 100px))} }
      `}</style>
    </div>
  );
}
