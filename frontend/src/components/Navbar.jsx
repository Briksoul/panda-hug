const navItems = [
  { id: "emotion", zh: "情绪识别", en: "Emotion", emoji: "🎭" },
  { id: "counseling", zh: "倾诉陪伴", en: "Confide", emoji: "💬" },
  { id: "insight", zh: "看见自己", en: "Insight", emoji: "🪞" },
  { id: "training", zh: "正念冥想", en: "Mindfulness", emoji: "🧘" },
];

export default function Navbar({ currentPage, onNavigate, onNewSession, language, sessionId }) {
  const isZh = language === "zh";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e8ddd0] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🐼</span>
          <span className="font-bold text-[#5a4a3a] text-lg">Panda Hug</span>
        </button>

        {/* 导航项 */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.id
                  ? "bg-[#f0e6d8] text-[#5a4a3a]"
                  : "text-[#8a7a6a] hover:text-[#5a4a3a] hover:bg-[#f5efe6]"
              }`}
            >
              {item.emoji} {isZh ? item.zh : item.en}
            </button>
          ))}
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-2">
          {sessionId && (
            <button
              onClick={onNewSession}
              className="px-3 py-1.5 rounded-lg text-xs text-[#8a7a6a] hover:text-[#5a4a3a] hover:bg-[#f5efe6] transition-all border border-[#e8ddd0]"
            >
              {isZh ? "新建会话" : "New Session"}
            </button>
          )}
        </div>
      </div>

      {/* 移动端导航 */}
      <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2 scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentPage === item.id
                ? "bg-[#f0e6d8] text-[#5a4a3a]"
                : "text-[#8a7a6a] hover:text-[#5a4a3a]"
            }`}
          >
            {item.emoji} {isZh ? item.zh : item.en}
          </button>
        ))}
      </div>
    </nav>
  );
}
