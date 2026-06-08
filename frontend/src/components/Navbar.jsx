const navItems = [
  { id: "emotion", zh: "情绪识别", en: "Emotion", emoji: "🎭" },
  { id: "counseling", zh: "倾诉陪伴", en: "Confide", emoji: "💬" },
  { id: "insight", zh: "看见自己", en: "Insight", emoji: "🪞" },
  { id: "training", zh: "正念冥想", en: "Mindfulness", emoji: "🧘" },
  { id: "knowledge", zh: "心理知识", en: "Knowledge", emoji: "📖" },
];

export default function Navbar({ currentPage, onNavigate, onNewSession, language, sessionId }) {
  const isZh = language === "zh";
  return (
    <nav className="sticky top-0 z-50 border-b border-[#E0D5C8]/60" style={{ background: "rgba(245,237,227,0.85)", backdropFilter: "blur(16px)" }}>
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <span className="text-xl">🐼</span>
          <span className="font-bold text-[#4A3A2A] text-base tracking-tight">Panda Hug</span>
        </button>
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                currentPage === item.id
                  ? "bg-white/50 text-[#4A3A2A] shadow-sm"
                  : "text-[#A89888] hover:text-[#5A4A3A] hover:bg-white/30"
              }`}>
              {item.emoji} {isZh ? item.zh : item.en}
            </button>
          ))}
        </div>
        {sessionId && (
          <button onClick={onNewSession}
            className="px-3 py-1.5 rounded-lg text-xs text-[#A89888] hover:text-[#5A4A3A] border border-[#E0D5C8] hover:bg-white/40 transition-all">
            {isZh ? "新建会话" : "New"}
          </button>
        )}
      </div>
      {/* 移动端 */}
      <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentPage === item.id ? "bg-white/50 text-[#4A3A2A]" : "text-[#A89888]"
            }`}>
            {item.emoji} {isZh ? item.zh : item.en}
          </button>
        ))}
      </div>
    </nav>
  );
}
