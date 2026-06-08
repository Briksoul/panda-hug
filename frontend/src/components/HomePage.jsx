const features = [
  {
    id: "emotion",
    emoji: "🎭",
    zh: { title: "情绪识别", desc: "了解你当前的情绪状态" },
    en: { title: "Emotion Recognition", desc: "Understand your current emotional state" },
    color: "from-amber-100 to-orange-100",
    border: "border-amber-200",
  },
  {
    id: "counseling",
    emoji: "💬",
    zh: { title: "倾诉陪伴", desc: "选择舒适的方式，和Panda聊聊" },
    en: { title: "Confiding Company", desc: "Choose a comfortable way to chat with Panda" },
    color: "from-blue-100 to-indigo-100",
    border: "border-blue-200",
  },
  {
    id: "insight",
    emoji: "🪞",
    zh: { title: "看见自己", desc: "生成专属的心理洞察报告" },
    en: { title: "See Yourself", desc: "Generate your personalized insight report" },
    color: "from-pink-100 to-rose-100",
    border: "border-pink-200",
  },
  {
    id: "training",
    emoji: "🧘",
    zh: { title: "正念冥想", desc: "体验融合东西方智慧的放松训练" },
    en: { title: "Mindfulness", desc: "Experience relaxation training" },
    color: "from-teal-100 to-cyan-100",
    border: "border-teal-200",
  },
  {
    id: "knowledge",
    emoji: "📖",
    zh: { title: "心理知识", desc: "探索心理学知识库" },
    en: { title: "Knowledge", desc: "Explore psychology knowledge base" },
    color: "from-purple-100 to-violet-100",
    border: "border-purple-200",
  },
];

export default function HomePage({ onStart, onNavigate, language, loading, sessionId }) {
  const isZh = language === "zh";

  const handleFeatureClick = (id) => {
    if (!sessionId) {
      // 需要先选择语言
      return;
    }
    onNavigate(id);
  };

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero 区域 */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          {/* 熊猫形象 */}
          <div className="relative inline-block mb-8">
            <div className="text-[120px] animate-bounce-slow">🐼</div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/5 rounded-full blur-sm"></div>
          </div>

          {/* 介绍文字 */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#3a2a1a] mb-4">
            {isZh ? "你好，我是 Panda！" : "Hi, I'm Panda!"}
          </h1>
          <p className="text-lg text-[#6a5a4a] max-w-2xl mx-auto mb-2 leading-relaxed">
            {isZh
              ? "在快节奏的世界里，我们常常忽略自己的情绪。我是你的虚拟心理咨询师，陪伴你梳理内心的困惑，为你提供一个安全、温暖的倾诉空间。"
              : "In a fast-paced world, we often ignore our own emotions. As your virtual counselor, I'm here to help you sort out your confusion and provide a safe, warm space."}
          </p>
          <p className="text-sm text-[#8a7a6a] mb-8">
            {isZh
              ? "在这里，你可以卸下防备，和我聊聊那些让你焦虑、迷茫、难过的事。我会在这里，默默倾听你的每一句话。"
              : "Here, you can let your guard down and talk about things that make you anxious, confused, or sad. I'll be here, silently listening."}
          </p>

          {/* 语言选择 / 开始按钮 */}
          {!sessionId ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-[#8a7a6a]">
                {isZh ? "选择语言开始：" : "Select language to start:"}
              </p>
              <div className="flex gap-4">
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
            </div>
          ) : (
            <p className="text-sm text-[#8a7a6a]">
              {isZh ? "点击下方功能，开启你的心灵治愈之旅 ✨" : "Start your soul-healing journey by clicking the functions below ✨"}
            </p>
          )}
        </div>
      </section>

      {/* 功能模块 */}
      {sessionId && (
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat) => (
              <button
                key={feat.id}
                onClick={() => handleFeatureClick(feat.id)}
                className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-lg bg-gradient-to-br ${feat.color} border ${feat.border}`}
              >
                <div className="relative z-10">
                  <div className="text-4xl mb-3">{feat.emoji}</div>
                  <h3 className="text-lg font-bold text-[#3a2a1a] mb-1">
                    {isZh ? feat.zh.title : feat.en.title}
                  </h3>
                  <p className="text-sm text-[#6a5a4a]">
                    {isZh ? feat.zh.desc : feat.en.desc}
                  </p>
                </div>
                <div className="absolute bottom-3 right-3 text-[#8a7a6a] group-hover:text-[#5a4a3a] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
