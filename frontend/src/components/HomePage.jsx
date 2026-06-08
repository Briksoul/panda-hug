import { useState } from "react";

const phases = [
  {
    id: "emotion_check",
    emoji: "💭",
    titleZh: "懂你情绪",
    titleEn: "Understand Emotions",
    descZh: "了解你当前的情绪状态",
    descEn: "Understand your current emotional state",
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "counseling",
    emoji: "💬",
    titleZh: "陪你倾诉",
    titleEn: "Talk Together",
    descZh: "选择舒适的方式，和Panda聊聊",
    descEn: "Choose a comfortable way to chat with Panda",
    color: "from-purple-400 to-pink-500",
  },
  {
    id: "insight",
    emoji: "🪞",
    titleZh: "看见自己",
    titleEn: "See Yourself",
    descZh: "生成专属的心理洞察报告",
    descEn: "Generate your personalized insight report",
    color: "from-pink-400 to-rose-500",
  },
  {
    id: "coaching",
    emoji: "🧘",
    titleZh: "一起练习",
    titleEn: "Practice Together",
    descZh: "体验融合东西方智慧的放松训练",
    descEn: "Experience relaxation training blending East and West",
    color: "from-teal-400 to-cyan-500",
  },
];

export default function HomePage({ onNavigate, state, language }) {
  const isZh = language === "zh";
  const profile = state?.profile || {};
  const bearStatus = profile.bear_status || "calm";

  const bearEmoji = {
    happy: "🐻",
    calm: "🐻",
    tired: "🐻",
  }[bearStatus] || "🐻";

  const bearLabel = {
    happy: isZh ? "开心小熊" : "Happy Bear",
    calm: isZh ? "平静小熊" : "Calm Bear",
    tired: isZh ? "疲惫小熊" : "Tired Bear",
  }[bearStatus] || (isZh ? "小熊" : "Bear");

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 顶部欢迎区 */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white py-12 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">{bearEmoji}</div>
          <h1 className="text-3xl font-bold mb-2">
            {isZh ? "你好，我是 Panda！" : "Hi, I'm Panda!"}
          </h1>
          <p className="text-lg opacity-90 mb-4">
            {isZh
              ? "无论你来自哪里，我都会在这里陪伴你。"
              : "No matter where you're from, I'll be here for you."}
          </p>
          {profile.name && (
            <p className="text-sm opacity-75">
              {isZh ? `欢迎回来，${profile.name}` : `Welcome back, ${profile.name}`}
              {profile.emotion_level && ` · ${bearLabel}`}
            </p>
          )}
        </div>
      </div>

      {/* 功能卡片 */}
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
          {isZh ? "选择一个功能开始" : "Choose a feature to begin"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => onNavigate(phase.id)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white border border-gray-100 shadow-sm"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${phase.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="text-4xl mb-3">{phase.emoji}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {isZh ? phase.titleZh : phase.titleEn}
                </h3>
                <p className="text-sm text-gray-500">
                  {isZh ? phase.descZh : phase.descEn}
                </p>
              </div>
              <div className="absolute bottom-3 right-3 text-gray-300 group-hover:text-indigo-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* 快速状态 */}
        {state && (
          <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              {isZh ? "你的状态" : "Your Status"}
            </h3>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-2xl mb-1">{bearEmoji}</div>
                <p className="text-xs text-gray-500">{bearLabel}</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-500">{profile.phq2_score || 0}</div>
                <p className="text-xs text-gray-500">PHQ-2</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">{profile.gad2_score || 0}</div>
                <p className="text-xs text-gray-500">GAD-2</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{profile.turns || 0}</div>
                <p className="text-xs text-gray-500">{isZh ? "对话轮次" : "Turns"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
