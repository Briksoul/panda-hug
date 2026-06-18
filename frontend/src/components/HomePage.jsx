import { useState } from "react";
import homePanda from "../assets/panda-1.png";

// 5个核心功能
const features = [
  {
    id: "emotion",
    emoji: "🎭",
    zh: "懂你情绪",
    en: "Emotion Recognition",
  },
  {
    id: "counseling",
    emoji: "💬",
    zh: "陪你倾诉",
    en: "AI Counseling",
  },
  {
    id: "insight",
    emoji: "🪞",
    zh: "看见自己",
    en: "Insight Report",
  },
  {
    id: "training",
    emoji: "🧘",
    zh: "一起练习",
    en: "PERMA Coaching",
  },
  {
    id: "crisis",
    emoji: "🛡️",
    zh: "及时守护",
    en: "Crisis Support",
  },
];

// 留学时长选项
const abroadOptions = [
  { months: 0, zh: "没有留学经历", en: "No study abroad" },
  { months: 3, zh: "不到半年", en: "Less than 6 months" },
  { months: 9, zh: "半年到一年", en: "6 months to 1 year" },
  { months: 18, zh: "一到两年", en: "1-2 years" },
  { months: 30, zh: "两年以上", en: "Over 2 years" },
];

export default function HomePage({ onStart, onNavigate, language, loading, sessionId, onNewSession }) {
  const isZh = language === "zh";
  const [step, setStep] = useState("language"); // language | abroad | main
  const [selectedLang, setSelectedLang] = useState(null);
  const [studyAbroadMonths, setStudyAbroadMonths] = useState(0);

  const handleLanguageSelect = (lang) => {
    setSelectedLang(lang);
    setStep("abroad");
  };

  const handleAbroadSelect = (months) => {
    setStudyAbroadMonths(months);
    onStart(selectedLang, months);
  };

  const handleSkipAbroad = () => {
    onStart(selectedLang, 0);
  };

  // 如果已有会话，显示主界面
  if (sessionId) {
    return (
      <div className="min-h-[calc(100vh-64px)]" style={{ background: "#F2E6D9" }}>
        {/* Hero 区域 */}
        <section className="relative overflow-hidden pt-8 pb-4">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 200" fill="none" opacity="0.15">
              <path d="M0 200 Q200 80 400 160 Q600 60 800 140 Q1000 40 1200 120 L1200 200 Z" fill="#8899AA" />
            </svg>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <div className="relative inline-block mb-6">
              <img
                src={homePanda}
                alt="Panda"
                className="w-48 h-48 object-contain mx-auto"
                style={{ animation: "float 4s ease-in-out infinite" }}
              />
            </div>

            <h2 className="text-2xl font-bold text-[#5A4A3A] mb-3">
              {isZh ? "Hi，我是 Panda！" : "Hi, I'm Panda!"}
            </h2>
            <p className="text-sm text-[#6a5a4a] leading-relaxed max-w-xl mx-auto mb-6">
              {isZh
                ? "无论你来自哪里，无论你现在的心情如何，我都会在这里陪伴你。"
                : "No matter where you're from or how you're feeling, I'll be here for you."}
            </p>

            {onNewSession && (
              <button onClick={onNewSession}
                className="mb-6 px-5 py-2 rounded-xl text-sm text-[#8a7a6a] hover:text-[#5a4a3a] border border-[#d8c8b8] hover:bg-white/40 transition-all">
                {isZh ? "🔄 重新开始" : "🔄 Start Over"}
              </button>
            )}
          </div>
        </section>

        {/* 核心功能区 */}
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div className="flex items-baseline gap-3 mb-4">
            <h3 className="text-xl font-bold text-[#5A4A3A]">
              {isZh ? "核心功能" : "Core Features"}
            </h3>
          </div>
          <div className="rounded-2xl p-6 border border-[#ddd5c8]" style={{ background: "rgba(237,226,212,0.6)" }}>
            <div className="grid grid-cols-5 gap-4">
              {features.map((feat) => (
                <button
                  key={feat.id}
                  onClick={() => onNavigate(feat.id)}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl hover:bg-white/40 transition-all group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{feat.emoji}</span>
                  <span className="text-sm font-bold text-[#5A4A3A] text-center">{feat.zh}</span>
                  <span className="text-xs text-[#998877] text-center">{feat.en}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
      </div>
    );
  }

  // 步骤1：语言选择
  if (step === "language") {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center" style={{ background: "#F2E6D9" }}>
        <div className="relative inline-block mb-8">
          <img
            src={homePanda}
            alt="Panda"
            className="w-40 h-40 object-contain mx-auto"
            style={{ animation: "float 4s ease-in-out infinite" }}
          />
        </div>
        <h2 className="text-2xl font-bold text-[#5A4A3A] mb-2">Panda Hug</h2>
        <p className="text-sm text-[#8a7a6a] mb-8">{isZh ? "跨文化智能心理伴侣" : "Cross-cultural Intelligent Mental Companion"}</p>
        <p className="text-sm text-[#8a7a6a] mb-4">{isZh ? "选择语言开始：" : "Select language:"}</p>
        <div className="flex gap-4">
          <button
            onClick={() => handleLanguageSelect("zh")}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            🇨🇳 中文
          </button>
          <button
            onClick={() => handleLanguageSelect("en")}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-400 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            🇺🇸 English
          </button>
        </div>
        <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
      </div>
    );
  }

  // 步骤2：留学时长（V5 U 型曲线追踪）
  const zhLang = selectedLang === "zh";
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center" style={{ background: "#F2E6D9" }}>
      <div className="max-w-md w-full px-4 text-center">
        <div className="text-5xl mb-4">🌍</div>
        <h2 className="text-xl font-bold text-[#3a2a1a] mb-2">
          {zhLang ? "你有留学或海外生活的经历吗？" : "Have you studied or lived abroad?"}
        </h2>
        <p className="text-sm text-[#8a7a6a] mb-6">
          {zhLang ? "这能帮助我更好地理解你的文化背景" : "This helps me understand your cultural background better"}
        </p>

        <div className="space-y-3">
          {abroadOptions.map((opt) => (
            <button
              key={opt.months}
              onClick={() => handleAbroadSelect(opt.months)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8ddd0] text-[#5a4a3a] font-medium hover:bg-[#f0e6d8] hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {zhLang ? opt.zh : opt.en}
            </button>
          ))}
        </div>

        <button
          onClick={handleSkipAbroad}
          disabled={loading}
          className="mt-4 text-sm text-[#8a7a6a] hover:text-[#5a4a3a] underline disabled:opacity-50"
        >
          {zhLang ? "跳过，直接开始" : "Skip, start now"}
        </button>
      </div>
    </div>
  );
}
