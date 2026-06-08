const phaseConfig = {
  home: { zh: "主页", en: "Home", emoji: "🏠" },
  emotion_check: { zh: "懂你情绪", en: "Emotions", emoji: "💭" },
  counseling: { zh: "陪你倾诉", en: "Talk", emoji: "💬" },
  insight: { zh: "看见自己", en: "Insight", emoji: "🪞" },
  coaching: { zh: "一起练习", en: "Practice", emoji: "🧘" },
};

const phases = ["emotion_check", "counseling", "insight", "coaching"];

export default function PhaseNavigation({ currentPhase, onNavigate, actionLinks, language }) {
  const isZh = language === "zh";
  const currentIdx = phases.indexOf(currentPhase);

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* 左侧：阶段进度 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate("home")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentPhase === "home"
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            🏠 {isZh ? "主页" : "Home"}
          </button>
          <span className="text-gray-300 mx-1">›</span>
          {phases.map((phase, i) => {
            const config = phaseConfig[phase];
            const isActive = phase === currentPhase;
            const isDone = i < currentIdx;
            return (
              <button
                key={phase}
                onClick={() => onNavigate(phase)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-100 text-indigo-600"
                    : isDone
                    ? "text-green-600 hover:bg-green-50"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {isDone && <span className="mr-1">✓</span>}
                {config.emoji} {isZh ? config.zh : config.en}
              </button>
            );
          })}
        </div>

        {/* 右侧：操作链接 */}
        <div className="flex items-center gap-2">
          {actionLinks
            .filter((link) => link.type === "next")
            .map((link, i) => (
              <button
                key={i}
                onClick={() => onNavigate(link.phase)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-sm"
              >
                {link.label} →
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
